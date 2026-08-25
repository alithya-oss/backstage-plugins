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
- Render MCP tool calls with `makeAssistantToolUI` instead of a bespoke
  `ToolCallDetails`-style component, mapping the backend's `toolResponses`
  entries onto Assistant UI `tool-call` message parts.
- Ship a **reduced side panel** on the new page carrying the three concerns
  Assistant UI has no model for — MCP server enable/disable toggles, read-only
  provider status, and conversation selection — built on the existing
  `useMcpServers`, `useProviderStatus` and `useConversations` hooks with new
  presentation components.
- Narrow the plugin's `react`, `react-dom` and `@types/react` peer ranges from
  `^17.0.0 || ^18.0.0` to `^18`, to match what `@assistant-ui/react` declares.
- **No streaming of response tokens.** The page renders a running indicator
  while a request is in flight and the assistant message in one shot when it
  resolves. See "Deferred" below — this is a deliberate scope cut forced by the
  backend contract, not an oversight.

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

- **Incremental token streaming.** `POST /chat` answers with a single JSON
  body (`{ role, content, toolResponses, toolsUsed, conversationId }`) after the
  provider and every MCP tool call have finished; `McpChatApi.sendChatMessage`
  returns `Promise<ChatResponse>`. Streaming cannot be delivered from the
  frontend alone, and adding a server-sent-events endpoint is explicitly outside
  this change. Tracked as a follow-up against the backend.
- **Attachments, speech, dictation and feedback adapters.** No backend support.
- **Retiring the existing page.** A separate decision once the new page has
  adopter feedback.

## Capabilities

### New Capabilities

- `mcp-chat/prompt-page`: an Assistant UI-based conversation page for the
  `mcp-chat` plugin — prompt submission, run lifecycle and cancellation, MCP
  tool-call rendering, provider error handling, message editing and
  regeneration, and a reduced side panel for MCP server toggles, provider status
  and conversation selection.

### Modified Capabilities

None. `openspec/specs/` is empty, the existing page has no spec to amend, and
this change adds a page beside it rather than altering its behaviour.

## Impact

**Package** — `workspaces/mcp-chat/plugins/mcp-chat`
(`@alithya-oss/backstage-plugin-mcp-chat`), the only package touched.

- New sources under `src/components/PromptPage`, a new route ref in
  `src/routes.ts`, a second `PageBlueprint` in `src/alpha.tsx`, new exports in
  `src/wiring.ts`.
- `package.json`: adds `@assistant-ui/react` and `@remixicon/react`
  dependencies; narrows the `react` / `react-dom` / `@types/react` peer ranges to
  `^18` (adopters still on React 17 lose support — the workspace already
  resolves `18.3.1`, and Backstage 1.40 requires 18, so no supported adopter is
  affected in practice).
- `src/api/McpChatApi.ts`, `src/types.ts`, `src/components/ChatContainer/**`,
  `src/components/RightPane/**` and `src/components/ChatPage/**`: unchanged.

**Backend** — none. No route, service or database change in
`mcp-chat-backend`, `mcp-chat-node` or `mcp-chat-common`.

**Workspace** — `yarn.lock` gains the Assistant UI tree (`@assistant-ui/core`,
`@assistant-ui/store`, `@assistant-ui/tap`, `assistant-stream`,
`assistant-cloud`, `radix-ui`, `zustand`, `zod`, `react-textarea-autosize`), all
MIT. Assistant UI Cloud is a paid hosted service and is not used: the runtime
points at the plugin's own backend.

**Adopters** — additive. The new page must be mounted explicitly; existing
installations that do not mount it see no behavioural change beyond the peer
range narrowing.
