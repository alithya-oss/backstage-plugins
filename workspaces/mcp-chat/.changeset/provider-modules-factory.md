---
'@alithya-oss/backstage-plugin-mcp-chat-backend-module-agentgateway': minor
'@alithya-oss/backstage-plugin-mcp-chat-backend-module-amazon-bedrock': minor
'@alithya-oss/backstage-plugin-mcp-chat-backend-module-anthropic': minor
'@alithya-oss/backstage-plugin-mcp-chat-backend-module-azure-openai': minor
'@alithya-oss/backstage-plugin-mcp-chat-backend-module-gemini': minor
'@alithya-oss/backstage-plugin-mcp-chat-backend-module-litellm': minor
'@alithya-oss/backstage-plugin-mcp-chat-backend-module-ollama': minor
'@alithya-oss/backstage-plugin-mcp-chat-backend-module-openai': minor
'@alithya-oss/backstage-plugin-mcp-chat-backend-module-openai-responses': minor
---

Switched to `createLlmProviderModule` factory from `@alithya-oss/backstage-plugin-mcp-chat-node`. Removed unused `readAuthRecord` helper. No adopter action needed — module behaviour and configuration schema are unchanged.
