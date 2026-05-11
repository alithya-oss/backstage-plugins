# MCP Chat Backend Module - Agent Gateway

This module provides an [Agent Gateway](https://github.com/agentgateway/agentgateway) LLM provider for the `@alithya-oss/backstage-plugin-mcp-chat-backend` plugin.

Agent Gateway is an open-source gateway that provides a unified OpenAI-compatible API in front of multiple LLM providers and MCP servers.

## Installation

```bash
# From your Backstage root directory
yarn --cwd packages/backend add @alithya-oss/backstage-plugin-mcp-chat-backend-module-agentgateway
```

### Add to your backend

```ts
// In packages/backend/src/index.ts
const backend = createBackend();
// ... other plugins
backend.add(import('@alithya-oss/backstage-plugin-mcp-chat-backend'));
backend.add(
  import('@alithya-oss/backstage-plugin-mcp-chat-backend-module-agentgateway'),
);
```

## Configuration

Add the following to your `app-config.yaml`:

```yaml
mcpChat:
  providers:
    - id: agentgateway
      baseUrl: 'http://localhost:4000/v1' # Agent Gateway endpoint
      token: ${AGENT_GATEWAY_API_KEY} # Optional: API key if authentication is enabled
      model: gpt-4o-mini # Model name as configured in Agent Gateway
```

### Environment Variables

```bash
# Optional: Only required if Agent Gateway has authentication enabled
export AGENT_GATEWAY_API_KEY="your-api-key"
```

## How It Works

Agent Gateway exposes an OpenAI-compatible API (`/v1/chat/completions`, `/v1/models`), so this module uses the same request/response format as the OpenAI provider while allowing independent configuration under the `agentgateway` provider id.
