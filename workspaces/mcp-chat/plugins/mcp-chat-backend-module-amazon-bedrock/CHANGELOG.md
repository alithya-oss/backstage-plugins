# @alithya-oss/backstage-plugin-mcp-chat-backend-module-amazon-bedrock

## 0.2.0

### Minor Changes

- 91bd77b: Switched to `createLlmProviderModule` factory from `@alithya-oss/backstage-plugin-mcp-chat-node`. Removed unused `readAuthRecord` helper. No adopter action needed — module behaviour and configuration schema are unchanged.

### Patch Changes

- Updated dependencies [91bd77b]
  - @alithya-oss/backstage-plugin-mcp-chat-node@1.0.0

## 0.1.1

### Patch Changes

- f11011a: refactor the backend plugin to isolate llm providers in dedicated backend modules
- Updated dependencies [f11011a]
  - @alithya-oss/backstage-plugin-mcp-chat-common@0.2.0
  - @alithya-oss/backstage-plugin-mcp-chat-node@0.2.0
