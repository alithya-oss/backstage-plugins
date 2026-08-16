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

import { LoggerService } from '@backstage/backend-plugin-api';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { executeToolCall } from '../utils';
import { LLMProvider } from '@alithya-oss/backstage-plugin-mcp-chat-node';
import {
  ChatMessage,
  Tool,
  MCPServerFullConfig,
  QueryResponse,
  ServerTool,
  ResponsesApiMcpCall,
} from '@alithya-oss/backstage-plugin-mcp-chat-common';

/**
 * Options for creating a QueryProcessor instance.
 *
 * @public
 */
export interface QueryProcessorOptions {
  logger: LoggerService;
  llmProvider: LLMProvider;
  systemPrompt: string;
  toolCallTimeout: number;
  getTools: () => ServerTool[];
  getMcpClients: () => Map<string, Client>;
  getServerConfigs: () => MCPServerFullConfig[];
}

/**
 * Processes chat queries through the LLM provider, handling tool calls
 * and Responses API interactions.
 *
 * @public
 */
export class QueryProcessor {
  private readonly logger: LoggerService;
  private readonly llmProvider: LLMProvider;
  private readonly systemPrompt: string;
  private readonly toolCallTimeout: number;
  private readonly getTools: () => ServerTool[];
  private readonly getMcpClients: () => Map<string, Client>;
  private readonly getServerConfigs: () => MCPServerFullConfig[];

  constructor(options: QueryProcessorOptions) {
    this.logger = options.logger;
    this.llmProvider = options.llmProvider;
    this.systemPrompt = options.systemPrompt;
    this.toolCallTimeout = options.toolCallTimeout;
    this.getTools = options.getTools;
    this.getMcpClients = options.getMcpClients;
    this.getServerConfigs = options.getServerConfigs;
  }

  async processQuery(
    messagesInput: any[],
    enabledTools?: string[],
  ): Promise<QueryResponse> {
    const messages: ChatMessage[] = [...messagesInput];
    if (messages.length === 0 || messages[0].role !== 'system') {
      messages.unshift({
        role: 'system',
        content: this.systemPrompt,
      });
    }

    if (this.llmProvider.supportsNativeMcp()) {
      return this.processQueryWithResponsesApi(messages, enabledTools);
    }

    const tools = this.getTools();

    // Filter tools based on enabled servers
    const filteredTools =
      enabledTools !== undefined && enabledTools !== null
        ? tools.filter(tool => enabledTools.includes(tool.serverId))
        : tools;

    // Remove serverId from tools when sending to LLM
    const llmTools: Tool[] = filteredTools.map(({ serverId, ...tool }) => tool);

    const response = await this.llmProvider.sendMessage(messages, llmTools);
    const replyMessage = response.choices[0].message;
    this.logger.info(
      `LLM response received with ${
        replyMessage.tool_calls?.length || 0
      } tool calls`,
    );
    const toolCalls = replyMessage.tool_calls || [];

    if (toolCalls.length > 0) {
      const toolResponses = [];

      for (const toolCall of toolCalls) {
        try {
          const toolResponse = await executeToolCall(
            toolCall,
            tools,
            this.getMcpClients(),
            this.toolCallTimeout,
          );
          toolResponses.push(toolResponse);

          messages.push({
            role: 'assistant',
            content: null,
            tool_calls: [toolCall],
          });

          messages.push({
            role: 'tool',
            content: toolResponse.result,
            tool_call_id: toolCall.id,
          });
        } catch (error) {
          const errorMessage = `Error executing tool '${
            toolCall.function.name
          }': ${error instanceof Error ? error.message : error}`;

          this.logger.warn(errorMessage);

          const errorResponse = {
            id: toolCall.id,
            name: toolCall.function.name,
            arguments: JSON.parse(toolCall.function.arguments || '{}'),
            result: errorMessage,
            serverId: 'error',
          };

          toolResponses.push(errorResponse);

          messages.push({
            role: 'assistant',
            content: null,
            tool_calls: [toolCall],
          });

          messages.push({
            role: 'tool',
            content: errorMessage,
            tool_call_id: toolCall.id,
          });
        }
      }

      const followUp = await this.llmProvider.sendMessage(messages);

      return {
        reply: followUp.choices[0].message.content || '',
        toolCalls,
        toolResponses,
      };
    }

    return {
      reply: replyMessage.content || '',
      toolCalls: [],
      toolResponses: [],
    };
  }

  /**
   * Process query using OpenAI Responses API.
   * The API handles tool discovery and execution internally.
   */
  private async processQueryWithResponsesApi(
    messages: ChatMessage[],
    enabledTools?: string[],
  ): Promise<QueryResponse> {
    const serverConfigs = this.getServerConfigs();

    // Filter server configs based on enabled tools
    const enabledServerConfigs =
      enabledTools !== undefined && enabledTools !== null
        ? serverConfigs.filter(config => enabledTools.includes(config.id))
        : serverConfigs;

    // Set the filtered configs on the provider
    this.llmProvider.setMcpServerConfigs(enabledServerConfigs);

    // Send message - the provider handles MCP tool configuration internally
    const response = await this.llmProvider.sendMessage(messages);
    const replyMessage = response.choices[0].message;

    // Extract tool calls and responses from the Responses API output
    const toolCalls = replyMessage.tool_calls || [];
    const toolResponses: any[] = [];

    // Get the raw output from the provider to extract tool execution details
    const output = this.llmProvider.getLastResponseOutput();
    if (output) {
      for (const event of output) {
        if (event.type === 'mcp_call') {
          const mcpCall = event as ResponsesApiMcpCall;
          toolResponses.push({
            id: mcpCall.id,
            name: mcpCall.name,
            arguments: JSON.parse(mcpCall.arguments || '{}'),
            result: mcpCall.error || mcpCall.output,
            serverId: mcpCall.server_label,
            error: mcpCall.error,
          });
        }
      }
    }

    this.logger.info(
      `Responses API completed with ${toolCalls.length} tool calls`,
    );

    return {
      reply: replyMessage.content || '',
      toolCalls,
      toolResponses,
    };
  }
}
