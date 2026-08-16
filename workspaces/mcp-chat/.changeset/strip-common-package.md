---
'@alithya-oss/backstage-plugin-mcp-chat-common': major
---

Removed `LLMProvider` class export. The class is now available from `@alithya-oss/backstage-plugin-mcp-chat-node`. Also removed the `@backstage/backend-plugin-api` dependency, making this package browser-safe.

**Migration:** Replace `import { LLMProvider } from '@alithya-oss/backstage-plugin-mcp-chat-common'` with `import { LLMProvider } from '@alithya-oss/backstage-plugin-mcp-chat-node'`.
