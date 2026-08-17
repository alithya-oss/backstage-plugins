# Design Document — mcp-chat Maintainability Refactor

## Architecture Overview

The refactor realigns the `workspaces/mcp-chat` workspace into a clean layered architecture matching Backstage conventions:

```
┌──────────────────────────────────────────────────────────┐
│  Frontend Plugin (@backstage-community/plugin-mcp-chat)  │
│  ┌───────────────────────────────────────────────────┐   │
│  │  Frontend_Wiring_Module (internal shared wiring)  │   │
│  └───────────────────────────────────────────────────┘   │
└───────────────────────────┬──────────────────────────────┘
                            │ imports types
┌───────────────────────────▼──────────────────────────────┐
│  Common Package (browser-safe contract types only)       │
└──────────────────────────────────────────────────────────┘
                            ▲ imports types
┌───────────────────────────┴──────────────────────────────┐
│  Node Package (provider contract, extension point,       │
│  OpenAI-compatible base, createLlmProviderModule factory) │
└───────────────────────────┬──────────────────────────────┘
              ▲ depends on  │ extension point
┌─────────────┴─────┐      │
│  9 Provider Modules│      │
│  (vendor bits only)│      │
└────────────────────┘      │
                            ▼
┌──────────────────────────────────────────────────────────┐
│  Backend Plugin (plugin entry only, internals private)    │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ services/ routes/ middleware/ utils/                 │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## 1. Target Package Boundary Map

### 1.1 `@backstage-community/plugin-mcp-chat-common`

**Purpose:** Browser-safe contract types only. No Node runtime code.

**Exports:**

- All type interfaces shared across the HTTP boundary: `ChatMessage`, `ChatResponse`, `QueryResponse`, `Tool`, `ToolCall`, `ServerTool`, `ToolExecutionResult`, `MessageValidationResult`, `ProviderConfig` (without `LoggerService` field — that field moves to the node package's extended type), `ProviderInfo`, `ProviderConnectionStatus`, `ProviderStatusData`, `MCPServerConfig`, `MCPServerSecrets`, `MCPServerFullConfig`, `MCPServer`, `MCPServerStatusData`, `ConversationRecord`, `ConversationRow`, `ResponsesApi*` types.
- Enums: `MCPServerType`, `VALID_ROLES`.

**Does NOT export:** `LLMProvider` class (moves to node package), anything importing `@backstage/backend-plugin-api`.

**Dependency changes:** Remove `@backstage/backend-plugin-api` from `dependencies`.

### 1.2 `@backstage-community/plugin-mcp-chat-node`

**Purpose:** Single provider extension surface — everything provider modules need.

**Exports:**

- `LLMProvider` abstract class (moved from common, owns `fetch` + `LoggerService` usage)
- `OpenAICompatibleBase` class (new — extracted from the existing OpenAI/AgentGateway shared logic)
- `createLlmProviderModule` factory function (new)
- `llmProviderExtensionPoint` / `LlmProviderExtensionPoint` (existing)
- `ProviderConfig` type (extended with `logger: LoggerService`)
- Re-exports all common types provider modules need (`ChatMessage`, `ChatResponse`, `Tool`, etc.)

**Deleted files:**

- `src/base-provider.ts` (dead re-export shim)
- `src/types.ts` (dead duplicate of common's `ProviderConfig`)

**New files:**

- `src/LLMProvider.ts` — the abstract base class (moved from common)
- `src/OpenAICompatibleBase.ts` — extracted shared OpenAI-compatible implementation
- `src/createLlmProviderModule.ts` — factory function
- `src/OpenAICompatibleBase.test.ts`
- `src/createLlmProviderModule.test.ts`

### 1.3 `@backstage-community/plugin-mcp-chat-backend`

**Purpose:** Plugin entry point only. All internals are private.

**Single public export:** `default` (the `mcpChatPlugin` result of `createBackendPlugin`)

**Deleted files:**

- `src/extensions.ts` (dead re-export shim for extension point)
- `src/providers/index.ts` (dead re-export shim for `LLMProvider`)
- `src/providers/openai-provider.test.ts` → relocates to the openai module
- `src/providers/provider-config.test.ts` → relocates to the node package

**Private internal structure stays intact** (services, routes, middleware, utils/) but nothing is re-exported.

### 1.4 Provider Modules (9 packages)

Each module contains only:

- `src/module.ts` — calls `createLlmProviderModule(...)`, at most ~20 lines
- `src/<Provider>Provider.ts` — vendor-specific subclass (OpenAI-compatible ones extend `OpenAICompatibleBase`; Claude, Bedrock, Gemini, Ollama, OpenAI-Responses extend `LLMProvider` directly)
- `src/index.ts` — re-exports the module default and the provider class
- `src/<Provider>Provider.test.ts` — provider unit test
- `src/module.test.ts` — module registration test (new)
- Optional: `src/configSchema.ts` — provider-specific config schema

Dependencies: `@backstage-community/plugin-mcp-chat-node`, `@backstage/backend-plugin-api`. **No dependency** on the backend plugin.

### 1.5 Frontend Plugin (`@backstage-community/plugin-mcp-chat`)

Single internal `src/wiring.ts` module feeds both entry points. Component decomposition under 250-line ceiling. Types import from common package with local view-model extensions.

---

## 2. Concrete File-Level Move/Delete/Create Plan

### Deletes

| File                                                  | Reason                                                                              |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `plugins/mcp-chat-node/src/base-provider.ts`          | Dead re-export; `LLMProvider` now lives in own file in this package                 |
| `plugins/mcp-chat-node/src/types.ts`                  | Dead duplicate of common `ProviderConfig`; node package will have own extended type |
| `plugins/mcp-chat-backend/src/extensions.ts`          | Dead re-export shim of extension point from node                                    |
| `plugins/mcp-chat-backend/src/providers/index.ts`     | Dead re-export shim of `LLMProvider` from common                                    |
| `plugins/mcp-chat-backend/src/providers/` (directory) | Emptied after relocations                                                           |

### Relocations

| Source                                                           | Destination                                                         | Reason                                                         |
| ---------------------------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------- |
| `plugins/mcp-chat-backend/src/providers/openai-provider.test.ts` | `plugins/mcp-chat-backend-module-openai/src/OpenAIProvider.test.ts` | Tests belong with the code they test                           |
| `plugins/mcp-chat-backend/src/providers/provider-config.test.ts` | `plugins/mcp-chat-node/src/OpenAICompatibleBase.test.ts` (merged)   | Tests maxTokens/temperature — that logic lives in node package |
| `plugins/mcp-chat-common/src/base-provider.ts` → content         | `plugins/mcp-chat-node/src/LLMProvider.ts`                          | Base class moves to node                                       |

### Creates — Node Package

| File                                  | Content                                       |
| ------------------------------------- | --------------------------------------------- |
| `src/LLMProvider.ts`                  | Abstract base class (moved from common)       |
| `src/OpenAICompatibleBase.ts`         | Shared OpenAI-compatible implementation       |
| `src/createLlmProviderModule.ts`      | Factory function                              |
| `src/types.ts` (rewritten)            | Extended `ProviderConfig` with `logger` field |
| `src/createLlmProviderModule.test.ts` | Factory tests                                 |
| `src/OpenAICompatibleBase.test.ts`    | Base class tests                              |

### Creates — Backend Plugin (internal restructuring)

| File                                      | Content                                            |
| ----------------------------------------- | -------------------------------------------------- |
| `src/services/McpServerLifecycle.ts`      | Server init, connect, disconnect                   |
| `src/services/McpTransportFactory.ts`     | Named transport creation (stdio + streamable-http) |
| `src/services/QueryProcessor.ts`          | processQuery + processQueryWithResponsesApi        |
| `src/services/ProviderStatusReporter.ts`  | getProviderStatus                                  |
| `src/services/McpServerStatusReporter.ts` | getMCPServerStatus                                 |
| `src/services/types.ts`                   | `StreamableHttpTransportOptions` named type        |
| `src/utils/loadServerConfigs.ts`          | Extracted from utils.ts                            |
| `src/utils/validateConfig.ts`             | Extracted from utils.ts                            |
| `src/utils/findNpxPath.ts`                | Extracted from utils.ts                            |
| `src/utils/executeToolCall.ts`            | Extracted from utils.ts                            |
| `src/utils/validateMessages.ts`           | Extracted from utils.ts                            |
| `src/utils/isGuestUser.ts`                | Extracted from utils.ts                            |
| `src/utils/index.ts`                      | Barrel re-export                                   |
| Tests for each new service/util unit      | One test file per unit                             |

### Creates — Frontend Plugin

| File                                                 | Content                                 |
| ---------------------------------------------------- | --------------------------------------- |
| `src/wiring.ts`                                      | Shared routeRef, apiFactory, pageLoader |
| `src/components/ChatContainer/useChatContainer.ts`   | State/effect hook                       |
| `src/components/ChatContainer/ChatContainerView.tsx` | Presentation                            |
| `src/components/ChatContainer/ChatMessageView.tsx`   | Message presentation                    |
| `src/components/ChatContainer/useChatMessage.ts`     | Message state (copy, collapse)          |
| `src/components/RightPane/useRightPane.ts`           | State/effect hook                       |
| `src/components/RightPane/RightPaneView.tsx`         | Presentation                            |

---

## 3. `createLlmProviderModule` Signature

```typescript
// plugins/mcp-chat-node/src/createLlmProviderModule.ts

import {
  createBackendModule,
  coreServices,
} from '@backstage/backend-plugin-api';
import { llmProviderExtensionPoint } from './extensions';
import { LLMProvider } from './LLMProvider';
import type { ProviderConfig } from './types';

/**
 * Options for creating an LLM provider backend module.
 * @public
 */
export interface CreateLlmProviderModuleOptions {
  /** Provider identifier — matches `mcpChat.providers[].id` in config. */
  providerId: string;
  /** Default base URL when config omits `baseUrl`. */
  defaultBaseUrl: string;
  /** Constructor that produces the LLM_Provider from a ProviderConfig. */
  providerFactory: (config: ProviderConfig) => LLMProvider;
}

/**
 * Creates a Backstage backend module that registers one LLM provider.
 *
 * @public
 */
export function createLlmProviderModule(
  options: CreateLlmProviderModuleOptions,
) {
  const { providerId, defaultBaseUrl, providerFactory } = options;

  return createBackendModule({
    pluginId: 'mcp-chat',
    moduleId: providerId,
    register(reg) {
      reg.registerInit({
        deps: {
          config: coreServices.rootConfig,
          logger: coreServices.logger,
          llmProviders: llmProviderExtensionPoint,
        },
        async init({ config, logger, llmProviders }) {
          const providers =
            config.getOptionalConfigArray('mcpChat.providers') ?? [];
          const entry = providers.find(p => p.getString('id') === providerId);

          if (!entry) return; // Not configured — skip silently

          const providerConfig: ProviderConfig = {
            type: providerId,
            apiKey: entry.getOptionalString('token'),
            baseUrl: entry.getOptionalString('baseUrl') ?? defaultBaseUrl,
            model: entry.getString('model'),
            deploymentName: entry.getOptionalString('deploymentName'),
            logger,
            maxTokens: entry.getOptionalNumber('maxTokens'),
            temperature: entry.getOptionalNumber('temperature'),
          };

          const provider = providerFactory(providerConfig);
          llmProviders.registerProvider(providerId, provider);
        },
      });
    },
  });
}
```

After this change, a provider module's `module.ts` reduces to:

```typescript
import { createLlmProviderModule } from '@backstage-community/plugin-mcp-chat-node';
import { OpenAIProvider } from './OpenAIProvider';

export default createLlmProviderModule({
  providerId: 'openai',
  defaultBaseUrl: 'https://api.openai.com/v1',
  providerFactory: config => new OpenAIProvider(config),
});
```

The duplicated `readAuthRecord` helper is removed from all 9 modules because no provider reads auth records.

---

## 4. OpenAI-Compatible Base Class

```typescript
// plugins/mcp-chat-node/src/OpenAICompatibleBase.ts

import { LLMProvider } from './LLMProvider';
import type {
  ChatMessage,
  Tool,
  ChatResponse,
} from '@backstage-community/plugin-mcp-chat-common';

/**
 * Shared base for providers exposing an OpenAI-compatible HTTP API.
 * Overridable members allow vendor-specific customization.
 *
 * @public
 */
export abstract class OpenAICompatibleBase extends LLMProvider {
  /** Human-readable name shown in logs and errors. Override per vendor. */
  protected abstract get providerName(): string;

  async sendMessage(
    messages: ChatMessage[],
    tools?: Tool[],
  ): Promise<ChatResponse> {
    const body = this.formatRequest(messages, tools);
    const response = await this.makeRequest('/chat/completions', body);
    return this.parseResponse(response);
  }

  async testConnection(): Promise<{
    connected: boolean;
    models?: string[];
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return {
          connected: false,
          error: this.mapConnectionError(
            response.status,
            await response.text(),
          ),
        };
      }

      const data = await response.json();
      return {
        connected: true,
        models: data.data?.map((m: any) => m.id) ?? [],
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /** Override to add vendor-specific headers. */
  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  /** Override to customize the request body shape. */
  protected formatRequest(messages: ChatMessage[], tools?: Tool[]): unknown {
    const maxTokens = this.maxTokens ?? 1000;
    const request: Record<string, unknown> = {
      model: this.model,
      messages,
      max_tokens: maxTokens,
      temperature: this.temperature ?? 0.7,
    };
    if (tools && tools.length > 0) {
      request.tools = tools;
    }
    return request;
  }

  /** Override to transform the raw response before returning. */
  protected parseResponse(response: unknown): ChatResponse {
    return response as ChatResponse;
  }

  /**
   * Maps HTTP status codes to user-friendly connection error messages.
   * Status code → error mapping:
   *
   * | Code | Message |
   * |------|---------|
   * | 401  | Invalid API key |
   * | 403  | Access forbidden |
   * | 404  | Endpoint not found |
   * | 429  | Rate limit exceeded |
   */
  private mapConnectionError(status: number, body: string): string {
    switch (status) {
      case 401:
        return `Invalid API key. Please check your ${this.providerName} API key configuration.`;
      case 403:
        return 'Access forbidden. Please check your API key permissions.';
      case 404:
        return `${this.providerName} endpoint not found at ${this.baseUrl}/models.`;
      case 429:
        return `Rate limit exceeded. Please try again later or check your ${this.providerName} usage limits.`;
      default: {
        try {
          const data = JSON.parse(body);
          return data.error?.message ?? body.substring(0, 100);
        } catch {
          return body.length > 100 ? `${body.substring(0, 100)}...` : body;
        }
      }
    }
  }
}
```

Providers extending this class:

- `OpenAIProvider` — overrides `formatRequest` for o-series/gpt-5 `max_completion_tokens` logic
- `LiteLLMProvider` — direct extension, no overrides needed
- `AgentGatewayProvider` — overrides `formatRequest` (tool re-attachment for Bedrock)
- `AzureOpenAIProvider` — overrides `getHeaders` (api-key header) and `formatRequest` (deployment URL)

---

## 5. MCP Client Service Decomposition (300-line ceiling)

Current `MCPClientServiceImpl.ts` is 700 lines. Split into:

| Unit                         | Responsibility                                                            | Est. Lines |
| ---------------------------- | ------------------------------------------------------------------------- | ---------- |
| `McpServerLifecycle.ts`      | `initializeMCPServers()`, connect/disconnect, `filterDiscoveredTools()`   | ~250       |
| `McpTransportFactory.ts`     | `createStdioTransport(options)`, `createStreamableHttpTransport(options)` | ~80        |
| `QueryProcessor.ts`          | `processQuery()`, `processQueryWithResponsesApi()`                        | ~180       |
| `ProviderStatusReporter.ts`  | `getProviderStatus()`                                                     | ~50        |
| `McpServerStatusReporter.ts` | `getMCPServerStatus()`, `getAvailableTools()`                             | ~40        |
| `services/types.ts`          | `StreamableHttpTransportOptions`, `StdioTransportOptions`                 | ~30        |

### Named transport options type

```typescript
// plugins/mcp-chat-backend/src/services/types.ts

export interface StreamableHttpTransportOptions {
  requestInit?: {
    headers: Record<string, string>;
  };
}

export interface StdioTransportOptions {
  command: string;
  args: string[];
  env: Record<string, string | undefined>;
}
```

The existing `MCPClientServiceImpl` class becomes a thin facade that delegates to the new units and implements the `MCPClientService` interface.

---

## 6. Utils Decomposition (300-line ceiling)

Current `utils.ts` is 499 lines. Split into per-concern modules under `src/utils/`:

| File                   | Content                              | Est. Lines |
| ---------------------- | ------------------------------------ | ---------- |
| `loadServerConfigs.ts` | `loadServerConfigs(config, logger)`  | ~60        |
| `validateConfig.ts`    | `validateConfig(config, logger)`     | ~90        |
| `findNpxPath.ts`       | `findNpxPath(logger)`                | ~70        |
| `executeToolCall.ts`   | `executeToolCall(...)`               | ~70        |
| `validateMessages.ts`  | `validateMessages(messages, logger)` | ~120       |
| `isGuestUser.ts`       | `isGuestUser(userEntityRef)`         | ~15        |
| `index.ts`             | Barrel exports                       | ~15        |

Every function that currently calls `console.log`/`console.warn` gains a `logger: LoggerService` parameter. Specifically:

- `findNpxPath` — debug logging when `DEBUG_MCP` is set → replaced with `logger.debug`
- `validateMessages` — `console.warn('Consecutive user messages...')` → `logger.warn`

---

## 7. Backend Error Handling Design

### Error Middleware Registration

```typescript
// In createRouter (router.ts) — AFTER all route mounts:
import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';

const middleware = MiddlewareFactory.create({ config, logger });
router.use(middleware.error());
```

### Route Error Throwing

All route handlers use `express-promise-router` (already in place). Failures throw `@backstage/errors` types:

```typescript
import { InputError, NotFoundError, NotAllowedError } from '@backstage/errors';

// In conversationRoutes.ts:
if (!conversation) throw new NotFoundError('Conversation not found');
```

### Typed Missing-Table Detection

Replace `error?.message?.includes('no such table')` with:

```typescript
function isMissingTableError(error: unknown): boolean {
  if (error instanceof Error && 'code' in error) {
    const code = (error as any).code;
    // SQLite: SQLITE_ERROR with 'no such table'
    // PostgreSQL: relation "..." does not exist (code 42P01)
    return code === 'SQLITE_ERROR' || code === '42P01';
  }
  return false;
}
```

### Status Code / Body Preservation Table

| Route                      | Method | Condition            | Status | Body                                                          | Req  |
| -------------------------- | ------ | -------------------- | ------ | ------------------------------------------------------------- | ---- |
| `/provider/status`         | GET    | success              | 200    | `ProviderStatusData`                                          | 12.1 |
| `/mcp/status`              | GET    | success              | 200    | `MCPServerStatusData`                                         | 12.1 |
| `/tools`                   | GET    | success              | 200    | `{ availableTools, toolCount, timestamp }`                    | 12.1 |
| `/chat`                    | POST   | success              | 200    | `{ role, content, toolResponses, toolsUsed, conversationId }` | 12.1 |
| `/chat`                    | POST   | invalid messages     | 400    | `{ error: string }`                                           | 7.5  |
| `/chat`                    | POST   | invalid enabledTools | 400    | `{ error: string }`                                           | 7.5  |
| `/conversations`           | GET    | success              | 200    | `{ conversations, count }`                                    | 12.1 |
| `/conversations`           | GET    | missing table        | 200    | `{ conversations: [], count: 0 }`                             | 7.5  |
| `/conversations`           | GET    | invalid limit        | 400    | `{ error: string }`                                           | 7.5  |
| `/conversations/:id`       | GET    | not found            | 404    | `{ error: 'Conversation not found' }`                         | 7.5  |
| `/conversations/:id`       | GET    | invalid UUID         | 400    | `{ error: 'Invalid id format' }`                              | 7.5  |
| `/conversations/:id`       | DELETE | success              | 204    | empty                                                         | 12.1 |
| `/conversations/:id`       | DELETE | not found            | 404    | `{ error: 'Conversation not found' }`                         | 7.5  |
| `/conversations/:id/star`  | PATCH  | success              | 200    | `{ isStarred: boolean }`                                      | 12.1 |
| `/conversations/:id/title` | PATCH  | success              | 200    | `{ title: string }`                                           | 12.1 |
| `/conversations/:id/title` | PATCH  | title not string     | 400    | `{ error: 'Title must be a string' }`                         | 7.5  |
| `/conversations/:id/title` | PATCH  | title > 255          | 400    | `{ error: 'Title too long (max 255 characters)' }`            | 7.5  |
| any                        | any    | unauthorized         | 401    | `{ error: 'Unauthorized' }`                                   | 7.5  |
| any                        | any    | guest on protected   | 404    | `{ error: 'Conversation not found' }`                         | 7.5  |
| any                        | any    | internal error       | 500    | `{ error: string }`                                           | 7.5  |

This table is validated by the route-level integration tests.

---

## 8. Frontend Design

### 8.1 Frontend Wiring Module

```typescript
// plugins/mcp-chat/src/wiring.ts
import { createRouteRef } from '@backstage/frontend-plugin-api';
import { createApiRef } from '@backstage/frontend-plugin-api';

export const rootRouteRef = createRouteRef();

export { mcpChatApiRef } from './api';
export { McpChat } from './api/McpChatApi';

export const chatPageLoader = () =>
  import('./components/ChatPage').then(m => m.ChatPage);
```

Key changes:

- `createRouteRef()` without an id argument (Backstage frontend system convention)
- Import from `@backstage/frontend-plugin-api` (not `@backstage/core-plugin-api`)

### 8.2 Legacy Entry Point (`plugin.ts`)

```typescript
import {
  createPlugin,
  createRoutableExtension,
  createApiFactory,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { rootRouteRef, mcpChatApiRef, McpChat, chatPageLoader } from './wiring';
```

Stays compatible with the legacy frontend system but sources everything from `wiring.ts`.

### 8.3 Alpha Entry Point (`alpha.tsx`)

```typescript
import {
  ApiBlueprint,
  createFrontendPlugin,
  discoveryApiRef,
  fetchApiRef,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';
import { rootRouteRef, mcpChatApiRef, McpChat, chatPageLoader } from './wiring';
import { BotIconComponent } from './components/BotIcon';

const mcpChatApi = ApiBlueprint.make({
  params: defineParams =>
    defineParams({
      api: mcpChatApiRef,
      deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
      factory: ({ discoveryApi, fetchApi }) =>
        new McpChat({ discoveryApi, fetchApi }),
    }),
});

const mcpChatPage = PageBlueprint.make({
  params: {
    path: '/mcp-chat',
    title: 'MCP Chat',
    icon: <BotIconComponent />,
    loader: chatPageLoader,
    routeRef: rootRouteRef,
  },
});

export default createFrontendPlugin({
  pluginId: 'mcp-chat',
  extensions: [mcpChatApi, mcpChatPage],
  routes: { root: rootRouteRef },
});
```

### 8.4 `useApi` / `configApiRef` from Frontend Plugin API

All hooks importing `useApi` or `configApiRef` switch their import source:

```typescript
// Before:
import { useApi } from '@backstage/core-plugin-api';
// After:
import { useApi } from '@backstage/frontend-plugin-api';
```

### 8.5 Page Loader — Remove `Page`/`Content`

The `ChatPage.tsx` loader currently wraps in `<Page themeId="tool"><Content noPadding>`. The `PageBlueprint` already provides the page shell. The loader changes to render only the content:

```typescript
export const ChatPage = () => {
  // ... state hooks ...
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: theme.palette.background.default,
      }}
    >
      {/* content without Page/Content wrapper */}
    </Box>
  );
};
```

### 8.6 Error Handling in Hooks

Hooks expose `Error` instances directly. The API client already uses `ResponseError.fromResponse`. Hooks surface that `Error` without wrapping:

```typescript
// In ChatPage — use the error directly:
<ResponseErrorPanel error={combinedError} />
// Where combinedError is Error | undefined (not string)
```

---

## 9. Component Decomposition Plan (250-line ceiling)

### ChatMessage.tsx (507 lines)

| Unit                  | Content                                                         | Est. Lines |
| --------------------- | --------------------------------------------------------------- | ---------- |
| `useChatMessage.ts`   | Copy-to-clipboard state, tool collapse state, code block expand | ~40        |
| `ChatMessageView.tsx` | Avatar, bubble layout, markdown rendering                       | ~200       |
| `ToolCallDetails.tsx` | Collapsible tool call/result display                            | ~120       |

### RightPane.tsx (370 lines)

| Unit                | Content                                                 | Est. Lines |
| ------------------- | ------------------------------------------------------- | ---------- |
| `useRightPane.ts`   | Tab state, collapse state                               | ~30        |
| `RightPaneView.tsx` | Panel layout, tab bar, new-chat button, collapse button | ~180       |

Existing sub-components (ActiveMcpServers, ActiveTools, ConversationHistory, etc.) stay as-is — they're already decomposed.

### ChatContainer.tsx (358 lines)

| Unit                    | Content                                               | Est. Lines |
| ----------------------- | ----------------------------------------------------- | ---------- |
| `useChatContainer.ts`   | Message send, scroll, abort controller, quick prompts | ~130       |
| `ChatContainerView.tsx` | Message list, input bar, quick start display          | ~180       |

### Styling

All decomposed units use the existing mechanism: `useTheme()` from `@mui/material/styles` + `sx` prop. No new styling abstractions introduced.

---

## 10. Testing Strategy Per Package

| Package                   | Test Type          | Coverage Targets                                                                                                                     |
| ------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **common**                | Unit               | Type re-exports resolve (smoke import test)                                                                                          |
| **node**                  | Unit + Property    | `createLlmProviderModule` factory (property: config reading), `OpenAICompatibleBase` (property: header construction, status mapping) |
| **backend**               | Unit + Integration | Each route module (request/response contract), auth middleware, each service unit, each util unit                                    |
| **provider modules** (×9) | Unit               | Provider subclass (formatRequest, testConnection), module registration                                                               |
| **frontend**              | Component (RTL)    | ChatPage, ChatContainerView, ChatMessageView, RightPaneView, BotIcon, useConversations hook                                          |

### Test Conventions (Requirement 11)

- React component tests use `screen` + `findBy*` queries
- No `data-testid` attributes added to implementation
- Backend route tests use `supertest` with mock services
- Property tests use `fast-check` for input generation, minimum 100 iterations

---

## 11. Migration / Changeset Plan

| Package                                        | Bump      | Changeset Summary                                                                                                                                                                                                                                                                                |
| ---------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@backstage-community/plugin-mcp-chat-common`  | **major** | Removed `LLMProvider` class export. Import from `@backstage-community/plugin-mcp-chat-node` instead. Removed `@backstage/backend-plugin-api` dependency.                                                                                                                                         |
| `@backstage-community/plugin-mcp-chat-node`    | **major** | Now exports `LLMProvider`, `OpenAICompatibleBase`, `createLlmProviderModule`, and `ProviderConfig`. Removed dead `base-provider.ts` re-export and `types.ts` duplicate. Consumers that imported `LLMProvider` from common should import from this package.                                       |
| `@backstage-community/plugin-mcp-chat-backend` | **major** | Public API reduced to the single plugin default export. Removed re-exports of `LLMProvider`, `llmProviderExtensionPoint`, services, utilities, and router. Adopters importing these should switch to `@backstage-community/plugin-mcp-chat-node` for extension types or rely on internal wiring. |
| `@backstage-community/plugin-mcp-chat`         | **minor** | Added `/alpha` entry point support via `@backstage/frontend-plugin-api`. Internal component decomposition — no user-facing API change.                                                                                                                                                           |
| Each provider module (×9)                      | **minor** | Switched to `createLlmProviderModule` factory. Removed unused `readAuthRecord` helper. No adopter action needed — the module's public behaviour and config schema are unchanged.                                                                                                                 |

---

## 12. Sequencing and Risk Notes

### Build Order (each step keeps `yarn tsc:full` green)

1. **Common package** — Remove `LLMProvider` class, remove `@backstage/backend-plugin-api` dependency. Only type exports remain.
2. **Node package** — Add `LLMProvider.ts`, `OpenAICompatibleBase.ts`, `createLlmProviderModule.ts`, extended `ProviderConfig` type. Update `index.ts` exports. Delete dead `base-provider.ts` and `types.ts`.
3. **Provider modules** (all 9, in parallel) — Switch module.ts to `createLlmProviderModule`. OpenAI-compatible providers extend `OpenAICompatibleBase`. Others extend `LLMProvider` from node.
4. **Backend plugin** — Delete re-export shims (`extensions.ts`, `providers/index.ts`). Reduce `index.ts` to single default export. Decompose `MCPClientServiceImpl.ts` and `utils.ts`. Add error middleware. Relocate tests.
5. **Frontend plugin** — Add `wiring.ts`. Refactor `plugin.ts` and `alpha.tsx` to source from it. Decompose large components. Switch to frontend-plugin-api imports. Remove `Page`/`Content` from loader.
6. **Verification** — Run full pipeline: `yarn tsc:full`, `yarn lint --fix`, `yarn test`, `yarn build:api-reports`, `yarn build:knip-reports`.

### Risks and Mitigations

| Risk                                                                 | Mitigation                                                                                                         |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Step 1+2 break provider modules before step 3                        | Execute steps 1–3 atomically in one PR, or add temporary re-export in common during transition                     |
| Backend decomposition changes error shapes                           | Status code preservation table (Section 7) validated by integration tests added in the same PR                     |
| Frontend `Page`/`Content` removal changes styling                    | `PageBlueprint` provides equivalent shell; visual regression tested manually against dev server                    |
| `createRouteRef()` without id may break route binding in legacy apps | Backstage dropped the id requirement in core-plugin-api 1.9+; workspace's backstage.json pins a compatible version |
| Property `maxTokens`/`temperature` default changes                   | Factory applies the same defaults as current per-provider code (`1000`/`0.7` for OpenAI-compatible)                |
| Provider modules still import from common for types                  | Node package re-exports needed common types so provider modules can import from a single source                    |

---

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Factory module registration

_For any_ valid provider id (non-empty string), valid base URL, and mock provider constructor, calling `createLlmProviderModule` and initializing it with a config containing a matching `mcpChat.providers[].id` entry SHALL result in `registerProvider` being called on the extension point with the correct provider id and a provider instance.

**Validates: Requirements 4.1, 4.4**

### Property 2: Factory default base URL fallback

_For any_ provider configuration entry that omits the `baseUrl` key, the `ProviderConfig` passed to the provider constructor SHALL contain the `defaultBaseUrl` value supplied to `createLlmProviderModule`.

**Validates: Requirements 4.3**

### Property 3: Factory maxTokens and temperature propagation

_For any_ provider configuration entry containing a positive integer `maxTokens` and a numeric `temperature` in [0, 2], the `ProviderConfig` passed to the provider constructor SHALL carry those exact values.

**Validates: Requirements 4.5**

### Property 4: OpenAI-compatible base formats requests with config values

_For any_ `ProviderConfig` with `maxTokens > 0` and `temperature ∈ [0, 2]`, the `formatRequest` output of `OpenAICompatibleBase` SHALL include `max_tokens` equal to `maxTokens` and `temperature` equal to `temperature`.

**Validates: Requirements 5.5**

### Property 5: OpenAI-compatible base includes authorization header

_For any_ `ProviderConfig` with a non-empty `apiKey`, `getHeaders()` SHALL return a headers object containing an `Authorization` key with value `Bearer <apiKey>`.

**Validates: Requirements 5.1**

### Property 6: Utility functions emit diagnostics through injected logger

_For any_ utility function that emits diagnostic output (findNpxPath, validateMessages), calling it with a mock `LoggerService` SHALL result in at least one call to the logger and zero calls to `console.log`/`console.warn`/`console.error`.

**Validates: Requirements 6.7**

### Property 7: Route handlers throw @backstage/errors types on failure

_For any_ invalid request payload delivered to a route handler (invalid JSON body, missing required fields, invalid UUID, etc.), the handler SHALL throw an error that is an instance of a class from `@backstage/errors` (InputError, NotFoundError, NotAllowedError).

**Validates: Requirements 7.2**

### Property 8: Backend route paths preserved

_For any_ HTTP method+path pair served by the current router implementation (GET /provider/status, GET /mcp/status, GET /tools, POST /chat, GET /conversations, GET /conversations/:id, DELETE /conversations/:id, PATCH /conversations/:id/star, PATCH /conversations/:id/title), the refactored router SHALL handle requests at that same method+path without returning 404.

**Validates: Requirements 12.1**

### Property 9: Frontend hooks expose Error instances

_For any_ hook in the frontend plugin that exposes an error state (useProviderStatus, useMcpServers, useConversations, useAvailableTools), the error value SHALL be `undefined` or an instance of `Error`.

**Validates: Requirements 9.6**
