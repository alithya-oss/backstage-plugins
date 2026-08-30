# @alithya-oss/backstage-plugin-mcp-chat

## 0.10.0

### Minor Changes

- 4aea81d: The Assistant UI prompt page at `/mcp-chat-prompt` can now revise a prompt and
  compare two answers to it.

  Regenerating an answer no longer replaces it. The previous answer is kept as a
  version of the same prompt, the new one is added beside it, and a picker under the
  answer says which of them is on screen and moves between them. Since regenerating
  re-runs the MCP tools server-side, comparing two phrasings now costs one
  regeneration instead of two.

  Alternative answers are confined to the latest prompt. Editing a user turn still
  discards the turns that follow it, so the edit composer now states how many turns
  saving would discard before it applies. Sending a new prompt continues the
  conversation from the answer that was shown and abandons the others, which is what
  keeps a stored conversation linear.

  Nothing about persistence changes: `ConversationRecord`, the conversation table
  and the `/chat` and `/chat/stream` contracts are untouched, and no migration is
  needed. A conversation loaded from storage comes back linear, with one answer per
  turn. One consequence is worth knowing: switching version does not write anything
  by itself, so the version that survives a page reload is the one the last run
  stored.

- ca85ad9: The Assistant UI prompt page at `/mcp-chat-prompt` now has a working
  conversation surface, built on `@assistant-ui/react` primitives and styled with
  CSS modules over Backstage UI design tokens.

  The composer accepts multi-line text, submits on Enter and inserts a newline on
  Shift+Enter. A blank or whitespace-only prompt starts no run. The assistant reply
  is rendered as markdown while it is still growing, so text is readable before the
  run ends — and a provider without native streaming, whose whole reply arrives as
  one fragment, takes exactly the same path.

  While a run is in flight the page says the assistant is working and offers a
  cancel control in place of the send control; both follow the runtime's state, so
  they clear when the run completes, fails or is cancelled. A failed run is
  reported as an alert beside the conversation rather than as assistant content,
  wording an unreachable backend differently from a provider failure, and offers a
  retry that re-runs the last prompt. Text that had already arrived when a run
  failed is kept and labelled as interrupted instead of being retracted or passed
  off as a complete answer.

  MCP tool call rendering and the reduced side panel land in follow-ups; the
  existing `/mcp-chat` page is unchanged.

- 81901a7: Documented the Assistant UI prompt page in the plugin README, now that it is
  complete: what the two pages are, how to mount or unmount either of them, and the
  order the packages have to be deployed in.

  The prompt page is mounted at `/mcp-chat-prompt` by the `/alpha` entry point, as
  `page:mcp-chat/prompt`, beside the existing `/mcp-chat` page. The two are
  siblings sharing the same stored conversations — neither shadows the other — and
  `app.extensions` can disable either one. The prompt page is new frontend system
  only; the classic entry point still exports `McpChatPage` alone.

  **Deployment order:** deploy
  `@alithya-oss/backstage-plugin-mcp-chat-backend` **before** mounting the prompt
  page. The page streams over `POST /api/mcp-chat/chat/stream`, which older
  backends do not serve, so against one it reports the chat service as unavailable
  on every prompt. `/mcp-chat` works against any supported backend version, so
  rolling the frontend back alone is safe; rolling the backend back below the
  streaming route means unmounting the prompt page as well.

- 0effb7f: Added a second page to the `/alpha` entry point, mounted at `/mcp-chat-prompt` and bound to a new `prompt` route ref. It is the route the Assistant UI conversation surface is being built on; the existing `/mcp-chat` page, its route ref and its behaviour are unchanged, and adopters who do not mount the new page see no difference.

  Narrowed the `react`, `react-dom` and `@types/react` peer ranges from `^17.0.0 || ^18.0.0` to `^18`.

  **Migration:** none for React 18 adopters — Backstage 1.40 and later already require React 18. If you are still on React 17, stay on the previous version of this plugin: `@assistant-ui/react`, which the new page is built on, does not support React 17.

- 27d995c: The Assistant UI prompt page at `/mcp-chat-prompt` now has its side panel: MCP
  server toggles, a read-only provider status block, and the stored conversation
  list with search and pinning.

  Disabling a server withholds all of its tools from the provider from the next
  prompt onwards, without interrupting a run already in flight. The provider block
  reports the connection state, the reported model and whether the provider
  produces incremental output or reaches the streaming endpoint through the
  single-fragment fallback — a distinction that explains a reply arriving in one
  piece. It offers no control to change the provider or the model, matching the
  existing chat page, which has no model selector either. Failing to read the
  server list or the provider status is reported in place and never blocks the
  composer.

  Selecting a stored conversation replaces the page's turns with its own and
  directs subsequent prompts at that same stored conversation; "New" empties both.
  The list is searchable case-insensitively over titles and user turns, groups
  pinned conversations ahead of the rest and orders each group most recently
  updated first. Pin and delete are optimistic and roll back on failure, and the
  panel now says so when one is rejected. A user with no stored conversations, or
  an identity that cannot own them, sees an empty list without an error and can
  still hold a conversation.

  The panel is built with `@backstage/ui` controls and CSS modules over its design
  tokens — hence the new `@backstage/ui` dependency. It deliberately does not use
  Assistant UI's thread list adapter, whose thread status is exactly
  `regular | archived` and which has no notion of search, so adopting it would cost
  both pinning and search. The existing `/mcp-chat` page and its right pane are
  unchanged.

- 33a6396: Added `streamChatMessage` to `McpChatApi`. It runs the same query as
  `sendChatMessage` against the backend's `POST /chat/stream`, yielding the run's
  events as they arrive — `text`, `tool-call`, `tool-result`, then exactly one
  terminal `complete` or `error` — and accepts an `AbortSignal` to cancel it. A
  failure that prevents the stream is thrown, so a caller can tell an unreachable
  backend from a provider failure the stream reports. `sendChatMessage` and every
  other method are unchanged.

  The Assistant UI prompt page at `/mcp-chat-prompt` now carries the conversation
  state behind that stream: an `ExternalStoreAdapter` over React state, with turns
  growing fragment by fragment, tool invocations shown as soon as they start and
  filled in place when their result lands, one run at a time per conversation, and
  failures kept as error state that preserves partial text instead of presenting it
  as a finished answer. The conversation surface itself lands in a follow-up.

  **Deployment order:** deploy `@alithya-oss/backstage-plugin-mcp-chat-backend`
  before mounting the prompt page. Against an older backend the streaming route
  answers 404, which the page reports as the chat service being unavailable.

  Aligned this workspace's `typescript` devDependency with the rest of the
  repository (`~5.4.0` to `~5.8.0`). `@assistant-ui/react` ships declarations that
  use the generic `Uint8Array<ArrayBuffer>` introduced in TypeScript 5.7, so the
  older compiler could not typecheck them. No effect on published packages.

- dd4dcdb: The Assistant UI prompt page at `/mcp-chat-prompt` now renders the MCP tool calls
  of a reply. Each invocation appears on the assistant turn as a collapsed row
  carrying the tool's name, expandable — independently of the others — to the
  arguments it received and the result it returned, with a copy action on the
  result and an acknowledgement of the copy. A failed invocation is styled apart
  and exposes its error detail on expansion.

  An invocation shows up as soon as the run reports it starting, marked as running
  while its result is still missing, and resolves in that same row once the result
  arrives rather than appearing a second time. A reply that invoked no tool renders
  no tool-call section.

  Tool names come from configuration and are unknown at build time, so a single
  name-agnostic renderer is registered in the `tools.Fallback` slot of
  `MessagePrimitive.Parts`. The deprecated `makeAssistantToolUI` is deliberately
  not used: it binds a renderer to one exact tool name. No tool runs in the
  browser — the rendering only describes what the backend did. The existing
  `/mcp-chat` page and its `ToolCallDetails` component are unchanged.

### Patch Changes

- Updated dependencies [0dbd092]
  - @alithya-oss/backstage-plugin-mcp-chat-common@1.1.0

## 0.9.0

### Minor Changes

- 91bd77b: Added `/alpha` entry point for the new Backstage frontend system using `@backstage/frontend-plugin-api`. Internal component decomposition for maintainability — no user-facing API changes.

### Patch Changes

- Updated dependencies [91bd77b]
  - @alithya-oss/backstage-plugin-mcp-chat-common@1.0.0

## 0.8.0

### Minor Changes

- f11011a: Introduce shared libraries and extension points for future isolation of LLM providers in dedicated backend modules.

  This change also updates the public API surface for provider-related base classes/types and shared MCP chat types:

  - Move provider base classes and provider-related Node/backend integration types out of `@alithya-oss/backstage-plugin-mcp-chat-backend` into `@alithya-oss/backstage-plugin-mcp-chat-node`.
  - Move shared/common MCP chat types out of `@alithya-oss/backstage-plugin-mcp-chat-backend` into `@alithya-oss/backstage-plugin-mcp-chat-common`.
  - Consumers importing these APIs from `@alithya-oss/backstage-plugin-mcp-chat-backend` should update their import paths to the new packages above.

  No functional behavior is changed, but downstream consumers may need to update imports to compile against the new package structure.

### Patch Changes

- f11011a: refactor the backend plugin to isolate llm providers in dedicated backend modules

## 0.7.1

### Patch Changes

- c43e80c: Updated the list of supported providers in the README

## 0.7.0

### Minor Changes

- 81aead2: Backstage version bump to v1.50.2

## 0.6.0

### Minor Changes

- 3e01b82: Backstage version bump to v1.49.2

  Updated `uuid` and `@types/uuid` to ^11.0.0, `@backstage/plugin-catalog-node` to ^2.1.0, and deduplicated yarn.lock

## 0.5.0

### Minor Changes

- 805e6fd: Add support for new frontend system

## 0.4.0

### Minor Changes

- 158dbf4: Backstage version bump to v1.48.5

## 0.3.1

### Patch Changes

- a4dddac: enable knip report

## 0.3.0

### Minor Changes

- 207781a: ### Added Conversation History Feature

  - **Conversation Persistence**: Chat sessions are automatically saved for authenticated users
  - **Starring**: Mark important conversations as favorites for quick access
  - **Search**: Filter conversations by title using client-side search
  - **Delete**: Remove individual conversations or clear all history
  - **AI-Generated Titles**: Conversations get auto-generated titles using the LLM (with fallback to first message)

  ### Backend Improvements

  - Refactored router into domain-specific modules (status, chat, conversations) for better maintainability
  - Added authentication and validation middleware
  - New API endpoints for conversation management (list, get, delete, star, update title)
  - Added `ChatConversationStore` and `SummarizationService` to public exports
  - Comprehensive unit tests for `ChatConversationStore`

  ### Configuration Options

  New `conversationHistory` config section with `displayLimit`, `autoSummarize`, and `summarizeTimeout` options.

  ### Notes

  - Guest users (`user:development/guest`) do not have conversations saved
  - Conversations stored in `mcp_chat_conversations` database table with automatic migrations

## 0.2.0

### Minor Changes

- c330b2c: **BREAKING**: Removed SSE (Server-Sent Events) transport support

  The deprecated `SSEClientTransport` has been removed in favor of `StreamableHTTPClientTransport`, which is the modern MCP standard.

  **Migration:**

  If you had MCP servers configured with `type: sse`, update your configuration:

  ```yaml
  # Before (no longer supported)
  mcpServers:
    - id: my-server
      name: My Server
      type: sse
      url: 'http://example.com/sse'

  # After
  mcpServers:
    - id: my-server
      name: My Server
      url: 'http://example.com/mcp'  # type is auto-detected when url is present
  ```

  **Changes:**

  - Removed `MCPServerType.SSE` enum value from both frontend and backend
  - Removed SSE transport fallback logic from `MCPClientServiceImpl`
  - Updated configuration schema to only accept `stdio` and `streamable-http` types
  - HTTP servers are now auto-detected when a `url` field is present

## 0.1.2

### Patch Changes

- 0cd7a1d: Bump typescript compiler to 5.4

## 0.1.1

### Patch Changes

- 5c4b01f: Added OpenAI Responses API Support

## 0.1.0

### Minor Changes

- 8c37936: Initial stable release
