## Context

What the `aws-genai` stack does today, as read from the sources this change
touches:

- `POST /v1/chat` (`aws-genai-backend/src/service/router.ts`) already answers
  with `text/event-stream`. The body is `{ userMessage, sessionId, agentName }`;
  the response is a sequence of `ChatEvent`s validated by a **strict** zod
  discriminated union in `aws-genai-common/src/events.ts`:
  `ResponseEvent` (first, carries the session id), `ChunkEvent` (a reply
  fragment), `ToolEvent` (`{ name, input }`, emitted on tool start) and
  `ErrorEvent`. There is no terminal event: the stream simply ends.
- **Conversation memory is server-side.** A request carries one `userMessage`,
  never the prior turns. `LangGraphReactAgentType` runs the agent with
  `configurable.thread_id = sessionId` against a `BaseCheckpointSaver`
  (Postgres, SQLite or in-memory), and injects the system prompt only when the
  session is new.
- **Tools come from the MCP actions registry.** `Agent.getAgentActions` calls
  `ActionsService.list` and keeps the actions whose names appear in
  `genai.agents.<name>.actions`. The selected `ActionsServiceAction[]` is passed
  **per run** into `AgentType.stream`, which turns each into a
  `DynamicStructuredTool` whose `func` calls `ActionsService.invoke`.
- **Search is fixed per action.** `search-catalog` builds
  `types[0]=software-catalog`, `search-techdocs` builds `types[0]=techdocs`.
  Backstage exposes no API that enumerates the index types a search backend has
  collators for, so the set of indexes cannot be discovered at runtime.
- **Sessions exist, turns do not.** `chat_sessions` holds
  `(session_id, principal, agent, created, last_activity, ended)` and
  `DatabaseSessionStore.getSessionsForUser` is implemented but unreachable: no
  route exposes it. Turns live in `localStorage` via `ChatSessionManager`, and in
  the checkpointer in whatever shape the agent type chose.
- The frontend is a new-frontend-system plugin with one `PageBlueprint` at
  `/aws-genai/:agentName` and a deprecated old-frontend-system mirror under
  `src/components-ofs/`.

The reference implementation for the page itself is
`workspaces/mcp-chat/plugins/mcp-chat/src/components/PromptPage` — same library,
same repository, already reviewed. Its differences from what `aws-genai` needs are
what this design is mostly about.

## Goals / Non-Goals

**Goals:**

- A second page whose conversational mechanics come from `@assistant-ui/react`,
  not from hand-written primitives.
- The reach of a run — its tools and its search indexes — visible and selectable
  before the prompt is sent, and enforced server-side.
- Conversations that survive a browser, listed newest first and reopenable.
- Every backend addition additive: an older frontend and the historical page keep
  working byte for byte.
- No agent-type change, so third-party `AgentType` implementations inherit the
  new behaviour instead of having to opt in.

**Non-Goals:**

- Editing a prompt, regenerating an answer, branching (needs thread truncation on
  the agent-type abstraction).
- A new streaming endpoint or a second transport: `POST /v1/chat` already streams.
- Sending the conversation in the request. Memory stays server-side.
- Retiring the historical page, or giving the modern page an
  old-frontend-system entry.
- Changing `POST /v1/generate`, `POST /v1/mcp/:agent` or the MCP server surface.

## Decisions

### Runtime: `useExternalStoreRuntime` over the existing SSE transport

The page holds its turn list in React state and hands Assistant UI an
`ExternalStoreAdapter`, exactly as the `mcp-chat` prompt page does.
`useLocalRuntime` was rejected: it wants to own the message list and drive a
`ChatModelAdapter`, which fights a transport that already streams and a page that
must also apply a stored conversation and a run scope.

The handler set is fixed here, and it is **narrower** than `mcp-chat`'s:

| Handler / field                  | Provided     | Why                                                              |
| -------------------------------- | ------------ | ---------------------------------------------------------------- |
| `messages`                       | yes          | Flat list: no alternatives, so no `messageRepository` is needed. |
| `convertMessage`                 | yes          | Maps a turn to `ThreadMessageLike`, including `tool-call` parts. |
| `isRunning`                      | yes          | A run is in flight.                                              |
| `isLoading`                      | yes          | A stored conversation is being fetched.                          |
| `onNew`                          | yes          | Submit a prompt.                                                 |
| `setMessages`                    | yes          | Lets a cancel-time removal survive the runtime's resync.         |
| `onCancel`                       | yes          | Abort the run.                                                   |
| `onEdit`                         | **no**       | Server-side memory would keep the discarded turns.               |
| `onReload`                       | **no**       | Same.                                                            |
| `onAddToolResult`                | **no**       | Every tool runs server-side.                                     |
| `adapters.threadList`            | **no**       | See _Conversation list_ below.                                   |
| `unstable_enableToolInvocations` | left `false` | Client-side invocation is not wanted.                            |

Omitting `onEdit` and `onReload` is what makes the edit and regenerate controls
absent from the surface rather than present and wrong.

### Run completion: end of stream, not a terminal event

`POST /v1/chat` sends no terminal event, and `ResponseEvent` — which carries the
session id — arrives **first**, not last. The adapter therefore treats the end of
the stream as completion: the assistant turn is marked complete when the reader
drains, and marked interrupted when an `ErrorEvent` arrived first. Adding a
terminal `CompleteEvent` was rejected: it buys nothing the stream end does not
already say, and every new event type is a compatibility hazard (below).

### Tool results: an opt-in event, because the client parser is strict

`ToolEvent` reports a tool starting with `{ name, input }` and nothing reports its
outcome, so a run's tool calls can only be rendered as "started". Two facts
constrain the fix: the invocation needs an **id** to be filled in place, and
`AgentApiClient` runs every payload through `EventSchema.parse`, a strict
discriminated union that **throws on an unknown `type`**. Emitting a new event
unconditionally would break an older frontend pointed at a newer backend.

So: `ToolEvent` gains an **optional** `id`, a new `ToolResultEvent`
(`{ id, output, isError }`) is added to the union, and the backend emits neither
`id` nor `ToolResultEvent` unless the request opted in with a
`toolResults: true` flag. The historical page never sets it and so never sees
one. Rejected alternatives: making the client parser lenient (fixes new clients,
not deployed ones); versioning the endpoint (a second route to maintain for one
event).

The invocation id is minted by the backend when it emits `ToolEvent`, not read
from the agent type: `AgentType.stream` yields `ChatEvent`s and the langgraph
transform has no id to give. Correlation is positional — the id is attached as the
event passes through the backend, and the matching result event reuses it.

### Run scope is applied where the tools are chosen, not inside the actions

`Agent.getAgentActions` is the one place that already decides what a run may
reach, and its result is passed **per run** into `AgentType.stream`. Scoping there
means no agent type changes and a third-party agent type inherits the behaviour.

The alternative — having each action read the run's scope — was rejected:
`ActionsService.invoke` carries only `input` and `credentials`, so a scope would
have to travel through a side channel keyed on credentials, and every third-party
action would have to cooperate.

**Tool selection.** The request's `enabledActions` intersects the configured
allowlist. Absent field means "all configured", which is what keeps an older
client's behaviour identical. An empty array means "none", and is a legitimate
request: the user asked for a run with no tools.

**Search index scoping.** Config declares the indexes and which actions cover
them:

```yaml
genai:
  search:
    indexes:
      - type: software-catalog
        title: Software Catalog
        actions: [search-catalog]
      - type: techdocs
        title: TechDocs
        actions: [search-techdocs, read-techdocs]
```

Unset, it defaults to exactly those two entries — the indexes the core actions
cover. Config is the source because Backstage has no runtime enumeration of
collators, and because the mapping from an action to the indexes it reads is
knowledge the action does not publish.

Enforcement then has two arms:

1. An action all of whose declared indexes are disabled is **withheld** from the
   run. This is what a single-index action such as `search-techdocs` needs.
2. An action covering several enabled-and-disabled indexes has its **index
   argument narrowed**: the `types` field of its input schema is rebuilt as an
   enum over the enabled subset, with that subset as its default. This is why
   `search-catalog` and `search-techdocs` stop hardcoding
   `types[0]=<literal>` and take `types` as an optional input defaulted to their
   historical value — an unscoped invocation is unchanged, a scoped one cannot
   reach a disabled index even if the model asks.

An empty `enabledSearchIndexes` withholds every search-capable action; the page
says so rather than pretending the agent can still look things up. Putting the
enabled indexes in the system prompt instead was rejected as advisory: a model is
free to ignore it, and the whole point is reducing noise deterministically.

### Conversation history: turns in the plugin's own table

Listing conversations needs no new storage — `chat_sessions` and
`getSessionsForUser` are already there, only unrouted. Replaying one does. Three
sources were considered:

1. **The langgraph checkpointer.** Exactly the messages the model sees, no
   duplication. Rejected: it is reachable only through the agent type, which would
   need a new method on a public extension point implemented outside this
   repository, and with the default `memory` setting the checkpointer is
   in-memory, so "recent conversations" would not survive a backend restart.
2. **`localStorage`, as today.** Rejected: the criterion is a user's recent
   conversations, not this browser's.
3. **A turn table in the plugin's own database.** Chosen. Agent-type agnostic,
   durable wherever the plugin's database is, and it makes the title a column
   rather than a derived string.

The store therefore gains `chat_session_messages`
(`session_id`, `sequence`, `role`, `content`, `tool_invocations`, `created`) and
`chat_sessions` gains a nullable `title`, both in one additive migration. Turns
are written as a run terminates: the user prompt and the assistant reply that
answered it, with the invocations observed on the stream. A run cancelled before
any reply stores nothing; a run that failed after partial output stores what
arrived, marked as interrupted, so the list does not silently show a truncated
answer as complete. A persistence failure is logged and **never** fails the run —
the reply already reached the user.

The title is derived from the first prompt of the session (clipped, single line)
and never rewritten, so an entry does not change label under the user.

Selecting a conversation replays its turns and sets the page's `sessionId` to it:
because memory is server-side, the next prompt continues the very thread the
checkpointer holds. That is the payoff of not sending history in the request — the
page never has to reconcile its list with the model's.

### Conversation list: own component, not `adapters.threadList`

Assistant UI's `ExternalStoreThreadListAdapter` — and `threadId`,
`onSwitchToThread`, `onSwitchToNewThread` — are marked
`@deprecated ... under active development and might change without notice`, and
its status model (`regular | archived`) cannot express what the panel shows. The
list is therefore a plain component over the new history endpoints, and the
selected conversation reaches the runtime through the adapter's `messages`. Same
decision, same reason, as the `mcp-chat` prompt page; if the slot stabilises,
migrating is a panel-local change.

### Tool call rendering: one catch-all in `MessagePrimitive.Parts`

Tool calls render through a single component in the `tools.Fallback` slot,
receiving `ToolCallMessagePartProps`. Per-tool renderers were rejected: the tool
set is an adopter's config, so a registry of renderers would be permanently
incomplete. Arguments and result are collapsed by default, expandable, copyable,
and a failed invocation is visually distinct — with the caveat that a result only
exists when the run opted into `ToolResultEvent`.

### Route, wiring and the dev app

A second route ref `assistantRouteRef` with the same `agentName` param, a second
`PageBlueprint` at `/aws-genai-assistant/:agentName`, both registered on the
plugin. A sibling path under `/aws-genai/:agentName/...` was rejected: the
existing path already binds `:agentName` at that position, and a nested route
would make the two pages' route refs harder to reason about than two top-level
paths.

`workspaces/aws/packages/app/src/modules/nav/Sidebar.tsx` already suppresses the
inferred `page:aws-genai` nav item — the page is mounted per agent, so the
inferred link is unusable — and hand-writes a link to `aws-genai/general`. The
modern page gets the same treatment: `nav.take('page:aws-genai-assistant')`
followed by a hand-written `SidebarItem` to `aws-genai-assistant/general`, with a
distinct icon so the two entries are told apart at a glance.

### Styling

BUI components with CSS modules over BUI design tokens, `@remixicon/react` for
icons, matching the `aws-genai` frontend after its Backstage UI migration. Assistant
UI ships unstyled primitives, so no vendor stylesheet is imported and no MUI is
added.

## Risks / Trade-offs

- **A stored turn list and a checkpointer thread can drift.** They are written by
  different mechanisms: a crash between the reply and the write leaves the model
  remembering a turn the list does not show. Accepted: the model's memory stays
  authoritative for answering, the list is a reading aid. The alternative — one
  storage for both — is decision 1 above, rejected for reasons that have not
  changed.
- **Config as the source of search indexes goes stale.** An adopter who adds a
  collator without touching `genai.search.indexes` gets an index the page cannot
  toggle, and its documents keep arriving through an action that covers a declared
  index. Mitigated by defaults for the core actions and by documenting the block;
  not solvable while Backstage has no collator enumeration.
- **Narrowing a `types` input assumes the action models its index as an input.**
  An adopter action that hardcodes its index cannot be narrowed, only withheld
  wholesale via its declared indexes. Acceptable: withholding is the safe
  direction — the noise the user asked to remove is removed.
- **The peer range narrows to React 18.** An adopter on React 17 loses support.
  The workspace resolves 18 and Backstage 1.50 requires 18, so no supported
  adopter is affected in practice.
- **No edit, no regenerate.** The most visible gap against the `mcp-chat` prompt
  page, and the first thing a reviewer will ask about. Deliberate; see the
  proposal's _Deferred_ and the handler matrix above.
- **Two conversation surfaces to maintain** until the historical page is retired.
  Bounded by leaving `src/components/**` and `src/lib/chatManager.ts` untouched:
  the pages share the API client and nothing else.

## Migration Plan

Every addition is additive and independently deployable, but the order matters:
the backend contract lands before the page that consumes it, and the shared types
land before both. Deploy backend first — an older frontend keeps working against
it, since it sends none of the new fields; a newer frontend against an older
backend would ask for endpoints that do not exist.

Adopters mount the new page explicitly. No config is required: without
`genai.search.indexes` the two core indexes are offered, and without
`enabledActions` a run reaches everything its allowlist already allowed.

## Open Questions

None blocking. Two to revisit after adopter feedback: whether the deferred
edit/regenerate affordances justify a thread-truncation method on `AgentType`, and
whether the historical page should be retired or kept as the lightweight option.
