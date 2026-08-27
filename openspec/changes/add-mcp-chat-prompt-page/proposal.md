## Why

The `mcp-chat` frontend plugin renders its conversation UI from hand-written
primitives: `ChatContainer` owns the message list, the composer, the abort
controller and the error strings, while `ToolCallDetails` renders tool output as
Material UI chips and collapses. Every conversational affordance an adopter
expects — editing a prompt and re-running it, regenerating an answer, branching,
keyboard-accessible message actions, viewport auto-scroll — has to be built and
maintained by hand, and today most of them simply do not exist.

`@assistant-ui/react` (MIT, `0.15.16`) supplies those primitives as unstyled,
Radix-based components driven by a runtime abstraction. Adopting it for a new
page lets the plugin inherit the conversational mechanics instead of growing
them one hook at a time, without disturbing the page adopters run today.

## What Changes

- Add a **second, independent page** to the `mcp-chat` plugin, mounted on its own
  route with its own route ref. The existing `/mcp-chat` page and every component
  under `src/components/ChatContainer` and `src/components/RightPane` are left
  untouched. Nothing is removed and nothing is deprecated.
- Adapt the existing `mcpChatApiRef` transport into an `ExternalStoreAdapter`
  and provide it through `useExternalStoreRuntime`. No new backend endpoint, no
  change to `McpChatApi`.
- Render MCP tool calls with a single catch-all renderer in the `tools.Fallback`
  slot of `MessagePrimitive.Parts` instead of a bespoke `ToolCallDetails`-style
  component, mapping the backend's tool events onto Assistant UI `tool-call`
  message parts.
- Ship a **reduced side panel** on the new page carrying the three concerns
  Assistant UI has no model for — MCP server enable/disable toggles, read-only
  provider status, and conversation selection — built on the existing
  `useMcpServers`, `useProviderStatus` and `useConversations` hooks with new
  presentation components.
- Narrow the plugin's `react`, `react-dom` and `@types/react` peer ranges from
  `^17.0.0 || ^18.0.0` to `^18`, to match what `@assistant-ui/react` declares.
- **Add a streaming chat endpoint to the backend**, alongside the existing
  single-response one, emitting server-sent events for reply fragments, MCP
  tool-call starts and their results. The existing `POST /chat` stays unchanged so
  the current page keeps working.
- Give the provider abstraction an optional incremental-output path, with a
  fallback that emits a non-streaming provider's whole reply as one fragment, so
  the endpoint behaves uniformly across all nine provider modules and each one can
  gain real streaming independently.
- Render the reply **incrementally** on the new page, with MCP tool invocations
  appearing as they start and resolving in place when their result arrives.

### Decisions settled here

**Conversation search and pinning are kept, but not on top of Assistant UI's
thread list.** The question left open by the parent issue offered two options —
reimplement them over the Assistant UI thread list, or drop them from iteration
one. Neither is taken. `ExternalStoreThreadListAdapter` cannot express either
concept (its status model is exactly `regular | archived`, it has no search
notion) and the whole `adapters.threadList` slot, along with `threadId`,
`onSwitchToThread` and `onSwitchToNewThread`, is marked
`@deprecated ... under active development and might change without notice` in
`0.15.16`. Conversation selection therefore lives in the reduced side panel over
`useConversations`, which already implements search, star and delete, and feeds
the runtime through `messages` / `setMessages`. Search and pinning survive at no
extra cost and the plugin takes on no dependency on an API the vendor says may
change without notice. `design.md` records the rejected alternative and the
migration path if the slot stabilises.

### Deferred

- **Revising a turn and regenerating an answer. Moved out of this change**, to
  `add-mcp-chat-conversation-branching`. The requirement was written here and its
  task group 7 was suspended pending an arbitration between a destructive
  implementation and a tree of turns. The tree was chosen, which changes the
  behaviour outright — editing an earlier turn forks instead of truncating — and
  makes the stored schema part of the work, which this change promised not to
  touch. The requirement is therefore removed from this change's delta spec and
  reappears there, reshaped. The adapter's `onEdit` and `onReload` handlers
  delivered by task group 4 stay in the code, unexposed, and are rewritten by that
  change.
- **Native incremental output for every provider module.** The streaming endpoint
  and its contract are delivered now, and every provider is reachable through it,
  but a provider that has not yet implemented incremental output is served by the
  single-fragment fallback. Bringing each of the nine modules to native streaming
  is per-provider follow-up work that changes no requirement in this change.
- **Attachments, speech, dictation and feedback adapters.** No backend support.
- **Retiring the existing page.** A separate decision once the new page has
  adopter feedback.

## Capabilities

### New Capabilities

- `mcp-chat/chat-streaming`: the backend's streaming chat contract — a server-sent
  event endpoint carrying reply fragments, MCP tool-call starts and results,
  uniform across providers via a non-streaming fallback, with cancellation,
  authorization and persistence parity with the existing endpoint.
- `mcp-chat/prompt-page`: an Assistant UI-based conversation page for the
  `mcp-chat` plugin — prompt submission, incremental reply rendering, run
  lifecycle and cancellation, MCP tool-call rendering, provider error handling,
  and a reduced side panel for MCP server toggles, provider status and
  conversation selection.

### Modified Capabilities

None. `openspec/specs/` is empty, the existing page has no spec to amend, and
this change adds a page beside it rather than altering its behaviour. The existing
`POST /chat` endpoint is left untouched, so it gains no delta either.

## Impact

**Package** — `workspaces/mcp-chat/plugins/mcp-chat`
(`@alithya-oss/backstage-plugin-mcp-chat`), the frontend package.

- New sources under `src/components/PromptPage`, a new route ref in
  `src/routes.ts`, a second `PageBlueprint` in `src/alpha.tsx`, new exports in
  `src/wiring.ts`.
- `src/api/McpChatApi.ts`: gains a streaming method that consumes the new
  endpoint and surfaces its events. `sendChatMessage` and every other existing
  method keep their current signature and behaviour, so the existing page is
  unaffected.
- `src/types.ts`: gains the stream event types and a streaming capability flag on
  provider status. Existing types are not altered.
- `package.json`: adds `@assistant-ui/react` and `@remixicon/react`
  dependencies; narrows the `react` / `react-dom` / `@types/react` peer ranges to
  `^18` (adopters still on React 17 lose support — the workspace already
  resolves `18.3.1`, and Backstage 1.40 requires 18, so no supported adopter is
  affected in practice).
- `src/components/ChatContainer/**`, `src/components/RightPane/**` and
  `src/components/ChatPage/**`: unchanged.

**Backend** — now in scope, where it previously was not.

- `mcp-chat-backend`: a new streaming route beside `POST /chat`, and a streaming
  variant of the query-processing path that emits fragments and tool events
  instead of accumulating them. `POST /chat` and its handler stay as they are.
- `mcp-chat-node`: `LLMProvider` gains an optional incremental-output method plus
  a capability flag, with a base implementation that falls back to the existing
  `sendMessage` and emits one fragment. Because the fallback lives in the base
  class, the nine provider modules compile unchanged and opt in individually.
- `mcp-chat-common`: shared event payload types for the stream, and a streaming
  capability flag on provider status.
- Native-MCP providers, which take the separate responses-API path, keep working
  through the same fallback until that path gains streaming of its own.

**Workspace** — `yarn.lock` gains the Assistant UI tree (`@assistant-ui/core`,
`@assistant-ui/store`, `@assistant-ui/tap`, `assistant-stream`,
`assistant-cloud`, `radix-ui`, `zustand`, `zod`, `react-textarea-autosize`), all
MIT. Assistant UI Cloud is a paid hosted service and is not used: the runtime
points at the plugin's own backend.

**Adopters** — additive, and now spanning more packages. The new page must be
mounted explicitly, and the new endpoint is additive, so an installation that
mounts neither sees no behavioural change beyond the peer range narrowing.
Changesets are needed for the frontend plugin and for each backend package
touched.
