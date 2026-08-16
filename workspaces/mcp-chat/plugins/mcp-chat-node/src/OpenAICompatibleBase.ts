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

import { LLMProvider } from './LLMProvider';
import type { ChatMessage, Tool, ChatResponse } from './types';

/**
 * Shared base for providers exposing an OpenAI-compatible HTTP API.
 * Overridable members allow vendor-specific customization.
 *
 * @public
 */
export abstract class OpenAICompatibleBase extends LLMProvider {
  /** Human-readable name shown in logs and errors. Override per vendor. */
  protected abstract get providerName(): string;

  async sendMessage(
    messages: ChatMessage[],
    tools?: Tool[],
  ): Promise<ChatResponse> {
    const body = this.formatRequest(messages, tools);
    const response = await this.makeRequest('/chat/completions', body);
    return this.parseResponse(response);
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
        return {
          connected: false,
          error: this.mapConnectionError(
            response.status,
            await response.text(),
          ),
        };
      }

      const data = await response.json();
      return {
        connected: true,
        models: data.data?.map((m: any) => m.id) ?? [],
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /** Override to add vendor-specific headers. */
  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  /** Override to customize the request body shape. */
  protected formatRequest(messages: ChatMessage[], tools?: Tool[]): unknown {
    const maxTokens = this.maxTokens ?? 1000;
    const request: Record<string, unknown> = {
      model: this.model,
      messages,
      max_tokens: maxTokens,
      temperature: this.temperature ?? 0.7,
    };
    if (tools && tools.length > 0) {
      request.tools = tools;
    }
    return request;
  }

  /** Override to transform the raw response before returning. */
  protected parseResponse(response: unknown): ChatResponse {
    return response as ChatResponse;
  }

  /**
   * Maps HTTP status codes to user-friendly connection error messages.
   * 401 - Invalid API key
   * 403 - Access forbidden
   * 404 - Endpoint not found
   * 429 - Rate limit exceeded
   */
  private mapConnectionError(status: number, body: string): string {
    switch (status) {
      case 401:
        return `Invalid API key. Please check your ${this.providerName} API key configuration.`;
      case 403:
        return 'Access forbidden. Please check your API key permissions.';
      case 404:
        return `${this.providerName} endpoint not found at ${this.baseUrl}/models.`;
      case 429:
        return `Rate limit exceeded. Please try again later or check your ${this.providerName} usage limits.`;
      default: {
        try {
          const data = JSON.parse(body);
          return data.error?.message ?? body.substring(0, 100);
        } catch {
          return body.length > 100 ? `${body.substring(0, 100)}...` : body;
        }
      }
    }
  }
}
