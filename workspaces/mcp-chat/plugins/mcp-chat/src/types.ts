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

import type {
  MCPServer as CommonMCPServer,
  ProviderInfo,
  ServerTool,
} from '@alithya-oss/backstage-plugin-mcp-chat-common';

// Re-export the enum directly from common
export { MCPServerType } from '@alithya-oss/backstage-plugin-mcp-chat-common';

// Re-export types that are used as-is (no view-model extension needed)
export type { ProviderConnectionStatus } from '@alithya-oss/backstage-plugin-mcp-chat-common';

// Re-export the streaming wire contract so the frontend reads the very types
// the backend writes, and the two cannot drift.
export type {
  ChatStreamEvent,
  ChatStreamTextEvent,
  ChatStreamToolCallEvent,
  ChatStreamToolResultEvent,
  ChatStreamCompleteEvent,
  ChatStreamErrorEvent,
  ChatStreamTerminalEvent,
} from '@alithya-oss/backstage-plugin-mcp-chat-common';

/**
 * Frontend view of provider status data.
 * Extends the common ProviderInfo type by aliasing it as `Provider`.
 * @public
 */
export interface ProviderStatusData {
  providers: Provider[];
  summary: {
    totalProviders: number;
    healthyProviders: number;
    error?: string;
  };
  timestamp: string;
}

/**
 * Frontend provider view — same shape as ProviderInfo from common.
 * @public
 */
export type Provider = ProviderInfo;

/**
 * Aggregated MCP server status data for the frontend.
 * @public
 */
export interface MCPServerStatusData {
  total: number;
  valid: number;
  active: number;
  servers: MCPServer[];
  timestamp: string;
}

/**
 * Frontend view of an MCP server, extending the common type with a
 * view-model `enabled` field for UI toggle state.
 * @public
 */
export interface MCPServer extends CommonMCPServer {
  /** Whether the server is enabled in the UI (view-model field) */
  enabled: boolean;
}

/**
 * Frontend view of a tool, extending the common ServerTool type.
 * The `type` field is widened to `string` for compatibility with
 * various tool type values the backend may return.
 * @public
 */
export interface Tool extends Omit<ServerTool, 'type'> {
  type: string;
}

/**
 * Response from the /tools endpoint.
 * @public
 */
export interface ToolsResponse {
  message: string;
  serverConfigs: Array<{
    name: string;
    type: string;
    hasUrl: boolean;
    hasNpxCommand: boolean;
    hasScriptPath: boolean;
  }>;
  availableTools: Tool[];
  toolCount: number;
  timestamp: string;
}

/**
 * A simplified chat message for the frontend view.
 * The frontend only displays user and assistant messages.
 * @public
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Response from the /chat endpoint.
 * @public
 */
export interface ChatResponse {
  role: 'assistant';
  content: string;
  toolResponses?: any[];
  toolsUsed?: string[];
  conversationId?: string;
}

/**
 * A stored conversation record from the backend.
 * The frontend uses string dates (ISO format from JSON serialization).
 * @public
 */
export interface ConversationRecord {
  /** Unique identifier for the conversation */
  id: string;
  /** User entity ref who owns this conversation */
  userId: string;
  /** Array of chat messages in the conversation */
  messages: ChatMessage[];
  /** Optional array of tool names used in the conversation */
  toolsUsed?: string[];
  /** AI-generated or user-edited conversation title */
  title?: string;
  /** Whether the conversation is starred/favorited */
  isStarred: boolean;
  /** ISO timestamp when the conversation was created */
  createdAt: string;
  /** ISO timestamp when the conversation was last updated */
  updatedAt: string;
}

/**
 * Response from the /conversations endpoint.
 * @public
 */
export interface ConversationsResponse {
  /** Array of conversation records */
  conversations: ConversationRecord[];
  /** Total count of conversations returned */
  count: number;
}
