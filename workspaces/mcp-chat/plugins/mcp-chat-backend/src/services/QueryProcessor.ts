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
  ChatStreamTextEvent,
  ChatStreamToolCallEvent,
  ChatStreamToolResultEvent,
} from '@alithya-oss/backstage-plugin-mcp-chat-common';

/**
 * Terminal chunk of a streamed query, carrying the run's complete outcome so
 * the caller can persist the conversation and build the wire terminal event.
 *
 * Internal to the backend: it is not part of the server-sent event contract,
 * because only the route knows whether a conversation was stored.
 *
 * @public
 */
export interface QueryStreamResultEvent {
  /** Chunk discriminant */
  type: 'result';
  /** The run's complete reply, tool calls and tool results */
  result: QueryResponse;
}

/**
 * A chunk yielded by {@link QueryProcessor.streamQuery}.
 *
 * The first three members are the wire events the route forwards verbatim; the
 * last is the internal terminal chunk the route consumes rather than forwards.
 *
 * @public
 */
export type QueryStreamEvent =
  | ChatStreamTextEvent
  | ChatStreamToolCallEvent
  | ChatStreamToolResultEvent
  | QueryStreamResultEvent;

/**
 * Options accepted by {@link QueryProcessor.streamQuery}.
 *
 * @public
 */
export interface QueryStreamOptions {
  /**
   * Signals that the client has gone away or cancelled.
   *
   * Passed through to the provider, and checked before every MCP invocation so
   * an abandoned run starts no further tool call.
   */
  signal?: AbortSignal;
}

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

  /**
   * Returns the conversation with the configured system prompt prepended,
   * unless the caller already supplied one.
   *
   * Shared by the single-response and streaming paths so both inject the prompt
   * on identical terms.
   */
  private withSystemPrompt(messagesInput: any[]): ChatMessage[] {
    const messages: ChatMessage[] = [...messagesInput];
    if (messages.length === 0 || messages[0].role !== 'system') {
      messages.unshift({
        role: 'system',
        content: this.systemPrompt,
      });
    }
    return messages;
  }

  /**
   * Resolves the tool inventory for a run: every known tool for routing an
   * invocation to its MCP server, and the subset offered to the provider once
   * filtered by enabled server id and stripped of `serverId`.
   *
   * Shared by the single-response and streaming paths so both offer the
   * provider exactly the same tools.
   */
  private resolveTools(enabledTools?: string[]): {
    tools: ServerTool[];
    llmTools: Tool[];
  } {
    const tools = this.getTools();

    // Filter tools based on enabled servers
    const filteredTools =
      enabledTools !== undefined && enabledTools !== null
        ? tools.filter(tool => enabledTools.includes(tool.serverId))
        : tools;

    // Remove serverId from tools when sending to LLM
    const llmTools: Tool[] = filteredTools.map(({ serverId, ...tool }) => tool);

    return { tools, llmTools };
  }

  /**
   * Narrows the configured MCP servers to those the caller enabled.
   *
   * Shared by the single-response and streaming variants of the Responses API
   * path.
   */
  private resolveServerConfigs(enabledTools?: string[]): MCPServerFullConfig[] {
    const serverConfigs = this.getServerConfigs();

    return enabledTools !== undefined && enabledTools !== null
      ? serverConfigs.filter(config => enabledTools.includes(config.id))
      : serverConfigs;
  }

  async processQuery(
    messagesInput: any[],
    enabledTools?: string[],
  ): Promise<QueryResponse> {
    const messages = this.withSystemPrompt(messagesInput);

    if (this.llmProvider.supportsNativeMcp()) {
      return this.processQueryWithResponsesApi(messages, enabledTools);
    }

    const { tools, llmTools } = this.resolveTools(enabledTools);

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
   * Streams a query, surfacing the run as it happens: a text event per provider
   * fragment, a tool-call event before each MCP invocation and a tool-result
   * event after it — correlated by invocation id — then exactly one terminal
   * `result` chunk carrying the complete outcome.
   *
   * Reuses the same system-prompt injection and tool filtering as
   * {@link QueryProcessor.processQuery}, so both paths offer the provider
   * identical input.
   *
   * Concatenating the `text` of every emitted text event reproduces
   * `result.reply`, so what a client rendered is exactly what gets persisted.
   *
   * Yields nothing further once `options.signal` is aborted, and starts no
   * further tool invocation — an abandoned run therefore never reaches its
   * terminal chunk, which is what tells the caller not to persist it.
   */
  async *streamQuery(
    messagesInput: any[],
    enabledTools?: string[],
    options?: QueryStreamOptions,
  ): AsyncGenerator<QueryStreamEvent, void, undefined> {
    const signal = options?.signal;
    const messages = this.withSystemPrompt(messagesInput);

    if (this.llmProvider.supportsNativeMcp()) {
      // The Responses API runs tools internally and answers in one piece, so
      // its outcome is replayed as events rather than streamed.
      const result = await this.processQueryWithResponsesApi(
        messages,
        enabledTools,
      );
      if (signal?.aborted) return;

      for (const toolResponse of result.toolResponses) {
        yield {
          type: 'tool-call',
          id: toolResponse.id,
          name: toolResponse.name,
          arguments: toolResponse.arguments ?? {},
          serverId: toolResponse.serverId,
        };
        yield {
          type: 'tool-result',
          id: toolResponse.id,
          result: String(toolResponse.result ?? ''),
          isError: Boolean((toolResponse as { error?: unknown }).error),
        };
      }

      if (result.reply) {
        yield { type: 'text', text: result.reply };
      }
      yield { type: 'result', result };
      return;
    }

    const { tools, llmTools } = this.resolveTools(enabledTools);

    let reply = '';
    const toolResponses: QueryResponse['toolResponses'] = [];

    // First pass: stream the provider's reply, keeping the complete response so
    // the tool-calling loop can continue from the same stream.
    let response;
    for await (const chunk of this.llmProvider.streamMessage(
      messages,
      llmTools,
      { signal },
    )) {
      if (signal?.aborted) return;
      if (chunk.type === 'text') {
        reply += chunk.text;
        yield { type: 'text', text: chunk.text };
      } else {
        response = chunk.response;
      }
    }

    if (signal?.aborted) return;

    const toolCalls = response?.choices[0]?.message?.tool_calls ?? [];
    this.logger.info(`LLM stream received with ${toolCalls.length} tool calls`);

    for (const toolCall of toolCalls) {
      // Cancellation must stop the run before it starts another invocation.
      if (signal?.aborted) return;

      const toolName = toolCall.function.name;
      const args = this.parseToolArguments(toolCall.function.arguments);

      yield {
        type: 'tool-call',
        id: toolCall.id,
        name: toolName,
        arguments: args,
        serverId:
          tools.find(tool => tool.function.name === toolName)?.serverId ??
          'unknown',
      };

      try {
        const toolResponse = await executeToolCall(
          toolCall,
          tools,
          this.getMcpClients(),
          this.toolCallTimeout,
        );
        toolResponses.push(toolResponse);

        yield {
          type: 'tool-result',
          id: toolCall.id,
          result: toolResponse.result,
          isError: false,
        };

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
        // A failed or timed-out tool is reported as a failed result and the run
        // continues to its terminal chunk, matching the non-streaming path.
        const errorMessage = `Error executing tool '${toolName}': ${
          error instanceof Error ? error.message : error
        }`;

        this.logger.warn(errorMessage);

        toolResponses.push({
          id: toolCall.id,
          name: toolName,
          arguments: args,
          result: errorMessage,
          serverId: 'error',
        });

        yield {
          type: 'tool-result',
          id: toolCall.id,
          result: errorMessage,
          isError: true,
        };

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

    if (toolCalls.length > 0) {
      if (signal?.aborted) return;

      // Second pass: the reply the provider produces once it has the results.
      for await (const chunk of this.llmProvider.streamMessage(
        messages,
        undefined,
        { signal },
      )) {
        if (signal?.aborted) return;
        if (chunk.type === 'text') {
          reply += chunk.text;
          yield { type: 'text', text: chunk.text };
        }
      }

      if (signal?.aborted) return;
    }

    yield {
      type: 'result',
      result: { reply, toolCalls: [...toolCalls], toolResponses },
    };
  }

  /**
   * Parses a tool call's JSON arguments, degrading to an empty object rather
   * than throwing — malformed arguments must still produce a tool-call event so
   * the client can show the invocation that is about to fail.
   */
  private parseToolArguments(rawArguments?: string): Record<string, unknown> {
    try {
      return JSON.parse(rawArguments || '{}');
    } catch {
      return {};
    }
  }

  /**
   * Process query using OpenAI Responses API.
   * The API handles tool discovery and execution internally.
   */
  private async processQueryWithResponsesApi(
    messages: ChatMessage[],
    enabledTools?: string[],
  ): Promise<QueryResponse> {
    const enabledServerConfigs = this.resolveServerConfigs(enabledTools);

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
