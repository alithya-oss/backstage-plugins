## Context

See `proposal.md` — Why. What shapes the approach here is the shape of the
existing transport and of the library, both verified against the code and the
published package rather than from documentation:

**The transport is request/response, not a stream.**
`McpChatApi.sendChatMessage(messages, enabledTools, signal, conversationId)`
returns `Promise<ChatResponse>`. `POST /chat` in
`plugins/mcp-chat-backend/src/routes/chatRoutes.ts` calls
`mcpClientService.processQuery(...)` and only then answers
`{ role: 'assistant', content, toolResponses, toolsUsed, conversationId }`.
Tool calls run **server-side**, inside `processQuery`, and are reported after the
fact as `ToolExecutionResult[]` — `{ id, name, arguments, result, serverId }`.
The frontend never executes a tool and never observes one starting.

**The library at `@assistant-ui/react@0.15.16`.** `useExternalStoreRuntime` and
`ExternalStoreAdapter` re-export from `@assistant-ui/core@0.3.15`. On
`ExternalStoreAdapter`, only `onNew` is required. `unstable_enableToolInvocations`
defaults to `false`, which is what we want: the runtime then does not drive
client-side tool callbacks and simply renders the tool-call parts we put in
`messages`. The package ships **no CSS** and pulls in no Tailwind — its
primitives are unstyled Radix wrappers, so it composes with CSS modules over BUI
tokens.

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

- Reuse the existing transport untouched; the adapter is the only new seam.
- Keep the new page's failure modes independent of the existing page's.
- Depend only on stable Assistant UI surface.
- Keep the reduced side panel's data layer as existing hooks, so panel behaviour
  stays consistent between the two pages.

**Non-Goals**

- No refactor of `ChatContainer`, `RightPane` or `ChatPage`, and no shared
  presentation component extracted between old and new page. Duplicated markup
  is accepted for this change: the old components are Material UI and the new
  ones are BUI, so a shared component would have to satisfy both.
- No change to `McpChatApi`, `src/types.ts`, or any backend package.
- No Assistant UI Cloud, no `AssistantCloud`, no remote thread list.

## Decisions

### Runtime: `useExternalStoreRuntime`, not `useLocalRuntime`

`useLocalRuntime` expects a `ChatModelAdapter` that yields
`ChatModelRunResult` updates — it is built for a model call the frontend drives
and can stream from. Our backend performs the whole provider-plus-tools cycle
server-side and answers once, and conversation persistence is already the
backend's job, keyed by `conversationId`. `useExternalStoreRuntime` fits that:
React state remains the single source of truth for the message list, the runtime
renders it, and each handler maps onto one transport call. It is also what makes
the "selecting an existing conversation" requirement cheap — loading a stored
conversation is a `setState`, not a runtime migration.

Rejected: `useLocalRuntime` (would need a fake streaming adapter over a
non-streaming call, and would duplicate persistence);
`useAssistantTransportRuntime` / `AssistantCloud` (assume protocols the backend
does not speak).

### Handler matrix

`ExternalStoreAdapter` is populated as follows. The set differs in two places
from the one sketched in the parent issue, for reasons given below.

| Member                                         | Used                  | Maps to                                                                                                           |
| ---------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `messages`                                     | yes                   | React state of the converted turn list                                                                            |
| `convertMessage`                               | yes                   | our `Message` view-model → `ThreadMessageLike`                                                                    |
| `isRunning`                                    | yes                   | request-in-flight flag, drives the running indicator                                                              |
| `isLoading`                                    | yes                   | true while a stored conversation is being fetched                                                                 |
| `onNew`                                        | yes (required)        | append user turn, then `sendChatMessage`                                                                          |
| `setMessages`                                  | yes                   | lets the runtime rewrite the list — **required for cancel and for branch switching to survive the next snapshot** |
| `onEdit`                                       | yes                   | truncate to the edited turn, re-run from it                                                                       |
| `onReload`                                     | yes                   | re-run from a `parentId`, producing another branch                                                                |
| `onCancel`                                     | yes                   | `AbortController.abort()`, then drop the trailing user turn                                                       |
| `onDelete`                                     | no                    | not in the spec; no per-message delete affordance                                                                 |
| `onAddToolResult`                              | **no**                | see below                                                                                                         |
| `unstable_enableToolInvocations`               | **no** (left `false`) | tools run server-side                                                                                             |
| `adapters.threadList`                          | **no**                | see "Conversation list" below                                                                                     |
| `adapters.attachments` / `speech` / `feedback` | no                    | no backend support                                                                                                |

**`onAddToolResult` is deliberately omitted**, against the parent issue's
assumption. That handler exists so a _client-side_ tool can hand its result back
to the runtime; the type doc states results flow through it "from `execute()`
returning, or from `streamCall` resolving". In `mcp-chat` every tool executes
server-side and its result is already inside the response we convert into
message parts, so nothing would ever call it. Wiring it would be dead code, and
enabling the tracker that drives it (`unstable_enableToolInvocations: true`)
would make the runtime try to dispatch our server-side tool calls a second time.

**`setMessages` is not optional in practice.** Its type doc is explicit: without
it, "cancelling a run leaves a trailing user message in the thread and the
composer untouched". Since cancel is a spec'd scenario, `setMessages` is
required to satisfy it.

### Message conversion

`convertMessage` maps one view-model message to a `ThreadMessageLike`. An
assistant turn's `content` array is built as: one `{ type: 'text', text }` part
for the reply, preceded by one `{ type: 'tool-call', toolCallId, toolName, args,
result, isError }` part per `ToolExecutionResult` — `id` → `toolCallId`, `name` →
`toolName`, `arguments` → `args`, `result` → `result`. `ToolExecutionResult` has
no error flag, so `isError` is derived from the result payload; the check lives
in one helper so it can be replaced if the backend later reports errors
explicitly.

This is the seam that lets tool rendering meet its spec without any client-side
tool machinery: the parts are already in the message, and `makeAssistantToolUI`
renders them.

### Tool call UI: one catch-all `makeAssistantToolUI`

MCP tool names are configuration-driven and unknown at build time, so no
per-tool component can be registered. A single fallback tool UI renders every
tool-call part uniformly — name, collapsed arguments and result, copy action,
error styling — replacing what `ToolCallDetails` does today, in BUI with
`@remixicon/react` icons.

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

- **No token streaming, while the parent issue's acceptance criteria ask for
  streaming** → Cannot be resolved in this change: the backend answers once.
  Mitigated by a running indicator and working cancel, so the page never looks
  frozen. Escalated rather than absorbed silently — the spec states the
  non-requirement explicitly and the proposal records it as deferred, so adding a
  streaming endpoint later changes no other requirement.
- **Assistant UI is pre-1.0 (`0.15.16`)** → Depend only on non-`unstable_`,
  non-deprecated surface (this is what rules out `adapters.threadList`). Pin an
  exact-minor range and treat upgrades as reviewed changes.
- **The dependency tree grows by ~10 transitive packages** → All MIT, verified.
  `yarn dedupe` is run and `yarn dedupe --check` gated in CI. `zod` and `zustand`
  arriving in the workspace risks duplicate resolutions; dedupe before `tsc:full`,
  since duplicate copies of one library surface as spurious type errors.
- **Two chat UIs to maintain** → Accepted and time-boxed: retiring the old page
  is a separate decision once the new one has adopter feedback.
- **Duplicated panel presentation between old and new page** → Accepted: the data
  layer (`useMcpServers`, `useProviderStatus`, `useConversations`) is shared, only
  the markup is not, because the two pages target different component libraries.
- **`isError` for a tool call is inferred, not reported** → Isolated in one
  helper, so a future backend field replaces one function.

## Migration Plan

Additive and adopter-driven. The new page ships behind its own route and is not
mounted automatically; adopters add its extension when they want it. Rollback for
an adopter is removing the mount — the existing page is untouched, so there is no
data or route migration and nothing to reverse on the backend. The only change
visible to an adopter who does nothing is the narrowed React peer range.

## Open Questions

- Which path the new route should take (`/mcp-chat/prompt` as a child of the
  existing path, or a sibling such as `/mcp-chat-prompt`). Both satisfy the
  spec's "own route" requirement and the choice does not affect the adapter, the
  panel or the task breakdown.
- Whether the reduced panel should default to collapsed on narrow viewports. A
  presentation detail with no spec'd behaviour attached.
