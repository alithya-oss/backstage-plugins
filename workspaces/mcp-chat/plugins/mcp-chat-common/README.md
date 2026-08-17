# @alithya-oss/backstage-plugin-mcp-chat-common

Shared contract types for the MCP Chat plugin ecosystem. This package contains **only browser-safe types** — interfaces, type aliases, and enums — shared between the frontend and backend packages over the HTTP boundary.

## Purpose

This package defines the data shapes exchanged between the MCP Chat frontend plugin and backend plugin. It contains no runtime code, no Node.js-specific imports, and no class implementations.

## Usage

This package is consumed **transitively** — you do not need to install it directly. It is pulled in automatically when you install either:

- `@alithya-oss/backstage-plugin-mcp-chat` (frontend)
- `@alithya-oss/backstage-plugin-mcp-chat-node` (provider development)

Direct installation is only needed if you are building a standalone integration outside this workspace that requires the shared type definitions:

```bash
yarn add @alithya-oss/backstage-plugin-mcp-chat-common
```

## Exports

### Types (interfaces and type aliases)

| Type                       | Description                                         |
| -------------------------- | --------------------------------------------------- |
| `ProviderConfig`           | Provider configuration shape (without logger field) |
| `ProviderInfo`             | Provider identity metadata                          |
| `ProviderConnectionStatus` | Connection test result                              |
| `ProviderStatusData`       | Full provider status response                       |
| `MCPServerConfig`          | MCP server configuration from app-config            |
| `MCPServerSecrets`         | Server credentials (env vars, headers)              |
| `MCPServerFullConfig`      | Combined server config + secrets                    |
| `MCPServer`                | Runtime MCP server state                            |
| `MCPServerStatusData`      | MCP server status response                          |
| `ChatMessage`              | A single chat message (role + content)              |
| `ChatResponse`             | LLM response with tool calls                        |
| `QueryResponse`            | Full query result including tool responses          |
| `Tool`                     | Tool definition (name, description, schema)         |
| `ToolCall`                 | A tool invocation from the LLM                      |
| `ServerTool`               | Tool with server association                        |
| `ToolExecutionResult`      | Result of executing a tool                          |
| `MessageValidationResult`  | Message validation outcome                          |
| `ConversationRecord`       | Stored conversation metadata                        |
| `ConversationRow`          | Raw database row for a conversation                 |
| `ResponsesApiMcpTool`      | OpenAI Responses API MCP tool definition            |
| `ResponsesApiMcpListTools` | Responses API list tools response                   |
| `ResponsesApiMcpCall`      | Responses API MCP tool call                         |
| `ResponsesApiMessage`      | Responses API message format                        |
| `ResponsesApiResponse`     | Responses API full response                         |
| `ResponsesApiOutputEvent`  | Responses API output event                          |

### Enums and constants

| Export          | Description                        |
| --------------- | ---------------------------------- |
| `MCPServerType` | Enum of supported MCP server types |
| `VALID_ROLES`   | Array of valid chat message roles  |

## Important Notes

- This package does **NOT** contain the `LLMProvider` base class (that lives in `@alithya-oss/backstage-plugin-mcp-chat-node`)
- This package does **NOT** import `@backstage/backend-plugin-api` or any Node.js-specific dependencies
- Provider modules should depend on the **node** package, which re-exports these types alongside the provider contracts

## License

This package is licensed under the Apache 2.0 License.
