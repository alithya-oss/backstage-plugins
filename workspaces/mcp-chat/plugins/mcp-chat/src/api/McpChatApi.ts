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

import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { ResponseError } from '@backstage/errors';
import {
  ChatMessage,
  ChatResponse,
  ChatStreamEvent,
  ConversationRecord,
  ConversationsResponse,
  MCPServerStatusData,
  ProviderStatusData,
  ToolsResponse,
} from '../types';

/**
 * Reads one server-sent event frame.
 *
 * The `type` discriminant of the payload doubles as the SSE event name, so only
 * the `data` lines are read — a frame carrying no data (a comment or a
 * keep-alive) and a frame whose data is not valid JSON are both skipped rather
 * than failing the run.
 */
function parseSseFrame(frame: string): ChatStreamEvent | undefined {
  const data = frame
    .split('\n')
    .filter(line => line.startsWith('data:'))
    .map(line => line.slice('data:'.length).trimStart())
    .join('\n');

  if (!data) {
    return undefined;
  }

  try {
    return JSON.parse(data) as ChatStreamEvent;
  } catch {
    return undefined;
  }
}

/**
 * @public
 */
export interface McpChatApi {
  sendChatMessage(
    messages: ChatMessage[],
    enabledTools?: string[],
    signal?: AbortSignal,
    conversationId?: string,
  ): Promise<ChatResponse>;
  /**
   * Runs the same query as {@link McpChatApi.sendChatMessage}, yielding the
   * run's events as they arrive instead of one complete reply.
   *
   * The iteration ends after the single terminal event — `complete` or `error`.
   * It also ends without one when the run is cancelled through `signal`, which
   * is how a caller tells a cancelled run from a finished one. A failure that
   * prevents the stream from opening at all is thrown rather than yielded, so a
   * caller can distinguish an unreachable backend from a provider failure the
   * stream reports.
   */
  streamChatMessage(
    messages: ChatMessage[],
    enabledTools?: string[],
    signal?: AbortSignal,
    conversationId?: string,
  ): AsyncIterable<ChatStreamEvent>;
  getMCPServerStatus(): Promise<MCPServerStatusData>;
  getAvailableTools(): Promise<ToolsResponse>;
  getProviderStatus(): Promise<ProviderStatusData>;
  getConversations(): Promise<ConversationsResponse>;
  getConversationById(id: string): Promise<ConversationRecord>;
  deleteConversation(id: string): Promise<void>;
  toggleConversationStar(id: string): Promise<{ isStarred: boolean }>;
}

export class McpChat implements McpChatApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  constructor(options: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  async sendChatMessage(
    messages: ChatMessage[],
    enabledTools: string[] = [],
    signal?: AbortSignal,
    conversationId?: string,
  ): Promise<ChatResponse> {
    const baseUrl = await this.discoveryApi.getBaseUrl('mcp-chat');

    const response = await this.fetchApi.fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        enabledTools,
        conversationId,
      }),
      signal,
    });

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    return response.json();
  }

  /**
   * Runs the same query as {@link McpChat.sendChatMessage} against
   * `POST /chat/stream`, yielding each server-sent event as it arrives.
   *
   * A non-OK status is thrown before any event is yielded, because the backend
   * validates the body before it opens the stream. Once the stream is open the
   * run's own failure arrives as a terminal `error` event instead — that split
   * is what lets a caller tell an unreachable backend from a provider failure.
   */
  async *streamChatMessage(
    messages: ChatMessage[],
    enabledTools: string[] = [],
    signal?: AbortSignal,
    conversationId?: string,
  ): AsyncGenerator<ChatStreamEvent, void, undefined> {
    const baseUrl = await this.discoveryApi.getBaseUrl('mcp-chat');

    const response = await this.fetchApi.fetch(`${baseUrl}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        messages,
        enabledTools,
        conversationId,
      }),
      signal,
    });

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    if (!response.body) {
      throw new Error('The chat stream response carried no body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      let done = false;
      while (!done) {
        const chunk = await reader.read();
        done = chunk.done;

        if (chunk.value) {
          buffer += decoder.decode(chunk.value, { stream: true });
        }

        // A blank line ends a frame. Chunk boundaries fall anywhere, so frames
        // are drained from the buffer rather than read from the chunk.
        let boundary = buffer.indexOf('\n\n');
        while (boundary !== -1) {
          const event = parseSseFrame(buffer.slice(0, boundary));
          buffer = buffer.slice(boundary + 2);
          if (event) {
            yield event;
          }
          boundary = buffer.indexOf('\n\n');
        }
      }

      // A last frame the server did not terminate with a blank line.
      const trailing = parseSseFrame(buffer + decoder.decode());
      if (trailing) {
        yield trailing;
      }
    } finally {
      // Releasing the reader is what closes the connection when the caller
      // stops iterating early — on cancellation, or on a `break`.
      await reader.cancel().catch(() => undefined);
    }
  }

  async getMCPServerStatus(): Promise<MCPServerStatusData> {
    const baseUrl = await this.discoveryApi.getBaseUrl('mcp-chat');
    const response = await this.fetchApi.fetch(`${baseUrl}/mcp/status`);
    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }
    return response.json();
  }

  async getAvailableTools(): Promise<ToolsResponse> {
    const baseUrl = await this.discoveryApi.getBaseUrl('mcp-chat');

    const response = await this.fetchApi.fetch(`${baseUrl}/tools`);

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    return response.json();
  }

  async getProviderStatus(): Promise<ProviderStatusData> {
    const baseUrl = await this.discoveryApi.getBaseUrl('mcp-chat');

    const response = await this.fetchApi.fetch(`${baseUrl}/provider/status`);

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    return response.json();
  }

  async getConversations(): Promise<ConversationsResponse> {
    const baseUrl = await this.discoveryApi.getBaseUrl('mcp-chat');

    const response = await this.fetchApi.fetch(`${baseUrl}/conversations`);

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    return response.json();
  }

  async getConversationById(id: string): Promise<ConversationRecord> {
    const baseUrl = await this.discoveryApi.getBaseUrl('mcp-chat');

    const response = await this.fetchApi.fetch(
      `${baseUrl}/conversations/${id}`,
    );

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    return response.json();
  }

  async deleteConversation(id: string): Promise<void> {
    const baseUrl = await this.discoveryApi.getBaseUrl('mcp-chat');

    const response = await this.fetchApi.fetch(
      `${baseUrl}/conversations/${id}`,
      { method: 'DELETE' },
    );

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }
  }

  async toggleConversationStar(id: string): Promise<{ isStarred: boolean }> {
    const baseUrl = await this.discoveryApi.getBaseUrl('mcp-chat');

    const response = await this.fetchApi.fetch(
      `${baseUrl}/conversations/${id}/star`,
      { method: 'PATCH' },
    );

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    return response.json();
  }
}
