## Context

See `proposal.md` — Why. What shapes the approach here is the shape of the
existing transport and of the library, both verified against the code and the
published package rather than from documentation:

**The existing transport is request/response; a streaming one is added.**
`McpChatApi.sendChatMessage(messages, enabledTools, signal, conversationId)`
returns `Promise<ChatResponse>`. `POST /chat` in
`plugins/mcp-chat-backend/src/routes/chatRoutes.ts` calls
`mcpClientService.processQuery(...)` and only then answers
`{ role: 'assistant', content, toolResponses, toolsUsed, conversationId }`.
Tool calls run **server-side**, inside `processQuery`, and are reported after the
fact as `ToolExecutionResult[]` — `{ id, name, arguments, result, serverId }`.
The frontend never executes a tool.

Streaming is in scope for this change, so that endpoint is joined by a
server-sent-event one. The constraint that shapes the design is the provider
layer: `LLMProvider` (`plugins/mcp-chat-node/src/LLMProvider.ts`) is an **abstract
class** whose `sendMessage` returns a complete `ChatResponse`, and there are
**nine** provider modules extending it (`openai`, `anthropic`, `amazon-bedrock`,
`gemini`, `ollama`, `litellm`, `azure-openai`, `openai-responses`,
`agentgateway`). Adding an abstract streaming method would break all nine at
once. `QueryProcessor.processQuery` also has two paths — the tool-calling loop and
a separate `processQueryWithResponsesApi` for providers reporting
`supportsNativeMcp()`.

**The library at `@assistant-ui/react@0.15.16`.** `useExternalStoreRuntime` and
`ExternalStoreAdapter` re-export from `@assistant-ui/core@0.3.15`. On
`ExternalStoreAdapter`, only `onNew` is required. `unstable_enableToolInvocations`
defaults to `false`, which is what we want: the runtime then does not drive
client-side tool callbacks and simply renders the tool-call parts we put in
`messages`. `ThreadMessageLike` accepts a `status`, and `MessageStatus` covers
`{ type: 'running' }`, `{ type: 'complete', reason }` and
`{ type: 'incomplete', reason: 'cancelled' | 'error' | ... }` — which is how a
partially streamed turn is represented. The package ships **no CSS** and pulls in
no Tailwind — its primitives are unstyled Radix wrappers, so it composes with CSS
modules over BUI tokens.

**`adapters.threadList` is flagged unstable.** In
`external-store-adapter.d.ts`, the `threadList` slot itself and its `threadId`,
`onSwitchToNewThread` and `onSwitchToThread` members each carry
`@deprecated This API is still under active development and might change without notice.`
Its thread model is `{ status: 'regular' | 'archived', id, remoteId, externalId,
title, custom }` — no search, and no third state to carry "starred".

**Backstage constraints.** Workspace `mcp-chat` pins Backstage `1.40.0`, which
requires React 18; the workspace lockfile already resolves `react@18.3.1`. The
target for new UI in this repository is `@backstage/ui` plus `@remixicon/react`,
not `@backstage/core-components` or Material UI icons.

## Goals / Non-Goals

**Goals**

- Add streaming without touching the existing `POST /chat` contract or the
  existing page.
- Keep the nine provider modules compiling and working untouched, so streaming can
  be adopted per provider instead of in one flag-day change.
- Give the frontend a single code path whether or not the active provider streams.
- Keep the new page's failure modes independent of the existing page's.
- Depend only on stable Assistant UI surface.
- Keep the reduced side panel's data layer as existing hooks, so panel behaviour
  stays consistent between the two pages.

**Non-Goals**

- No refactor of `ChatContainer`, `RightPane` or `ChatPage`, and no shared
  presentation component extracted between old and new page. Duplicated markup
  is accepted for this change: the old components are Material UI and the new
  ones are BUI, so a shared component would have to satisfy both.
- No change to the behaviour of `sendChatMessage` or `POST /chat`, and no
  database or conversation-schema change.
- No native incremental output implemented in the nine provider modules here —
  only the seam and the fallback.
- No Assistant UI Cloud, no `AssistantCloud`, no remote thread list.
- No WebSocket transport.

## Decisions

### Transport: server-sent events on a new route

A new `POST /chat/stream` sits beside `POST /chat`, taking the same body and
answering `text/event-stream`. SSE is chosen over the alternatives because the
traffic is one-directional (the client sends one request, then only reads), it
rides the existing HTTP stack and Backstage auth with no new infrastructure, and
`fetchApi.fetch` already gives the frontend a readable body stream plus an
`AbortSignal` for cancellation.

Rejected: WebSockets (bidirectional machinery for a one-way flow, plus proxy and
auth complications for no gain); chunked JSON lines over the existing route
(would change `POST /chat`'s response type, breaking the current page); polling
(no incremental output).

The event names and payloads are fixed by
`specs/mcp-chat/chat-streaming/spec.md` — a text fragment event, a tool-call
event, a tool-result event, and exactly one terminal completion-or-failure event.
Shared payload types live in `mcp-chat-common` so backend and frontend cannot
drift.

### Provider streaming: optional method on the base class, never abstract

`LLMProvider` is abstract and nine modules extend it, so a new `abstract`
streaming method would fail to compile in all nine at once. Instead the base class
gains a **concrete** `streamMessage` whose default implementation awaits the
existing `sendMessage` and emits the whole reply as one fragment, plus a
`supportsStreaming()` returning `false` by default. A module opts in by overriding
both.

This is what lets the capability ship now and be honest about it: the endpoint and
its contract exist for every provider today, the frontend has one code path, and
each module can gain native streaming later without touching the route, the
adapter or the page. `supportsStreaming()` is surfaced on provider status so the
UI can distinguish real streaming from the fallback rather than pretending.

The `processQueryWithResponsesApi` path used by `supportsNativeMcp()` providers
keeps returning a complete response and is served by the same fallback, so
native-MCP providers are covered from day one without that path being rewritten
here.

Rejected: making the method abstract and updating nine modules in one change
(large blast radius, and it would block the frontend on provider work);
frontend-side fake streaming that chunks a complete reply for visual effect
(dishonest — it would report streaming while nothing streams, and the spec's
capability-reporting requirement exists precisely to avoid that).

### Tool events during a run

The tool-calling loop in `QueryProcessor` already knows when it is about to invoke
a tool and when the result lands, so the streaming variant emits a tool-call event
before invoking and a tool-result event after, correlated by the invocation id.
That is what lets the page show an invocation as running before its outcome
exists, which the non-streaming path could never express.

A failed or timed-out tool produces a tool-result marked failed and the run
continues to its terminal event, matching the current behaviour where a tool
failure does not abort the reply.

### Runtime: `useExternalStoreRuntime`, not `useLocalRuntime`

`useLocalRuntime` takes a `ChatModelAdapter` whose `run` may return
`AsyncGenerator<ChatModelRunResult, void>` — the idiomatic streaming shape, and on
the face of it the obvious choice now that we stream. It is still not the right
fit: it moves the message list inside the runtime, whereas two spec'd behaviours
need it in React state that the page owns — selecting a stored conversation
replaces the whole list, and the reduced side panel drives that selection. With
`useLocalRuntime` that becomes `ExportedMessageRepository` import gymnastics on
every selection.

`useExternalStoreRuntime` keeps React state as the single source of truth: the
stream consumer appends each fragment to the last assistant turn's text and marks
it `status: { type: 'running' }`, flipping to `complete` on the terminal event and
`incomplete` with reason `error` or `cancelled` otherwise. Rendering follows from
state, so streaming needs no runtime concept the adapter does not already have.
Conversation persistence also stays the backend's job, keyed by `conversationId`.

Rejected: `useLocalRuntime` (above); `useAssistantTransportRuntime` /
`AssistantCloud` (assume protocols the backend does not speak).

### Handler matrix

`ExternalStoreAdapter` is populated as follows. The set differs in two places
from the one sketched in the parent issue, for reasons given below.

| Member                                         | Used                   | Maps to                                                                                                           |
| ---------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `messageRepository`                            | yes                    | the linear path plus the versions of its last answer, as an `ExportedMessageRepository`                           |
| `messages`                                     | **no**                 | superseded by `messageRepository` — see "Alternative answers" below                                               |
| `convertMessage`                               | **not on the adapter** | still the turn → `ThreadMessageLike` mapper, applied by the hook when it builds the repository                    |
| `isRunning`                                    | yes                    | true from submit until the terminal event, drives the running indicator                                           |
| `isLoading`                                    | yes                    | true while a stored conversation is being fetched                                                                 |
| `onNew`                                        | yes (required)         | append user turn, then consume the event stream, updating state per event                                         |
| `setMessages`                                  | yes                    | lets the runtime rewrite the list — **required for cancel and for branch switching to survive the next snapshot** |
| `onEdit`                                       | yes                    | truncate to the edited turn, re-stream from it                                                                    |
| `onReload`                                     | yes                    | re-stream from a `parentId`, adding a version to the last answer                                                  |
| `onCancel`                                     | yes                    | `AbortController.abort()`, closing the stream, then drop the partial turn                                         |
| `onDelete`                                     | no                     | not in the spec; no per-message delete affordance                                                                 |
| `onAddToolResult`                              | **no**                 | see below                                                                                                         |
| `unstable_onBranchChange`                      | **no**                 | deprecated, and `setMessages` already carries the switch — see "Alternative answers"                              |
| `unstable_enableToolInvocations`               | **no** (left `false`)  | tools run server-side                                                                                             |
| `adapters.threadList`                          | **no**                 | see "Conversation list" below                                                                                     |
| `adapters.attachments` / `speech` / `feedback` | no                     | no backend support                                                                                                |

**`onAddToolResult` is deliberately omitted**, against the parent issue's
assumption. That handler exists so a _client-side_ tool can hand its result back
to the runtime; the type doc states results flow through it "from `execute()`
returning, or from `streamCall` resolving". In `mcp-chat` every tool executes
server-side and its result arrives in the stream we convert into message parts,
so nothing would ever call it. Wiring it would be dead code, and
enabling the tracker that drives it (`unstable_enableToolInvocations: true`)
would make the runtime try to dispatch our server-side tool calls a second time.

**`setMessages` is not optional in practice.** Its type doc is explicit: without
it, "cancelling a run leaves a trailing user message in the thread and the
composer untouched". Since cancel is a spec'd scenario, `setMessages` is
required to satisfy it.

### Message conversion and streaming state

`convertMessage` maps one view-model message to a `ThreadMessageLike`. An
assistant turn's `content` array is built as: one `{ type: 'text', text }` part
carrying the text accumulated so far, preceded by one
`{ type: 'tool-call', toolCallId, toolName, args, result, isError }` part per
invocation — `id` → `toolCallId`, `name` → `toolName`, `arguments` → `args`,
`result` → `result`.

Streaming makes the turn's lifecycle explicit through `ThreadMessageLike.status`:

- fragments still arriving → `{ type: 'running' }`
- terminal completion → `{ type: 'complete', reason: 'stop' }`
- terminal failure → `{ type: 'incomplete', reason: 'error' }`, keeping whatever
  text had arrived, which is what the spec's "failure after partial output"
  scenario requires
- cancelled → `{ type: 'incomplete', reason: 'cancelled' }` before the partial
  turn is dropped

A tool-call part is written as soon as the tool-call event arrives, with `result`
absent — that absence is what the tool UI renders as "still running" — and is
filled in place, keyed by `toolCallId`, when its tool-result event lands. Keying
by id is what keeps a resolving invocation from appearing twice.

The backend's tool-result event carries an explicit failure flag, so `isError` is
read from the event rather than inferred from the payload as the non-streaming
path would have required.

This is the seam that lets tool rendering meet its spec without any client-side
tool machinery: the parts are already in the message, and the `tools.Fallback`
slot of `MessagePrimitive.Parts` renders them.

### Alternative answers: the last answer only, no persistence change

Regenerating an answer used to overwrite the previous one. It no longer does: the
answer stays available and the new one is added beside it. The scope is
deliberately narrow — **only the latest user turn** ever carries more than one
answer. Editing any turn, and regenerating an older turn's answer, still truncate.

The state is a linear `path` plus a `tailVersions` list and the index shown:

```
path         : PromptTurn[]   // the conversation up to the branch point
tailVersions : PromptTurn[]   // the versions of the last answer, oldest first
tailIndex    : number         // which one is on screen
```

There is one branch point and it never moves: the last user turn. That is what
this decision buys, and what it deliberately does not buy.

**Why not the general tree.** A tree of turns — every user turn forking, every
branch kept — requires `ConversationRecord.messages` to become nodes chained by
`parentId`, the head to be persisted, and every adopter's existing rows to be
migrated. That is a persistence change, and this change committed to none
(see Non-Goals). Confining alternatives to the tail keeps the stored conversation
a flat `ChatMessage[]`: `ConversationRecord`, `ConversationRow` and the database
schema are untouched, and no adopter runs a migration. The full tree is left to a
later proposal, which would own the schema and the migration.

**Why `messageRepository` rather than `messages`.** A flat array cannot express
two answers to one prompt, and `BranchPickerPrimitive` reads
`MessageRepository.getBranches(messageId)` — the siblings of a message. So the
adapter passes a repository built by
`ExportedMessageRepository.fromBranchableArray(items, { headId })`, where every
tail version carries the last user turn as its `parentId` and `headId` names the
version on screen. This is a deliberate change of adapter shape, not an
incidental one: the test that pins the adapter's key set was updated to match
rather than worked around.

Two consequences follow from the runtime's own code and are worth stating:

- With `messageRepository`, the runtime no longer calls `convertMessage`. It is
  still the turn → `ThreadMessageLike` mapper, but the hook applies it itself when
  it assembles the repository. Handing it to the runtime as well would be worse
  than redundant: with a converter present, `setMessages` receives the messages
  bound to their external originals, and a repository's messages have no such
  binding, so the callback would be handed an empty list.
- `setMessages` therefore takes `ThreadMessage`, and only the ids in it are
  meaningful — the content is the hook's already. Two rewrites arrive that way: a
  branch switch, where the path is unchanged and the trailing id names the version
  to show, and a removal, where the path itself shrank. An id the hook no longer
  holds is dropped rather than resurrected, which is what keeps the runtime's
  post-cancel resync from putting an abandoned turn back.

**`unstable_onBranchChange` is not a dependency.** It is deprecated, and its own
type doc says switching "still requires `setMessages`, and this callback does not
on its own enable branch switching". Since `setMessages` already carries the
switch, wiring the callback would add an unstable surface for no capability. Same
criterion that ruled out `adapters.threadList`.

**Where the selection is persisted.** The backend stores what a run posts, and a
run posts the path — which ends with the answer that was shown. So the selected
version is the one the next run persists, and the tail's other versions are
abandoned at that same moment. This keeps the model bounded and the stored
conversation honest, at one cost worth naming: switching version does not by
itself write anything, so a user who switches back and reloads the page before
running again sees the version the last run stored. Making a bare switch durable
needs a route that rewrites a stored conversation's messages, which is a
persistence change this iteration excluded.

**Truncation is announced before it applies.** Editing an older turn removes
everything after it, and that is not recoverable. The edit composer states how
many turns saving would discard, before the save — without it, correcting a typo
six exchanges up silently removes those exchanges and reads as a bug.

**A note on cost.** Regenerating re-runs the MCP tools server-side. Keeping the
previous answer has a measurable effect: comparing two phrasings costs one
regeneration instead of two, and depending on what an adopter plugs in, a
re-execution is not free.

### Tool call UI: one catch-all in `MessagePrimitive.Parts`

MCP tool names are configuration-driven and unknown at build time, so no
per-tool component can be registered. A single fallback tool UI renders every
tool-call part uniformly — name, collapsed arguments and result, copy action,
error styling — replacing what `ToolCallDetails` does today, in BUI with
`@remixicon/react` icons.

That single renderer is registered through the component override of
`MessagePrimitive.Parts`, as
`components={{ tools: { Fallback: <the renderer> } }}` — `Fallback` is the slot
the library uses for any tool it has no specific renderer for, so it is
name-agnostic by construction. `by_name` stays unused, for want of names known at
build time.

`makeAssistantToolUI` — and its `useAssistantToolUI` hook — is deliberately
**not** used, for two reasons. Its `AssistantToolUIProps` requires
`toolName: string`, binding a renderer to one exact name, which is the one thing
configuration-driven names cannot supply. And the whole trio is marked
`@deprecated` in `0.15.16`, which is the same criterion that rules out
`adapters.threadList` for the conversation list below.

One constraint follows from the slot: in `MessagePrimitiveParts.Props`,
`components` is a union whose `ChainOfThoughtComponents` variant types `tools` as
`never`. The parts are therefore mounted with the standard variant, and the
chain-of-thought grouping is not used.

### Conversation list: own component, not `adapters.threadList`

This settles the question the parent issue left open, and it is the one place
this design departs from the parent issue's stated target of "thread list pour
l'historique".

Assistant UI's thread list would cost us the two features the panel has today.
Its thread status is exactly `regular | archived`; "starred" has no
representation, and mapping star onto `archived` is wrong — the backend has no
archive concept, only `DELETE /conversations/:id`, so an "unarchived" thread and
a deleted one are the same thing. There is no search anywhere in the adapter.
And the slot plus its switching handlers are all marked as possibly changing
without notice, which is a poor foundation for a published plugin.

So the panel keeps its own conversation list over the existing
`useConversations`, which already supplies `conversations`,
`starredConversations`, `recentConversations`, `searchQuery` / `setSearchQuery`,
`loadConversation`, `deleteConversation` and `toggleStar` — every spec'd
behaviour, already implemented and already tested. Selecting a conversation
calls `loadConversation(id)` and pushes the result into the runtime's `messages`
state plus the active `conversationId`; "new conversation" clears both.

Trade-off accepted: we forgo Assistant UI's `ThreadListPrimitive` markup and its
future thread features, and we keep `useConversations`' client-side search, which
only filters the page the backend returned. Both are contained in the panel.

Migration path if the slot stabilises: `ExternalStoreThreadData.custom` with
`onUpdateCustom` is where `isStarred` would live, and search would stay a panel
concern above the adapter either way, since the adapter has no search notion to
grow into.

Rejected alternatives: thread list with star dropped (loses a working feature to
adopt an unstable API); star mapped onto `archived` (semantically wrong, and
`onUnarchive` has no backend counterpart).

### Layout, styling, NFS wiring

`@backstage/ui` for layout and controls, CSS modules with BUI design tokens,
`@remixicon/react` for icons. Assistant UI primitives are unstyled, so they take
our class names directly and no vendor stylesheet is imported.

A new `promptRouteRef` joins `rootRouteRef` in `src/routes.ts`; a second
`PageBlueprint` is added to `src/alpha.tsx` and registered in the plugin's
`routes` map; the page component is lazy-loaded through `src/wiring.ts` like
`chatPageContentLoader` is. Both blueprints coexist in the one
`createFrontendPlugin` call.

### Peer dependency range

`@assistant-ui/react@0.15.16` declares peers `react`/`react-dom` `^18 || ^19`,
while the plugin declares `^17.0.0 || ^18.0.0`. Keeping React 17 in range would
publish a package whose peers cannot all be satisfied. The range is narrowed to
`^18` — the intersection — for `react`, `react-dom` and `@types/react`. Backstage
1.40 requires React 18 and the workspace resolves `18.3.1`, so this documents
reality rather than dropping working support. `^18 || ^19` is not adopted:
nothing else in the workspace is tested against React 19.

## Risks / Trade-offs

- **Streaming ships as a contract before most providers implement it** → Every
  provider is reachable through the endpoint from day one via the base-class
  fallback, so nothing is broken; but a user on a non-streaming provider sees the
  reply arrive in one piece. Mitigated by surfacing `supportsStreaming()` on
  provider status so the UI states which mode is active rather than implying
  token-by-token output everywhere. Per-provider work is tracked as follow-up.
- **The streaming path duplicates the tool-calling loop's logic** → Two code paths
  through `QueryProcessor` can drift, so tool filtering by enabled server and the
  system-prompt injection must be factored into helpers both paths call rather than
  copied. Tests cover both paths against the same fixtures.
- **SSE through proxies and load balancers can buffer** → Set the conventional
  no-buffering response headers and keep events small. If an adopter's ingress
  still buffers, the fallback behaviour (whole reply in one fragment) is what they
  observe — degraded, not broken.
- **A dropped connection mid-run could orphan provider or tool work** → The route
  ties an `AbortController` to client disconnect, and the spec forbids starting new
  tool invocations for a cancelled run. A tool already in flight still runs to its
  timeout; that is accepted.
- **Assistant UI is pre-1.0 (`0.15.16`)** → Depend only on non-`unstable_`,
  non-deprecated surface (this is what rules out `adapters.threadList`). Pin an
  exact-minor range and treat upgrades as reviewed changes.
- **The dependency tree grows by ~10 transitive packages** → All MIT, verified.
  `yarn dedupe` is run and `yarn dedupe --check` gated in CI. `zod` and `zustand`
  arriving in the workspace risks duplicate resolutions; dedupe before `tsc:full`,
  since duplicate copies of one library surface as spurious type errors.
- **Two chat UIs to maintain, now over two transports** → Accepted and time-boxed:
  retiring the old page is a separate decision once the new one has adopter
  feedback. The old page stays on `POST /chat`, which this change does not touch.
- **Duplicated panel presentation between old and new page** → Accepted: the data
  layer (`useMcpServers`, `useProviderStatus`, `useConversations`) is shared, only
  the markup is not, because the two pages target different component libraries.

## Migration Plan

Additive and adopter-driven, on both sides. The new page ships behind its own
route and is not mounted automatically; the streaming endpoint is a new route that
nothing else calls. Adopters who upgrade without mounting the page get the new
endpoint and keep the old behaviour untouched.

Deployment order matters in one direction only: the backend package must be
deployed before the new page is mounted, since the page calls the new route. An
adopter who mounts the page against an older backend gets a 404 on the streaming
route — the page's transport-failure requirement covers that, showing an error
with a retry rather than hanging.

Rollback is removing the mount; the existing page and `POST /chat` are unchanged,
so there is no data, schema or route migration to reverse. The only change visible
to an adopter who does nothing is the narrowed React peer range.

## Open Questions

- ~~Which path the new route should take (`/mcp-chat/prompt` as a child of the
  existing path, or a sibling such as `/mcp-chat-prompt`).~~ **Settled during
  task group 3: `/mcp-chat-prompt`, a sibling.** A child path would sit under the
  existing page's own path, so the two mounts could shadow one another depending
  on how the app orders its routes; a sibling makes that impossible. As noted, the
  choice does not affect the adapter, the panel or the task breakdown.
- Whether the reduced panel should default to collapsed on narrow viewports. A
  presentation detail with no spec'd behaviour attached.
