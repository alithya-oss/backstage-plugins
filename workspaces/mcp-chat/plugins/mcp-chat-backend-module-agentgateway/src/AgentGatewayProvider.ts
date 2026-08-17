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
  OpenAICompatibleBase,
  type ChatMessage,
  type ChatResponse,
  type Tool,
} from '@alithya-oss/backstage-plugin-mcp-chat-node';

/**
 * Agent Gateway LLM provider.
 *
 * Agent Gateway exposes an OpenAI-compatible `/chat/completions` endpoint.
 * This provider extends the shared base with tool re-attachment logic:
 * Bedrock models behind Agent Gateway require tool definitions whenever
 * the conversation contains tool-related messages.
 *
 * @public
 */
export class AgentGatewayProvider extends OpenAICompatibleBase {
  private lastTools?: Tool[];

  protected get providerName(): string {
    return 'AgentGateway';
  }

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

  protected formatRequest(messages: ChatMessage[], tools?: Tool[]): unknown {
    const request: Record<string, unknown> = {
      model: this.model,
      messages,
      max_tokens: this.maxTokens ?? 1000,
      temperature: this.temperature ?? 0.7,
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
}
