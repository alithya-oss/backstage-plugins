---
'@alithya-oss/backstage-plugin-mcp-chat-node': major
---

Now exports `LLMProvider` abstract class, `OpenAICompatibleBase` shared implementation, and `createLlmProviderModule` factory function. Removed dead `base-provider.ts` re-export and duplicate `types.ts` file.

**Migration:** If you imported `LLMProvider` from the common package, import it from this package instead. If you wrote a custom provider module, use `createLlmProviderModule` to reduce boilerplate and extend `OpenAICompatibleBase` for OpenAI-compatible services.
