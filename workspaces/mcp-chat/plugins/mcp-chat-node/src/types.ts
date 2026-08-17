/*
 * Copyright 2025 The Alithya Authors
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

import { LoggerService } from '@backstage/backend-plugin-api';
import { ProviderConfig as CommonProviderConfig } from '@alithya-oss/backstage-plugin-mcp-chat-common';

// =============================================================================
// Extended Provider Configuration (Node-only)
// =============================================================================

/**
 * Extended provider configuration for use within backend/node contexts.
 * Adds the `logger` field that is only available in Node.js environments.
 *
 * @public
 */
export interface ProviderConfig extends CommonProviderConfig {
  /** Logger instance for diagnostic output */
  logger: LoggerService;
}

// =============================================================================
// Re-exports from Common Package
// =============================================================================

// Provider types
export type { ProviderConfig as CommonProviderConfig } from '@alithya-oss/backstage-plugin-mcp-chat-common';

export type {
  ProviderInfo,
  ProviderConnectionStatus,
  ProviderStatusData,
} from '@alithya-oss/backstage-plugin-mcp-chat-common';

// MCP Server types
export type {
  MCPServerConfig,
  MCPServerSecrets,
  MCPServerFullConfig,
  MCPServer,
  MCPServerStatusData,
} from '@alithya-oss/backstage-plugin-mcp-chat-common';

// Chat types
export type {
  ChatMessage,
  ChatResponse,
  QueryResponse,
} from '@alithya-oss/backstage-plugin-mcp-chat-common';

// Tool types
export type {
  Tool,
  ToolCall,
  ServerTool,
  ToolExecutionResult,
} from '@alithya-oss/backstage-plugin-mcp-chat-common';

// Validation types
export type { MessageValidationResult } from '@alithya-oss/backstage-plugin-mcp-chat-common';

// Conversation types
export type {
  ConversationRecord,
  ConversationRow,
} from '@alithya-oss/backstage-plugin-mcp-chat-common';

// Enums and Constants
export {
  MCPServerType,
  VALID_ROLES,
} from '@alithya-oss/backstage-plugin-mcp-chat-common';

// OpenAI Responses API types
export type {
  ResponsesApiMcpTool,
  ResponsesApiMcpCall,
  ResponsesApiMessage,
  ResponsesApiResponse,
  ResponsesApiOutputEvent,
} from '@alithya-oss/backstage-plugin-mcp-chat-common';
