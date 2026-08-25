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

import { HttpAuthService, LoggerService } from '@backstage/backend-plugin-api';
import express from 'express';
import Router from 'express-promise-router';
import {
  ChatMessage,
  ChatStreamEvent,
  QueryResponse,
} from '@alithya-oss/backstage-plugin-mcp-chat-common';
import { MCPClientService } from '../services/MCPClientService';
import { ChatConversationStore } from '../services/ChatConversationStore';
import { SummarizationService } from '../services/SummarizationService';
import { validateChatRequest, saveChatConversation } from '../utils';

/**
 * Dependencies required for chat routes.
 */
export interface ChatRoutesDeps {
  mcpClientService: MCPClientService;
  conversationStore: ChatConversationStore;
  summarizationService: SummarizationService;
  httpAuth: HttpAuthService;
  logger: LoggerService;
}

/**
 * Builds the conversation to persist: the caller's turns plus the assistant's
 * reply, carrying the tool calls it requested.
 */
function withAssistantTurn(
  messages: ChatMessage[],
  result: QueryResponse,
): ChatMessage[] {
  return [
    ...messages,
    {
      role: 'assistant' as const,
      content: result.reply,
      tool_calls: result.toolCalls.length > 0 ? result.toolCalls : undefined,
    },
  ];
}

/**
 * Names of the tools a run invoked.
 */
function toolNamesOf(result: QueryResponse): string[] {
  return result.toolCalls.length > 0
    ? result.toolCalls.map(call => call.function.name)
    : [];
}

/**
 * Creates Express router for chat endpoints.
 * Provides POST /chat endpoint for sending messages to the LLM, and
 * POST /chat/stream for the same run delivered as server-sent events.
 *
 * @param deps - Route dependencies
 * @returns Express router
 */
export function createChatRoutes(deps: ChatRoutesDeps): express.Router {
  const {
    mcpClientService,
    conversationStore,
    summarizationService,
    httpAuth,
    logger,
  } = deps;
  const router = Router();

  /**
   * POST /chat
   * Process a chat message through the LLM with optional tool usage.
   */
  router.post('/', async (req, res) => {
    const { messages, enabledTools, conversationId } = validateChatRequest(
      req.body,
      logger,
    );

    const { reply, toolCalls, toolResponses } =
      await mcpClientService.processQuery(messages, enabledTools);

    const result: QueryResponse = { reply, toolCalls, toolResponses };
    const toolsUsed = toolNamesOf(result);

    // Save conversation for authenticated non-guest users
    const savedConversationId = await saveChatConversation({
      req,
      conversationMessages: withAssistantTurn(messages, result),
      toolsUsed,
      conversationId,
      conversationStore,
      summarizationService,
      httpAuth,
      logger,
    });

    return res.json({
      role: 'assistant',
      content: reply,
      toolResponses: toolCalls.length > 0 ? toolResponses : [],
      toolsUsed,
      conversationId: savedConversationId,
    });
  });

  /**
   * POST /chat/stream
   * Same run as POST /chat, delivered as server-sent events: a text event per
   * reply fragment, a tool-call event before each MCP invocation and a
   * tool-result event after it, then exactly one terminal event.
   *
   * The body is validated exactly as POST /chat validates it, before any stream
   * is opened, so an invalid request still gets a normal JSON error response.
   */
  router.post('/stream', async (req, res) => {
    // Validate before opening the stream: once headers are sent, an error can
    // only be reported as a terminal event, never as a status code.
    const { messages, enabledTools, conversationId } = validateChatRequest(
      req.body,
      logger,
    );

    // Client disconnect abandons the provider request and stops the tool loop.
    const controller = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) {
        controller.abort();
      }
    });

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    // no-transform and X-Accel-Buffering keep proxies from buffering the stream
    // and defeating incremental delivery.
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const send = (event: ChatStreamEvent) => {
      if (res.writableEnded) {
        return;
      }
      // The event's discriminant doubles as the SSE event name; the data frame
      // carries the whole payload so a client can read either.
      res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
    };

    let result: QueryResponse | undefined;
    try {
      for await (const event of mcpClientService.streamQuery(
        messages,
        enabledTools,
        { signal: controller.signal },
      )) {
        if (event.type === 'result') {
          result = event.result;
          break;
        }
        send(event);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Streamed chat run failed: ${message}`);
      // Fragments already sent are not retracted — the failure event just
      // terminates the stream.
      if (!controller.signal.aborted) {
        send({ type: 'error', message });
      }
      res.end();
      return;
    }

    // A cancelled run reaches no terminal chunk: nothing is persisted, and the
    // stream is simply released.
    if (controller.signal.aborted || !result) {
      logger.debug('Streamed chat run cancelled before completion');
      res.end();
      return;
    }

    const savedConversationId = await saveChatConversation({
      req,
      conversationMessages: withAssistantTurn(messages, result),
      toolsUsed: toolNamesOf(result),
      conversationId,
      conversationStore,
      summarizationService,
      httpAuth,
      logger,
    });

    send({
      type: 'complete',
      conversationId: savedConversationId,
      toolsUsed: toolNamesOf(result),
    });
    res.end();
  });

  return router;
}
