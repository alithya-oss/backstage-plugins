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
  type Tool,
} from '@alithya-oss/backstage-plugin-mcp-chat-node';

/**
 * OpenAI Chat Completions API provider.
 *
 * Extends the shared OpenAI-compatible base with vendor-specific request
 * formatting for o-series and gpt-5 models that require
 * `max_completion_tokens` instead of `max_tokens`.
 *
 * @public
 */
export class OpenAIProvider extends OpenAICompatibleBase {
  protected get providerName(): string {
    return 'OpenAI';
  }

  protected formatRequest(messages: ChatMessage[], tools?: Tool[]): unknown {
    const maxTokens = this.maxTokens ?? 1000;
    const useMaxCompletionTokens = /^(o[0-9]|gpt-5)/.test(this.model);

    const request: Record<string, unknown> = {
      model: this.model,
      messages,
      ...(useMaxCompletionTokens
        ? { max_completion_tokens: maxTokens }
        : { max_tokens: maxTokens }),
    };

    // O-series and GPT-5 models do not support the temperature parameter
    if (!useMaxCompletionTokens) {
      request.temperature = this.temperature ?? 0.7;
    }

    if (tools && tools.length > 0) {
      request.tools = tools;
    }

    return request;
  }
}
