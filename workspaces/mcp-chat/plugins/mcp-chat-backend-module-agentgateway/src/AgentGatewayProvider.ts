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

import {
  LLMProvider,
  type ChatMessage,
  type Tool,
  type ChatResponse,
} from '@alithya-oss/backstage-plugin-mcp-chat-common';

/**
 * Agent Gateway LLM provider.
 *
 * Agent Gateway exposes an OpenAI-compatible `/chat/completions` endpoint,
 * so this provider reuses the same request/response format as the OpenAI
 * provider while allowing independent configuration (base URL, token, model).
 *
 * @public
 */
export class AgentGatewayProvider extends LLMProvider {
  private lastTools?: Tool[];

  async sendMessage(
    messages: ChatMessage[],
    tools?: Tool[],
  ): Promise<ChatResponse> {
    // Cache tools when provided so they can be re-attached on follow-up
    // calls. Bedrock models behind the Agent Gateway require tool
    // definitions whenever the conversation contains tool-related messages.
    if (tools && tools.length > 0) {
      this.lastTools = tools;
    }

    let effectiveTools = tools;
    if (!tools?.length && this.hasToolMessages(messages)) {
      effectiveTools = this.lastTools;
    }

    const requestBody = this.formatRequest(messages, effectiveTools);
    const response = await this.makeRequest('/chat/completions', requestBody);
    return this.parseResponse(response);
  }

  /**
   * Returns true when the conversation history contains tool-related
   * messages (assistant tool_calls or tool-role results), which means
   * Bedrock will expect a toolConfig in the request.
   */
  private hasToolMessages(messages: ChatMessage[]): boolean {
    return messages.some(
      msg =>
        msg.role === 'tool' ||
        (msg.role === 'assistant' && msg.tool_calls?.length),
    );
  }

  async testConnection(): Promise<{
    connected: boolean;
    models?: string[];
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Agent Gateway API error (${response.status})`;

        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          }
        } catch {
          errorMessage =
            errorText.length > 100
              ? `${errorText.substring(0, 100)}...`
              : errorText;
        }

        if (response.status === 401) {
          errorMessage =
            'Invalid API key. Please check your Agent Gateway API key configuration.';
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again later.';
        } else if (response.status === 403) {
          errorMessage =
            'Access forbidden. Please check your API key permissions.';
        }

        return { connected: false, error: errorMessage };
      }

      const data = await response.json();
      const models = data.data?.map((model: any) => model.id) || [];

      return { connected: true, models };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  protected formatRequest(messages: ChatMessage[], tools?: Tool[]): any {
    const request: any = {
      model: this.model,
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    };

    if (tools && tools.length > 0) {
      request.tools = tools.map(tool => ({
        ...tool,
        function: {
          ...tool.function,
          parameters: tool.function.parameters,
        },
      }));
    }

    return request;
  }

  protected parseResponse(response: any): ChatResponse {
    return response;
  }
}
