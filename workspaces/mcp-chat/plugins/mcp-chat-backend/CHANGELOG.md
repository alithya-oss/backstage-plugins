# @alithya-oss/backstage-plugin-mcp-chat-backend

## 2.1.0

### Minor Changes

- 1c75649: Added `POST /chat/stream`, a server-sent event endpoint that delivers the same
  run as `POST /chat` while it happens: a `text` event per reply fragment, a
  `tool-call` event before each MCP invocation and a `tool-result` event after it —
  correlated by invocation id — then exactly one terminal `complete` or `error`
  event. Payload shapes come from `ChatStreamEvent` in
  `@alithya-oss/backstage-plugin-mcp-chat-common`.

  It takes the same request body as `POST /chat`, validates it identically before
  opening the stream, and applies the same identity and persistence rules: stored
  for an authenticated non-guest user with a title generated for a new
  conversation, skipped for a guest, and a storage failure never fails the run.
  Disconnecting abandons the provider request, starts no further tool invocation,
  and persists nothing.

  Every configured provider is streamable: one that does not stream natively is
  served by the `LLMProvider` fallback, which delivers its reply as a single
  fragment, so clients need no second code path. `MCPClientService` gains
  `streamQuery` alongside the unchanged `processQuery`.

  `POST /chat` is unchanged — same request, same response, same behaviour.

### Patch Changes

- 0dbd092: Added the streaming seam that the upcoming streaming chat endpoint builds on.

  `mcp-chat-common` now exports the stream event payload types (`ChatStreamEvent`
  and its members) so backend and frontend share one wire contract.

  `LLMProvider` gains a concrete `streamMessage` and a `supportsStreaming()`
  returning `false`. Neither is abstract, so every existing provider module keeps
  compiling and streaming works everywhere from day one: the default
  implementation awaits `sendMessage` and emits the whole reply as a single
  fragment. A provider adds genuine incremental output by overriding both.

  Provider status now carries `supportsStreaming`, letting a client tell real
  streaming from that single-fragment fallback.

- Updated dependencies [0dbd092]
  - @alithya-oss/backstage-plugin-mcp-chat-common@1.1.0
  - @alithya-oss/backstage-plugin-mcp-chat-node@1.1.0

## 2.0.0

### Major Changes

- 91bd77b: Public API reduced to the single plugin default export. Removed re-exports of `LLMProvider`, `llmProviderExtensionPoint`, internal services, utilities, and router.

  **Migration:** Import `LLMProvider` and `llmProviderExtensionPoint` from `@alithya-oss/backstage-plugin-mcp-chat-node` instead. Internal utilities and services are no longer public — rely on the plugin's built-in wiring.

### Patch Changes

- Updated dependencies [91bd77b]
- Updated dependencies [91bd77b]
  - @alithya-oss/backstage-plugin-mcp-chat-node@1.0.0
  - @alithya-oss/backstage-plugin-mcp-chat-common@1.0.0

## 1.0.0

### Major Changes

- f11011a: refactor the backend plugin to isolate llm providers in dedicated backend modules

### Minor Changes

- f11011a: Introduce shared libraries and extension points for future isolation of LLM providers in dedicated backend modules.

  This change also updates the public API surface for provider-related base classes/types and shared MCP chat types:

  - Move provider base classes and provider-related Node/backend integration types out of `@alithya-oss/backstage-plugin-mcp-chat-backend` into `@alithya-oss/backstage-plugin-mcp-chat-node`.
  - Move shared/common MCP chat types out of `@alithya-oss/backstage-plugin-mcp-chat-backend` into `@alithya-oss/backstage-plugin-mcp-chat-common`.
  - Consumers importing these APIs from `@alithya-oss/backstage-plugin-mcp-chat-backend` should update their import paths to the new packages above.

  No functional behavior is changed, but downstream consumers may need to update imports to compile against the new package structure.

### Patch Changes

- Updated dependencies [f11011a]
  - @alithya-oss/backstage-plugin-mcp-chat-common@0.2.0
  - @alithya-oss/backstage-plugin-mcp-chat-node@0.2.0

## 0.11.0

### Minor Changes

- c43e80c: Add Azure OpenAI provider to support newer Azure OpenAI models like `gpt-5.1`.

  This provider filters the models returned during the connection test to only show the status of the model of the configured deployment. It also uses `max_completion_tokens` correctly, fixing compatibility with newer models.

## 0.10.0

### Minor Changes

- 8db17fe: Added support for max_tokens and temperature customization
- 371fbad: Implement tool-level filtering using plugin configuration
- 2cb7b1b: Add support for configuring MCP tool call timeout
- 8db17fe: Added support for O-series and GPT-5 models

### Patch Changes

- 371fbad: Remove allowedTools from public MCPServerConfig API surface and improve disabledTools validation

## 0.9.0

### Minor Changes

- 81aead2: Backstage version bump to v1.50.2

## 0.8.0

### Minor Changes

- 1b22981: Migrating away from deprecated @google/generative-ai npm package to new @google/genai for gemini provider
- a81325a: Added support for debugging LLM calls
- 3e01b82: Backstage version bump to v1.49.2

  Updated `uuid` and `@types/uuid` to ^11.0.0, `@backstage/plugin-catalog-node` to ^2.1.0, and deduplicated yarn.lock

## 0.7.0

### Minor Changes

- 158dbf4: Backstage version bump to v1.48.5

### Patch Changes

- 8a6b81c: Updated dependency `@types/supertest` to `^7.0.0`.

## 0.6.1

### Patch Changes

- a4dddac: enable knip report

## 0.6.0

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

## 0.5.0

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

### Patch Changes

- 6d3ed24: Updated dependency `supertest` to `^7.0.0`.

## 0.4.1

### Patch Changes

- 0cd7a1d: Bump @modelcontextprotocol/sdk to v1.24.0 [security]

  The mcp-chat plugin is not affected since it does not start a MCP server. It uses the SDK to communicate to other servers.

  The Model Context Protocol (MCP) TypeScript SDK also does not enable DNS rebinding protection by default.

  References: [PR 6318](https://github.com/alithya-oss/backstage-plugins/pull/6318) /
  [CVE-2025-66414](https://nvd.nist.gov/vuln/detail/CVE-2025-66414) /
  [GHSA-w48q-cv73-mx4w](https://redirect.github.com/advisories/GHSA-w48q-cv73-mx4w)

- 5edddd9: Bumps express from 4.21.2 to 4.22.0
- 0cd7a1d: Bump typescript compiler to 5.4

## 0.4.0

### Minor Changes

- 4abb76c: support use as a reusable library

## 0.3.0

### Minor Changes

- 5c4b01f: Added OpenAI Responses API Support

## 0.2.1

### Patch Changes

- 3f75d42: Updated dependency `ollama` to `^0.6.0`.

## 0.2.0

### Minor Changes

- 4d353dc: Added LiteLLM provider support for unified access to 100+ LLM providers

## 0.1.1

### Patch Changes

- 95d31eb: Add support for optional baseUrl parameter in OpenAI provider for compatible endpoints (e.g., Azure OpenAI)

## 0.1.0

### Minor Changes

- 8c37936: Initial stable release
