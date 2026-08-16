/*
 * Copyright 2025 The Alithya Authors
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
import type { ChatMessage, ChatResponse, Tool, ProviderConfig } from './types';

/**
 * Concrete test subclass that exposes `makeRequest` for testing.
 */
class TestLLMProvider extends LLMProvider {
  async sendMessage(
    _messages: ChatMessage[],
    _tools?: Tool[],
  ): Promise<ChatResponse> {
    return {
      choices: [{ message: { role: 'assistant', content: '' } }],
    };
  }

  async testConnection(): Promise<{
    connected: boolean;
    models?: string[];
    error?: string;
  }> {
    return { connected: true };
  }

  protected getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  protected formatRequest(messages: ChatMessage[], _tools?: Tool[]): any {
    return { messages };
  }

  protected parseResponse(response: any): ChatResponse {
    return response;
  }

  /** Expose protected makeRequest for testing */
  public exposedMakeRequest(endpoint: string, body: any): Promise<any> {
    return this.makeRequest(endpoint, body);
  }
}

function createMockLogger() {
  return {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    child: jest.fn().mockReturnThis(),
  } as any;
}

function createProvider(config: Partial<ProviderConfig> = {}): TestLLMProvider {
  const defaults: ProviderConfig = {
    type: 'test',
    baseUrl: 'http://localhost:8080',
    model: 'test-model',
    apiKey: 'test-key',
    logger: createMockLogger(),
    ...config,
  };
  return new TestLLMProvider(defaults);
}

describe('LLMProvider', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('makeRequest - error responses', () => {
    it('throws a ResponseError on HTTP 400', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ error: { message: 'Invalid request body' } }),
        text: async () =>
          JSON.stringify({ error: { message: 'Invalid request body' } }),
      });

      const provider = createProvider();

      const promise = provider.exposedMakeRequest('/v1/chat/completions', {
        messages: [],
      });

      await expect(promise).rejects.toMatchObject({
        name: 'ResponseError',
        response: expect.objectContaining({ status: 400 }),
      });
    });

    it('throws a ResponseError on HTTP 401', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ error: { message: 'Invalid API key' } }),
        text: async () =>
          JSON.stringify({ error: { message: 'Invalid API key' } }),
      });

      const provider = createProvider();

      const promise = provider.exposedMakeRequest('/v1/chat/completions', {
        messages: [],
      });

      await expect(promise).rejects.toMatchObject({
        name: 'ResponseError',
        response: expect.objectContaining({ status: 401 }),
      });
    });

    it('throws a ResponseError on HTTP 500', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ error: { message: 'Internal server error' } }),
        text: async () =>
          JSON.stringify({ error: { message: 'Internal server error' } }),
      });

      const provider = createProvider();

      const promise = provider.exposedMakeRequest('/v1/chat/completions', {
        messages: [],
      });

      await expect(promise).rejects.toMatchObject({
        name: 'ResponseError',
        response: expect.objectContaining({ status: 500 }),
      });
    });

    it('logs an error message when a non-OK response is received', async () => {
      const logger = createMockLogger();
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ error: { message: 'Rate limited' } }),
        text: async () =>
          JSON.stringify({ error: { message: 'Rate limited' } }),
      });

      const provider = createProvider({ logger });

      await expect(
        provider.exposedMakeRequest('/v1/chat/completions', {}),
      ).rejects.toMatchObject({ name: 'ResponseError' });

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Request failed (429)'),
      );
    });
  });

  describe('makeRequest - success responses', () => {
    it('returns parsed JSON on HTTP 200', async () => {
      const mockResponseData = {
        choices: [
          {
            message: { role: 'assistant', content: 'Hello!' },
            finish_reason: 'stop',
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => mockResponseData,
      });

      const provider = createProvider();
      const result = await provider.exposedMakeRequest('/v1/chat/completions', {
        messages: [{ role: 'user', content: 'hi' }],
      });

      expect(result).toEqual(mockResponseData);
    });

    it('logs a warning when finish_reason is "length"', async () => {
      const logger = createMockLogger();
      const mockResponseData = {
        choices: [
          {
            message: { role: 'assistant', content: 'Truncated...' },
            finish_reason: 'length',
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => mockResponseData,
      });

      const provider = createProvider({ logger });
      await provider.exposedMakeRequest('/v1/chat/completions', {
        messages: [],
      });

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Response was truncated due to token limit (finish_reason: length)',
        ),
      );
    });

    it('logs a warning when finish_reason is "max_tokens"', async () => {
      const logger = createMockLogger();
      const mockResponseData = {
        choices: [
          {
            message: { role: 'assistant', content: 'Truncated...' },
            finish_reason: 'max_tokens',
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => mockResponseData,
      });

      const provider = createProvider({ logger });
      await provider.exposedMakeRequest('/v1/chat/completions', {
        messages: [],
      });

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Response was truncated due to token limit (finish_reason: max_tokens)',
        ),
      );
    });

    it('constructs the correct URL from baseUrl and endpoint', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ choices: [] }),
      });

      const provider = createProvider({
        baseUrl: 'http://my-server:3000/api',
      });
      await provider.exposedMakeRequest('/v1/completions', { prompt: 'test' });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://my-server:3000/api/v1/completions',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('sends headers from getHeaders() in the request', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ choices: [] }),
      });

      const provider = createProvider({ apiKey: 'my-secret-key' });
      await provider.exposedMakeRequest('/v1/completions', {});

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-secret-key',
            'Content-Type': 'application/json',
          }),
        }),
      );
    });
  });
});
