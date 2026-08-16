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
  type ProviderConfig,
  type ChatMessage,
  type Tool,
} from '@alithya-oss/backstage-plugin-mcp-chat-node';

/**
 * Azure OpenAI Chat Completions API provider.
 *
 * Overrides getHeaders to use the `api-key` header format required by
 * Azure OpenAI, and formatRequest to route requests through the
 * configured deployment name.
 *
 * @public
 */
export class AzureOpenAIProvider extends OpenAICompatibleBase {
  private readonly deploymentName: string;

  protected get providerName(): string {
    return 'Azure OpenAI';
  }

  constructor(config: ProviderConfig) {
    super(config);
    if (!config.deploymentName) {
      throw new Error(
        'Deployment name is required for the azure-openai provider.',
      );
    }
    this.deploymentName = config.deploymentName;
  }

  async testConnection(): Promise<{
    connected: boolean;
    models?: string[];
    error?: string;
  }> {
    const result = await super.testConnection();

    if (result.models) {
      const hasConfiguredModel = result.models.some(
        model => model === this.model,
      );
      if (!hasConfiguredModel) {
        this.logger?.warn(
          `[${this.type}] Configured model "${this.model}" was not found in the available models.`,
        );
      } else {
        result.models = result.models.filter(model => model === this.model);
      }
    }
    return result;
  }

  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['api-key'] = this.apiKey;
    }

    return headers;
  }

  protected formatRequest(messages: ChatMessage[], tools?: Tool[]): unknown {
    const maxTokens = this.maxTokens ?? 1000;
    const useMaxCompletionTokens = /^(o[0-9]|gpt-5)/.test(this.model);

    const request: Record<string, unknown> = {
      model: this.deploymentName,
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
