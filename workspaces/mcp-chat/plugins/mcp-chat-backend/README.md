# MCP Chat for Backstage

Welcome to the MCP (Model Context Protocol) Chat plugin for Backstage! This plugin enables you to integrate AI-powered chat capabilities into your Backstage platform, supporting multiple AI providers and MCP servers.

[![Backstage](https://img.shields.io/badge/Backstage-Plugin-blue.svg)](https://backstage.io)

## Overview

The MCP Chat plugin brings conversational AI capabilities directly into your Backstage environment. It leverages the Model Context Protocol to connect with various AI providers and external tools, enabling developers to interact with their infrastructure, catalogs, and external services through natural language.

## Features

- 🤖 **Multi-Provider AI Support**: Works with OpenAI, Claude, Gemini, Ollama, LiteLLM, Amazon Bedrock, and more
- 🧩 **Modular Provider Architecture**: Each LLM provider is a separate backend module — install only what you need
- 🔧 **Multi-Server Support**: Connect multiple MCP servers (STDIO, Streamable HTTP)
- 🛠️ **Tool Management**: Browse and dynamically enable/disable tools from connected MCP servers
- 💬 **Rich Chat Interface**: Beautiful, responsive chat UI with markdown support
- ⚡ **Quick Setup**: Configurable QuickStart prompts for common use cases
- 📜 **Conversation History**: Automatic saving, starring, search, and management of chat sessions
- 🔌 **Extensible**: Create custom provider modules using the `llmProviderExtensionPoint`

## Supported AI Providers

The following AI providers and models have been thoroughly tested:

| Provider                 | Module Package                | Model                      | Status          | Notes                                                         |
| ------------------------ | ----------------------------- | -------------------------- | --------------- | ------------------------------------------------------------- |
| **OpenAI**               | `...-module-openai`           | `gpt-4o-mini`              | ✅ Fully Tested | Recommended for production use                                |
| **OpenAI Responses API** | `...-module-openai-responses` | Various                    | ✅ Tested       | Handles MCP tool execution internally (see below)             |
| **Azure OpenAI**         | `...-module-azure-openai`     | `gpt-5.1`                  | ✅ Tested       | Requires v1 API endpoint                                      |
| **Gemini**               | `...-module-gemini`           | `gemini-2.5-flash`         | ✅ Fully Tested | Excellent performance with tool calling                       |
| **Anthropic (Claude)**   | `...-module-anthropic`        | `claude-sonnet-4-20250514` | ✅ Tested       | High-quality responses with tool calling                      |
| **Ollama**               | `...-module-ollama`           | `llama3.1:8b`              | ✅ Tested       | Works well, but `llama3.1:30b` recommended for better results |
| **LiteLLM**              | `...-module-litellm`          | Various                    | ✅ Tested       | Proxy for 100+ LLMs with unified API interface                |
| **Amazon Bedrock**       | `...-module-amazon-bedrock`   | Various                    | ✅ Tested       | AWS-native LLM access via Bedrock                             |
| **Agent Gateway**        | `...-module-agentgateway`     | Various                    | ✅ Tested       | Gateway for agent-based workflows                             |

> **Note**: Each provider is installed as a separate backend module. Only install the modules for providers you intend to use. The plugin supports any provider that implements tool calling functionality via the `llmProviderExtensionPoint`.

### OpenAI Responses API Provider

The **OpenAI Responses API** provider is a special provider type that delegates MCP tool discovery and execution to the API itself, rather than handling tools locally. This is useful when:

- You have a centralized API gateway that manages MCP servers
- You want to offload tool execution to a remote service
- Your MCP servers are only accessible from a specific network/environment

**Key Differences from Standard Providers:**

- **Tool Execution**: The API handles all MCP tool calls internally
- **MCP Server Requirements**: Only URL-based MCP servers are supported (no STDIO/npxCommand)
- **Configuration**: MCP server configs are sent to the API in each request
- **UI Experience**: The chat UI displays tool outputs identically to standard providers

**Example Configuration:**

```yaml
mcpChat:
  providers:
    - id: openai-responses
      baseUrl: 'http://gemini-mcp-servers.apps.example.com/v1/openai/v1'
      model: 'gemini/models/gemini-2.5-flash'
      token: 'your-api-token' # Optional

  mcpServers:
    - id: k8s
      name: Kubernetes Server
      url: 'https://kubernetes-mcp-server.example.com/mcp'
      type: streamable-http

    - id: brave-search
      name: Brave Search
      url: 'https://brave-search-mcp.example.com/mcp'
      type: streamable-http
```

**Authorization Headers Support:**

The Responses API provider supports passing authorization headers to MCP servers that require authentication. Headers configured in your MCP server config are automatically forwarded to the API:

```yaml
mcpServers:
  - id: github-copilot
    name: GitHub Copilot MCP
    url: 'https://api.githubcopilot.com/mcp'
    type: streamable-http
    headers:
      Authorization: 'Bearer ghp_your_github_token_here'

  - id: backstage-server
    name: Backstage MCP Server
    url: 'http://localhost:7007/api/mcp-actions/v1'
    type: streamable-http
    headers:
      Authorization: 'Bearer your_backstage_token'
      X-Custom-Header: 'custom-value'
```

The headers are included in the Responses API request for each server:

```json
{
  "tools": [
    {
      "type": "mcp",
      "server_url": "https://api.githubcopilot.com/mcp",
      "server_label": "github-copilot",
      "require_approval": "never",
      "headers": {
        "Authorization": "Bearer ghp_your_github_token_here"
      }
    }
  ]
}
```

**Important Notes:**

- The `baseUrl` must point to a Responses API compatible endpoint
- MCP servers must be configured with `url` (STDIO servers will be ignored)
- Headers are optional - servers without headers work normally
- Multiple custom headers can be specified per server

## Quick Start with Gemini (Free)

To quickly test this plugin, we recommend using Gemini's free API:

1. **Visit Google AI Studio**: Go to <https://aistudio.google.com>
2. **Sign in**: Use your Google account to sign in
3. **Create API Key**:
   - Click on "**Get API key**" in the left sidebar
   - Click "**Create API key in new project**" (or select an existing project)
   - **Copy** the generated API key
4. **Set Environment Variable**:

   ```bash
   export GEMINI_API_KEY="your-api-key-here"
   ```

> **💡 Tip**: Gemini offers a generous **free tier** that's perfect for testing and development with the MCP Chat.

## Screenshots

<div align="center">

<table>
  <tr>
    <td style="padding: 0 10px;">
      <img src="../../docs/images/quick-prompts.png" alt="Quick Prompts" width="900"/>
      <div align="center"><em>Pre-configured prompts for common tasks</em></div>
    </td>
    <td rowspan="2" style="vertical-align: top; padding: 0 10px;">
      <img src="../../docs/images/mcp-tools-panel.png" alt="MCP Tools Panel" height="600"/>
      <div align="center"><em>Available MCP tools and server connections</em></div>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 10px;">
      <img src="../../docs/images/chat-interface.png" alt="Chat Interface" width="900"/>
      <div align="center"><em>The main chat interface with AI responses and tool integration</em></div>
    </td>
  </tr>
</table>

</div>

## Prerequisites

- Backstage v1.20+ (for new backend system support)
- Backstage v1.40+ (if installing Backstage MCP server in the same instance)
- Node.js 18+
- One or more AI provider API keys (OpenAI, Gemini, etc.)
- (Optional) MCP server dependencies

## Architecture

The MCP Chat plugin follows a **modular architecture** using Backstage's backend module system. LLM providers are implemented as separate backend modules that register themselves via an extension point, allowing you to install only the providers you need.

### Package Overview

| Package                                          | Role            | Description                                                                       |
| ------------------------------------------------ | --------------- | --------------------------------------------------------------------------------- |
| `@alithya-oss/backstage-plugin-mcp-chat`         | Frontend plugin | Chat UI, tool management panel, conversation history                              |
| `@alithya-oss/backstage-plugin-mcp-chat-backend` | Backend plugin  | Core backend: router, MCP client, conversation store                              |
| `@alithya-oss/backstage-plugin-mcp-chat-common`  | Common library  | Browser-safe contract types and enums                                             |
| `@alithya-oss/backstage-plugin-mcp-chat-node`    | Node library    | `LLMProvider`, `OpenAICompatibleBase`, `createLlmProviderModule`, extension point |

### Provider Modules

Each LLM provider is a standalone backend module that registers itself with the core plugin via the `llmProviderExtensionPoint`:

| Module Package                                                           | Provider ID        | Description                       |
| ------------------------------------------------------------------------ | ------------------ | --------------------------------- |
| `@alithya-oss/backstage-plugin-mcp-chat-backend-module-openai`           | `openai`           | OpenAI Chat Completions API       |
| `@alithya-oss/backstage-plugin-mcp-chat-backend-module-openai-responses` | `openai-responses` | OpenAI Responses API (native MCP) |
| `@alithya-oss/backstage-plugin-mcp-chat-backend-module-azure-openai`     | `azure-openai`     | Azure OpenAI Service              |
| `@alithya-oss/backstage-plugin-mcp-chat-backend-module-anthropic`        | `claude`           | Anthropic Claude                  |
| `@alithya-oss/backstage-plugin-mcp-chat-backend-module-gemini`           | `gemini`           | Google Gemini                     |
| `@alithya-oss/backstage-plugin-mcp-chat-backend-module-ollama`           | `ollama`           | Local Ollama models               |
| `@alithya-oss/backstage-plugin-mcp-chat-backend-module-litellm`          | `litellm`          | LiteLLM proxy (100+ LLMs)         |
| `@alithya-oss/backstage-plugin-mcp-chat-backend-module-amazon-bedrock`   | `amazon-bedrock`   | Amazon Bedrock                    |
| `@alithya-oss/backstage-plugin-mcp-chat-backend-module-agentgateway`     | `agentgateway`     | Agent Gateway                     |

## Installation

### Backend Installation

1. **Install the core backend plugin**:

   ```bash
   # From your Backstage root directory
   yarn --cwd packages/backend add @alithya-oss/backstage-plugin-mcp-chat-backend
   ```

2. **Install the provider module(s) you need**:

   ```bash
   # Example: Install Gemini and OpenAI providers
   yarn --cwd packages/backend add @alithya-oss/backstage-plugin-mcp-chat-backend-module-gemini
   yarn --cwd packages/backend add @alithya-oss/backstage-plugin-mcp-chat-backend-module-openai
   ```

3. **Register the plugin and modules in your backend**:

   ```ts
   // In packages/backend/src/index.ts
   const backend = createBackend();
   // ... other plugins

   // Core MCP Chat plugin
   backend.add(import('@alithya-oss/backstage-plugin-mcp-chat-backend'));

   // Add the provider module(s) you installed
   backend.add(
     import('@alithya-oss/backstage-plugin-mcp-chat-backend-module-gemini'),
   );
   backend.add(
     import('@alithya-oss/backstage-plugin-mcp-chat-backend-module-openai'),
   );
   ```

> **Note**: Only the first configured provider in `app-config.yaml` is used at runtime. You can install multiple modules but only one will be active based on your configuration.

### Frontend Installation

1. **Install the frontend plugin**:

   ```bash
   # From your Backstage root directory
   yarn --cwd packages/app add @alithya-oss/backstage-plugin-mcp-chat
   ```

2. **Add to your app**:

   **For the classic frontend system:**

   ```tsx
   // In packages/app/src/App.tsx
   import { McpChatPage } from '@alithya-oss/backstage-plugin-mcp-chat';

   // Add to your routes
   <Route path="/mcp-chat" element={<McpChatPage />} />;
   ```

3. **Add navigation**:

   ```tsx
   // In packages/app/src/components/Root/Root.tsx
   import { MCPChatIcon } from '@alithya-oss/backstage-plugin-mcp-chat';

   // In your sidebar items
   <SidebarItem icon={MCPChatIcon} to="mcp-chat" text="MCP Chat" />;
   ```

## Configuration

Add the following configuration to your `app-config.yaml`. Only configure the provider(s) whose module you have installed:

```yaml
mcpChat:
  # Configure AI providers (only the first provider is used at runtime)
  # Each provider requires its corresponding backend module to be installed
  providers:
    - id: openai # Requires: @alithya-oss/backstage-plugin-mcp-chat-backend-module-openai
      token: ${OPENAI_API_KEY}
      model: gpt-4o-mini # or gpt-4, gpt-3.5-turbo, etc.
      # Optional: Customize max tokens (default: 1000)
      # maxTokens: 1000
      # Optional: Customize temperature 0-1 (default: 0.7)
      # temperature: 0.7
    - id: openai-responses # Requires: @alithya-oss/backstage-plugin-mcp-chat-backend-module-openai-responses
      baseUrl: 'http://your-responses-api-endpoint.com/v1/openai/v1'
      model: 'gemini/models/gemini-2.5-flash'
      token: ${API_TOKEN} # Optional, depends on your API setup
    - id: azure-openai # Requires: @alithya-oss/backstage-plugin-mcp-chat-backend-module-azure-openai
      baseUrl: 'https://your-api-endpoint.openai.azure.com/openai/v1'
      token: ${AZURE_OPENAI_API_KEY}
      model: 'gpt-5.1'
      deploymentName: 'your-deployment-name'
    - id: claude # Requires: @alithya-oss/backstage-plugin-mcp-chat-backend-module-anthropic
      token: ${CLAUDE_API_KEY}
      model: claude-sonnet-4-20250514 # or claude-3-7-sonnet-latest
      # Optional: Customize max tokens (default: 4096)
      # maxTokens: 4096
      # Optional: Customize temperature 0-1
      # temperature: 0.7
    - id: gemini # Requires: @alithya-oss/backstage-plugin-mcp-chat-backend-module-gemini
      token: ${GEMINI_API_KEY}
      model: gemini-2.5-flash # or gemini-2.0-pro, etc.
      # Optional: Customize max tokens (default: 8192)
      # maxTokens: 8192
      # Optional: Customize temperature 0-1 (default: 0.7)
      # temperature: 0.7
    - id: ollama # Requires: @alithya-oss/backstage-plugin-mcp-chat-backend-module-ollama
      baseUrl: 'http://localhost:11434'
      model: llama3.1:8b # or any model you have locally
      # Optional: Customize max tokens (default: 1000)
      # maxTokens: 1000
      # Optional: Customize temperature 0-1 (default: 0.7)
      # temperature: 0.7
    - id: litellm # Requires: @alithya-oss/backstage-plugin-mcp-chat-backend-module-litellm
      baseUrl: 'http://localhost:4000' # LiteLLM proxy URL
      token: ${LITELLM_API_KEY} # Optional, depends on your LiteLLM setup
      model: gpt-4o-mini # Model name configured in LiteLLM
      # Optional: Customize max tokens (default: 1000)
      # maxTokens: 1000
      # Optional: Customize temperature 0-1 (default: 0.7)
      # temperature: 0.7
    - id: amazon-bedrock # Requires: @alithya-oss/backstage-plugin-mcp-chat-backend-module-amazon-bedrock
      model: anthropic.claude-sonnet-4-20250514-v1:0 # or any Bedrock model ID
      # Optional: AWS region (defaults to AWS_REGION env var)
      # region: us-east-1
    - id: agentgateway # Requires: @alithya-oss/backstage-plugin-mcp-chat-backend-module-agentgateway
      baseUrl: 'http://your-agent-gateway.example.com'
      model: 'default'
      token: ${AGENTGATEWAY_TOKEN} # Optional

  # Configure MCP servers
  mcpServers:
    # Brave Search for web searching
    - id: brave-search-server
      name: Brave Search Server
      npxCommand: '@modelcontextprotocol/server-brave-search@latest'
      env:
        BRAVE_API_KEY: ${BRAVE_API_KEY}

    # Kubernetes server for K8s operations
    - id: kubernetes-server
      name: Kubernetes Server
      npxCommand: 'kubernetes-mcp-server@latest'
      env:
        KUBECONFIG: ${KUBECONFIG}
      # Optional: exclude specific tools from the LLM
      disabledTools:
        - pods_delete
        - pods_exec

    # Backstage server integration (with authorization headers)
    - id: backstage-server
      name: Backstage Server
      url: 'http://localhost:7007/api/mcp-actions/v1'
      headers:
        Authorization: 'Bearer ${BACKSTAGE_MCP_TOKEN}'

    # GitHub Copilot MCP (requires authentication)
    - id: github-copilot
      name: GitHub Copilot MCP
      url: 'https://api.githubcopilot.com/mcp'
      headers:
        Authorization: 'Bearer ${GITHUB_TOKEN}'

  # Optional: Customize the system prompt for the AI assistant
  # If not specified, uses a default prompt optimized for tool usage
  systemPrompt: "You are a helpful assistant. When using tools, provide a clear, readable summary of the results rather than showing raw data. Focus on answering the user's question with the information gathered."

  # Configure quick prompts
  quickPrompts:
    - title: 'Search Latest Tech News'
      description: 'Find the latest technology news and developments'
      prompt: 'Search for the latest developments in Model Context Protocol and its applications'
      category: Research

    - title: 'Kubernetes Health Check'
      description: 'Check the health of Kubernetes clusters'
      prompt: 'Show me the current Kubernetes deployments, pods status, and resource utilization in a nicely formatted text with bullet points'
      category: Infrastructure

    - title: 'Backstage Catalog Query'
      description: 'Query the Backstage software catalog'
      prompt: 'Describe the "example-app" microservice in our Backstage catalog'
      category: Catalog

  # Conversation history settings (optional)
  conversationHistory:
    displayLimit: 20 # Number of conversations shown in UI (default: 10)
    autoSummarize: true # Auto-generate titles using LLM (default: true)
    summarizeTimeout: 3000 # Title generation timeout in ms (default: 3000)
```

### System Prompt Configuration

The `systemPrompt` configuration allows you to customize the AI assistant's behavior and personality. This optional setting controls how the assistant responds and approaches tasks.

**Default Behavior:**
If not specified, the plugin uses this default prompt:

```
You are a helpful assistant. When using tools, provide a clear, readable summary of the results rather than showing raw data. Focus on answering the user's question with the information gathered.
```

**Custom Examples:**

```yaml
# Concise and technical
systemPrompt: 'You are a technical assistant. Provide concise, actionable responses.'

# Domain-specific expertise
systemPrompt: 'You are a Kubernetes expert. When answering questions, prioritize best practices for cloud-native deployments and provide specific kubectl commands when helpful.'

# Security-focused
systemPrompt: 'You are a security-focused DevOps assistant. Always consider security implications and suggest secure alternatives when applicable.'
```

**Tips:**

- Keep prompts focused and clear
- Mention specific domains or expertise when relevant
- Include instructions about response format if needed
- The system prompt affects all AI interactions in the plugin

### Provider Response Configuration

You can customize the response generation behavior for each provider using optional `maxTokens` and `temperature` settings.

#### Max Tokens

The `maxTokens` setting controls the maximum number of tokens (words/characters) the AI can generate in a single response.

**Default Values by Provider:**

- **OpenAI/LiteLLM**: 1000 tokens
- **Claude**: 4096 tokens
- **Gemini**: 8192 tokens
- **Ollama**: 1000 tokens (via `num_predict` option)

**Example Configuration:**

```yaml
providers:
  - id: openai
    token: ${OPENAI_API_KEY}
    model: gpt-4o-mini
    maxTokens: 2000 # Generate up to 2000 tokens
```

**When to Adjust:**

- Increase for long-form responses or detailed explanations
- Decrease to save costs or enforce concise responses
- Consider your model's context window limits

#### Temperature

The `temperature` setting controls randomness in responses (0-1 scale):

**Default Value:** 0.7 (for most providers)

- **Lower values (0.0-0.3)**: More focused, deterministic, consistent responses
- **Medium values (0.4-0.7)**: Balanced creativity and consistency (default)
- **Higher values (0.8-1.0)**: More creative, diverse, and random responses

**Example Configuration:**

```yaml
providers:
  - id: claude
    token: ${CLAUDE_API_KEY}
    model: claude-sonnet-4-20250514
    temperature: 0.3 # More deterministic responses

  - id: gemini
    token: ${GEMINI_API_KEY}
    model: gemini-2.5-flash
    temperature: 0.9 # More creative responses
```

**When to Adjust:**

- Use **lower temperature** for factual queries, code generation, data analysis
- Use **higher temperature** for brainstorming, creative writing, exploration
- Keep **default (0.7)** for general-purpose assistant behavior

**Note:** Claude provider supports temperature but doesn't set a default value, relying on the API's own defaults unless explicitly configured.

For more advanced MCP server configuration examples (including STDIO, Streamable HTTP, custom scripts, and arguments), see [SERVER_CONFIGURATION](../../docs/SERVER_CONFIGURATION.md).

### Tool-Level Filtering (disabledTools)

Administrators can exclude specific tools from an MCP server using the `disabledTools` configuration. Disabled tools are filtered out at discovery time and are never exposed to the LLM or the frontend.

```yaml
mcpServers:
  - id: kubernetes-server
    name: Kubernetes Server
    npxCommand: 'kubernetes-mcp-server@latest'
    env:
      KUBECONFIG: ${KUBECONFIG}
    disabledTools:
      - pods_delete
      - pods_exec
```

### Conversation History Configuration

The plugin automatically saves chat conversations for authenticated users. Configuration options:

| Option             | Default | Description                                                            |
| ------------------ | ------- | ---------------------------------------------------------------------- |
| `displayLimit`     | 10      | Number of recent conversations displayed in the UI                     |
| `autoSummarize`    | true    | Whether to generate AI-powered titles for conversations                |
| `summarizeTimeout` | 3000    | Timeout (ms) for title generation before falling back to first message |

**Notes:**

- Conversations are stored in a `mcp_chat_conversations` database table
- Guest users (`user:development/guest`) do not have conversations saved
- Starred conversations appear at the top of the history list
- Search filters conversations by title on the client side

### Environment Variables

Set the following environment variables in your Backstage deployment:

```bash
# AI Provider API Keys
export OPENAI_API_KEY="sk-..."
export GEMINI_API_KEY="..."
export LITELLM_API_KEY="sk-..." # Optional, for LiteLLM proxy authentication

# MCP Server Configuration
export BRAVE_API_KEY="..."
export BACKSTAGE_MCP_TOKEN="..."
export GITHUB_TOKEN="ghp_..."  # For GitHub Copilot MCP or other GitHub integrations
export KUBECONFIG="/path/to/your/kubeconfig.yaml"
```

## Usage

1. **Navigate to the Plugin**: Go to the **MCP Chat** page in your Backstage instance

2. **Access Configuration**: Expand the Configuration sidebar on the right to view:

   - Provider connectivity status
   - Connected MCP servers and their available tools
   - Tool management controls for enabling/disabling specific servers

3. **Start Chatting**: Begin a conversation by:
   - Selecting from the provided quick prompts, or
   - Typing your own queries directly into the chat input field

### Example Queries

| Query                                                              | MCP Server Required | Purpose                         |
| ------------------------------------------------------------------ | ------------------- | ------------------------------- |
| "Search for the latest news about Kubernetes security"             | Brave Search        | Find relevant articles and news |
| "Show me all pods in the default namespace"                        | Kubernetes          | Query cluster resources         |
| "Describe the "example-app" microservice in our Backstage catalog" | Backstage           | Access catalog entity           |

## Development

### Local Development Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/alithya-oss/backstage-plugins.git
   cd workspaces/mcp-chat
   ```

2. **Install dependencies**:

   ```bash
   yarn install
   ```

3. **Start the development server**:

   ```bash
   yarn start
   ```

4. **Access the plugin**: Navigate to <http://localhost:3000/mcp-chat>

### Testing

Run the test suite:

```bash
# Run all tests
yarn test:all

# Run tests in watch mode
yarn test --watch
```

### Building

Build all packages:

```bash
yarn build:all
```

## Troubleshooting

### Common Issues

#### AI Provider Shows as Disconnected

- **Cause**: Missing or invalid API keys
- **Solution**:
  - Verify API keys are set as environment variables
  - Check provider configuration in `app-config.yaml`
  - Ensure the specified model is available for your API key

#### Tools Are Not Being Called

- **Cause**: AI provider doesn't support tool calling or model limitations
- **Solution**:
  - Ensure your AI provider supports tool calling
  - For Ollama, use larger models like `llama3.1:30b` for better results
  - Verify MCP server API keys are correctly configured
  - Check backend logs for connection errors

#### MCP Servers Not Connecting

- **Cause**: Missing dependencies or configuration issues
- **Solution**:
  - Verify all required environment variables are set
  - Check MCP server logs for connection errors
  - Ensure MCP server dependencies are installed

### Debug Endpoints

Use these endpoints for debugging:

- **Provider Status**: `/api/mcp-chat/provider/status`
- **MCP Server Status**: `/api/mcp-chat/mcp/status`
- **Available Tools**: `/api/mcp-chat/tools`

### Debug LLM discussion

Depending on your need to see what is going on at the LLM level:

- You can trace LLM calls with some external tooling acting as an OpenAI compatible gateway
- You can set the following to debug `mcp-chat`:

```
backend:
  logger:
    level: info
    overrides:
      - matchers:
          plugin: mcp-chat
        level: debug
```

> **Security note:** Debug logging includes raw LLM request and response payloads (truncated to 4 KB), which may contain user messages and tool results. Only enable in development or controlled environments.

## API Reference

### Backend Endpoints

| Endpoint                                | Method | Description                           |
| --------------------------------------- | ------ | ------------------------------------- |
| `/api/mcp-chat/chat`                    | POST   | Send chat messages                    |
| `/api/mcp-chat/provider/status`         | GET    | Get status of connected AI provider   |
| `/api/mcp-chat/mcp/status`              | GET    | Get status of connected MCP servers   |
| `/api/mcp-chat/tools`                   | GET    | List available MCP tools from servers |
| `/api/mcp-chat/conversations`           | GET    | List user's conversation history      |
| `/api/mcp-chat/conversations/:id`       | GET    | Get a specific conversation           |
| `/api/mcp-chat/conversations/:id`       | DELETE | Delete a conversation                 |
| `/api/mcp-chat/conversations/:id/star`  | PATCH  | Toggle conversation star status       |
| `/api/mcp-chat/conversations/:id/title` | PATCH  | Update conversation title             |

## Creating a Custom Provider Module

You can create your own LLM provider module using the `createLlmProviderModule` factory from the **node** package:

```typescript
import { createLlmProviderModule } from '@alithya-oss/backstage-plugin-mcp-chat-node';
import { MyProvider } from './MyProvider';

export default createLlmProviderModule({
  providerId: 'my-provider',
  defaultBaseUrl: 'https://api.myprovider.com/v1',
  providerFactory: config => new MyProvider(config),
});
```

The provider class extends `LLMProvider` (or `OpenAICompatibleBase` for OpenAI-compatible APIs) from `@alithya-oss/backstage-plugin-mcp-chat-node`:

```typescript
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

For full documentation on the provider extension API, see the [`@alithya-oss/backstage-plugin-mcp-chat-node` README](../mcp-chat-node/README.md).

### Package Exports

The backend plugin exposes a single default export (`mcpChatPlugin`). All internal services, utilities, and routes are private implementation details.

| Package     | Category        | Exports                                                                                                                |
| ----------- | --------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **common**  | Types           | `ChatMessage`, `ChatResponse`, `ProviderConfig`, `Tool`, `ToolCall`, `MCPServerConfig`, `ConversationRecord`, and more |
| **common**  | Enums           | `MCPServerType`, `VALID_ROLES`                                                                                         |
| **node**    | Base Classes    | `LLMProvider`, `OpenAICompatibleBase`                                                                                  |
| **node**    | Factory         | `createLlmProviderModule`                                                                                              |
| **node**    | Extension Point | `llmProviderExtensionPoint`, `LlmProviderExtensionPoint`                                                               |
| **node**    | Types           | `ProviderConfig` (with `logger`), `CreateLlmProviderModuleOptions`                                                     |
| **backend** | Plugin Entry    | `mcpChatPlugin` (default export)                                                                                       |

## Contributing

Please see our [Contributing Guidelines](../../CONTRIBUTING.md) for detailed information.

### Development Guidelines

- Follow the existing code style and patterns
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass before submitting

## Support and Community

- **Issues**: [Create an issue](https://github.com/alithya-oss/backstage-plugins/issues)
- **Discord**: [Join our Discord](https://discord.gg/backstage)
- **Documentation**: [Backstage Documentation](https://backstage.io/docs)
- **Community**: [Backstage Community](https://backstage.io/community)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for details about changes in each version.

## License

This plugin is licensed under the Apache 2.0 License. See [LICENSE](../../LICENSE) for details.

---

**Made with ❤️ for the Backstage Community**
