---
'@alithya-oss/backstage-plugin-mcp-chat-backend': major
---

Public API reduced to the single plugin default export. Removed re-exports of `LLMProvider`, `llmProviderExtensionPoint`, internal services, utilities, and router.

**Migration:** Import `LLMProvider` and `llmProviderExtensionPoint` from `@alithya-oss/backstage-plugin-mcp-chat-node` instead. Internal utilities and services are no longer public — rely on the plugin's built-in wiring.
