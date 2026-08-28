# @alithya-oss/backstage-plugin-mcp-chat-common

## 1.1.0

### Minor Changes

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

## 1.0.0

### Major Changes

- 91bd77b: Removed `LLMProvider` class export. The class is now available from `@alithya-oss/backstage-plugin-mcp-chat-node`. Also removed the `@backstage/backend-plugin-api` dependency, making this package browser-safe.

  **Migration:** Replace `import { LLMProvider } from '@alithya-oss/backstage-plugin-mcp-chat-common'` with `import { LLMProvider } from '@alithya-oss/backstage-plugin-mcp-chat-node'`.

## 0.2.0

### Minor Changes

- f11011a: Introduce shared libraries and extension points for future isolation of LLM providers in dedicated backend modules.

  This change also updates the public API surface for provider-related base classes/types and shared MCP chat types:

  - Move provider base classes and provider-related Node/backend integration types out of `@alithya-oss/backstage-plugin-mcp-chat-backend` into `@alithya-oss/backstage-plugin-mcp-chat-node`.
  - Move shared/common MCP chat types out of `@alithya-oss/backstage-plugin-mcp-chat-backend` into `@alithya-oss/backstage-plugin-mcp-chat-common`.
  - Consumers importing these APIs from `@alithya-oss/backstage-plugin-mcp-chat-backend` should update their import paths to the new packages above.

  No functional behavior is changed, but downstream consumers may need to update imports to compile against the new package structure.
