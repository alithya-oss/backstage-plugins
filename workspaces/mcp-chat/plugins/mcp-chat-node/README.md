# @alithya-oss/backstage-plugin-mcp-chat-node

The Node.js library package for the MCP Chat plugin ecosystem. This is the **single provider extension surface** — everything an LLM provider module needs to integrate with MCP Chat lives here.

## Purpose

This package provides the contracts, base classes, and factory utilities that LLM provider modules depend on. Provider modules should depend on this package (not the backend plugin or common package directly).

## Installation

```bash
yarn add @alithya-oss/backstage-plugin-mcp-chat-node
```

## Exports

| Export                           | Kind             | Description                                                             |
| -------------------------------- | ---------------- | ----------------------------------------------------------------------- |
| `LLMProvider`                    | Abstract class   | Base class all providers extend. Owns `fetch` usage and logger access.  |
| `OpenAICompatibleBase`           | Abstract class   | Shared implementation for OpenAI-compatible HTTP APIs.                  |
| `createLlmProviderModule`        | Factory function | Builds a Backstage backend module for one LLM provider (~20 lines).     |
| `llmProviderExtensionPoint`      | Extension point  | The Backstage extension point providers register through.               |
| `LlmProviderExtensionPoint`      | Type             | TypeScript interface for the extension point.                           |
| `ProviderConfig`                 | Type             | Provider configuration (extends common `ProviderConfig` with `logger`). |
| `CreateLlmProviderModuleOptions` | Type             | Options accepted by `createLlmProviderModule`.                          |

Additionally, this package re-exports all common types that provider modules typically need (`ChatMessage`, `ChatResponse`, `Tool`, `ToolCall`, `MCPServerConfig`, `ConversationRecord`, etc.) so that provider modules only need a single dependency.

## Creating a Custom Provider Module

The fastest way to create a provider module is with `createLlmProviderModule`:

```typescript
// src/module.ts
import { createLlmProviderModule } from '@alithya-oss/backstage-plugin-mcp-chat-node';
import { MyProvider } from './MyProvider';

export default createLlmProviderModule({
  providerId: 'my-provider',
  defaultBaseUrl: 'https://api.myprovider.com/v1',
  providerFactory: config => new MyProvider(config),
});
```

The factory handles:

- Reading the provider entry from `mcpChat.providers[]` config by matching `providerId`
- Applying the `defaultBaseUrl` when config omits `baseUrl`
- Populating `maxTokens` and `temperature` from config
- Registering the constructed provider through the extension point
- Skipping silently when the provider is not configured

### Provider class (extending LLMProvider directly)

```typescript
// src/MyProvider.ts
import {
  LLMProvider,
  type ProviderConfig,
  type ChatMessage,
  type ChatResponse,
  type Tool,
} from '@alithya-oss/backstage-plugin-mcp-chat-node';

export class MyProvider extends LLMProvider {
  async sendMessage(
    messages: ChatMessage[],
    tools?: Tool[],
  ): Promise<ChatResponse> {
    // Implement vendor-specific API call
  }

  async testConnection(): Promise<{
    connected: boolean;
    models?: string[];
    error?: string;
  }> {
    // Implement connection test
  }
}
```

### OpenAI-Compatible Providers (extending OpenAICompatibleBase)

For providers that expose an OpenAI-compatible HTTP API, extend `OpenAICompatibleBase` instead. It implements `sendMessage`, `testConnection`, header construction, request formatting, and response parsing out of the box:

```typescript
// src/MyOpenAICompatibleProvider.ts
import {
  OpenAICompatibleBase,
  type ProviderConfig,
} from '@alithya-oss/backstage-plugin-mcp-chat-node';

export class MyOpenAICompatibleProvider extends OpenAICompatibleBase {
  protected get providerName(): string {
    return 'MyProvider';
  }

  // Optionally override: getHeaders(), formatRequest(), parseResponse()
}
```

Overridable members on `OpenAICompatibleBase`:

| Method            | Purpose                                          |
| ----------------- | ------------------------------------------------ |
| `getHeaders()`    | Add vendor-specific headers (e.g., api-key auth) |
| `formatRequest()` | Customize the request body shape                 |
| `parseResponse()` | Transform the raw API response                   |

### Registering in your backend

```typescript
// In packages/backend/src/index.ts
const backend = createBackend();
backend.add(import('@alithya-oss/backstage-plugin-mcp-chat-backend'));
backend.add(import('./plugins/my-provider-module'));
```

## Configuration

Provider modules read their config from `mcpChat.providers[]`:

```yaml
mcpChat:
  providers:
    - id: my-provider # Must match providerId
      token: ${MY_PROVIDER_API_KEY}
      model: my-model-name
      # Optional:
      # baseUrl: 'https://custom-endpoint.com/v1'
      # maxTokens: 2000
      # temperature: 0.7
```

## License

This package is licensed under the Apache 2.0 License.
