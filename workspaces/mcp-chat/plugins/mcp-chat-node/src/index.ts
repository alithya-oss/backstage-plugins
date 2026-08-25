/*
 * Copyright 2026 The Alithya Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Node.js library for the mcp-chat plugin.
 *
 * @packageDocumentation
 */

export {
  llmProviderExtensionPoint,
  type LlmProviderExtensionPoint,
} from './extensions';

export { LLMProvider } from './LLMProvider';

export { OpenAICompatibleBase } from './OpenAICompatibleBase';

export {
  createLlmProviderModule,
  type CreateLlmProviderModuleOptions,
} from './createLlmProviderModule';

export type { ProviderConfig } from './types';

export type {
  LLMStreamTextChunk,
  LLMStreamResponseChunk,
  LLMStreamChunk,
  LLMStreamOptions,
} from './types';

// Re-exports from common package (via types.ts)
export type {
  CommonProviderConfig,
  ProviderInfo,
  ProviderConnectionStatus,
  ProviderStatusData,
  MCPServerConfig,
  MCPServerSecrets,
  MCPServerFullConfig,
  MCPServer,
  MCPServerStatusData,
  ChatMessage,
  ChatResponse,
  QueryResponse,
  Tool,
  ToolCall,
  ServerTool,
  ToolExecutionResult,
  MessageValidationResult,
  ConversationRecord,
  ConversationRow,
  ResponsesApiMcpTool,
  ResponsesApiMcpCall,
  ResponsesApiMessage,
  ResponsesApiResponse,
  ResponsesApiOutputEvent,
} from './types';

export { MCPServerType, VALID_ROLES } from './types';
