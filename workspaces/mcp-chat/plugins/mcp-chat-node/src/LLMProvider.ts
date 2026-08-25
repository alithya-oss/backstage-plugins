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
import { ResponseError } from '@backstage/errors';
import {
  ChatMessage,
  Tool,
  ChatResponse,
  ProviderConfig,
  MCPServerFullConfig,
  LLMStreamChunk,
  LLMStreamOptions,
} from './types';

/**
 * Abstract base class for LLM provider implementations.
 *
 * Owns the `fetch` interaction pattern and accepts a `LoggerService` instance
 * for structured diagnostic output. Provider modules extend this class to
 * implement vendor-specific request formatting and response parsing.
 *
 * @public
 */
export abstract class LLMProvider {
  protected apiKey?: string;
  protected baseUrl: string;
  protected model: string;
  protected type: string;
  protected logger?: LoggerService;
  protected maxTokens?: number;
  protected temperature?: number;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.model = config.model;
    this.type = config.type;
    this.logger = config.logger;
    this.maxTokens = config.maxTokens;
    this.temperature = config.temperature;
  }

  getType(): string {
    return this.type;
  }

  getModel(): string {
    return this.model;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  abstract sendMessage(
    messages: ChatMessage[],
    tools?: Tool[],
  ): Promise<ChatResponse>;

  abstract testConnection(): Promise<{
    connected: boolean;
    models?: string[];
    error?: string;
  }>;

  protected abstract getHeaders(): Record<string, string>;

  protected abstract formatRequest(
    messages: ChatMessage[],
    tools?: Tool[],
  ): any;

  protected abstract parseResponse(response: any): ChatResponse;

  supportsNativeMcp(): boolean {
    return false;
  }

  /**
   * Whether this provider produces incremental output.
   *
   * `false` on the base class, because the default `streamMessage` delivers the
   * whole reply as a single fragment. A provider that streams natively
   * overrides this method together with `streamMessage`.
   *
   * Surfaced on provider status so a client can tell genuine streaming from the
   * single-fragment fallback.
   */
  supportsStreaming(): boolean {
    return false;
  }

  /**
   * Streams a reply as a sequence of chunks: zero or more text fragments in
   * reply order, then exactly one `response` chunk carrying the complete
   * response including any tool calls the provider requested.
   *
   * This method is deliberately concrete, not abstract: the default
   * implementation awaits `sendMessage` and emits its reply as a single
   * fragment, so every provider is streamable without implementing anything.
   * Overriding it — together with `supportsStreaming()` — is what turns on
   * genuine incremental output.
   */
  async *streamMessage(
    messages: ChatMessage[],
    tools?: Tool[],
    options?: LLMStreamOptions,
  ): AsyncGenerator<LLMStreamChunk, void, undefined> {
    const response = await this.sendMessage(messages, tools);

    if (options?.signal?.aborted) {
      return;
    }

    const content = response.choices[0]?.message?.content;
    if (content) {
      yield { type: 'text', text: content };
    }

    yield { type: 'response', response };
  }

  setMcpServerConfigs(_configs: MCPServerFullConfig[]): void {
    /* no-op by default */
  }

  getLastResponseOutput(): any {
    return null;
  }

  protected truncateForLogging(data: string, maxLength = 4096): string {
    if (data.length <= maxLength) return data;
    const truncated = data.length - maxLength;
    return `${data.slice(0, maxLength)}... [truncated ${truncated} chars]`;
  }

  protected async makeRequest(endpoint: string, body: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    this.logger?.debug(`[${this.type}] Request to ${url}`, {
      body: this.truncateForLogging(JSON.stringify(body)),
    });

    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    const duration = Date.now() - startTime;

    if (!response.ok) {
      this.logger?.error(
        `[${this.type}] Request failed (${response.status}) after ${duration}ms`,
      );
      throw await ResponseError.fromResponse(response);
    }

    const responseData = await response.json();
    this.logger?.debug(`[${this.type}] Response received in ${duration}ms`, {
      data: this.truncateForLogging(JSON.stringify(responseData)),
    });

    const finishReason = responseData.choices?.[0]?.finish_reason;
    if (finishReason === 'length' || finishReason === 'max_tokens') {
      this.logger?.warn(
        `[${this.type}] Response was truncated due to token limit (finish_reason: ${finishReason}). Consider increasing max_tokens in your provider configuration.`,
      );
    }

    return responseData;
  }
}
