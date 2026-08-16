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

import fc from 'fast-check';
import { OpenAICompatibleBase } from './OpenAICompatibleBase';
import type { ProviderConfig } from './types';
import type { ChatMessage, Tool } from './types';

/**
 * Concrete test subclass that exposes protected methods for testing.
 */
class TestOpenAICompatibleProvider extends OpenAICompatibleBase {
  protected get providerName(): string {
    return 'TestProvider';
  }

  /** Expose protected formatRequest for testing */
  public exposedFormatRequest(
    messages: ChatMessage[],
    tools?: Tool[],
  ): unknown {
    return this.formatRequest(messages, tools);
  }

  /** Expose protected getHeaders for testing */
  public exposedGetHeaders(): Record<string, string> {
    return this.getHeaders();
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

function createProvider(config: Partial<ProviderConfig> = {}) {
  const defaults: ProviderConfig = {
    type: 'test',
    baseUrl: 'http://localhost:8080',
    model: 'test-model',
    logger: createMockLogger(),
    ...config,
  };
  return new TestOpenAICompatibleProvider(defaults);
}

// Arbitraries for property generation
const arbNonEmptyString = fc.string({ minLength: 1, maxLength: 100 });
const arbModelName = fc.string({ minLength: 1, maxLength: 64 });
const arbMaxTokens = fc.integer({ min: 1, max: 100000 });
const arbTemperature = fc.double({ min: 0, max: 2, noNaN: true });
const arbRole = fc.constantFrom(
  'system' as const,
  'user' as const,
  'assistant' as const,
  'tool' as const,
);
const arbChatMessage: fc.Arbitrary<ChatMessage> = fc.record({
  role: arbRole,
  content: fc.oneof(fc.string({ maxLength: 200 }), fc.constant(null)),
});
const arbMessageList = fc.array(arbChatMessage, {
  minLength: 1,
  maxLength: 10,
});

describe('OpenAICompatibleBase', () => {
  /**
   * **Validates: Requirements 5.1, 5.5**
   *
   * Property 4: OpenAI-compatible base formats requests with config values.
   * For any model name, message list, maxTokens, and temperature,
   * formatRequest produces a body containing those values at the correct keys.
   */
  describe('Property 4: formatRequest produces body with config values', () => {
    it('includes model, messages, max_tokens, and temperature from config', () => {
      fc.assert(
        fc.property(
          arbModelName,
          arbMessageList,
          arbMaxTokens,
          arbTemperature,
          (model, messages, maxTokens, temperature) => {
            const provider = createProvider({ model, maxTokens, temperature });
            const result = provider.exposedFormatRequest(messages) as Record<
              string,
              unknown
            >;

            expect(result.model).toBe(model);
            expect(result.messages).toEqual(messages);
            expect(result.max_tokens).toBe(maxTokens);
            expect(result.temperature).toBe(temperature);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('includes tools when provided', () => {
      fc.assert(
        fc.property(
          arbModelName,
          arbMessageList,
          arbMaxTokens,
          arbTemperature,
          (model, messages, maxTokens, temperature) => {
            const provider = createProvider({ model, maxTokens, temperature });
            const tools: Tool[] = [
              {
                type: 'function',
                function: {
                  name: 'test_tool',
                  description: 'A test tool',
                  parameters: {},
                },
              },
            ];
            const result = provider.exposedFormatRequest(
              messages,
              tools,
            ) as Record<string, unknown>;

            expect(result.tools).toEqual(tools);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('omits tools when tools array is empty', () => {
      const provider = createProvider({ model: 'gpt-4', maxTokens: 500 });
      const messages: ChatMessage[] = [{ role: 'user', content: 'hi' }];
      const result = provider.exposedFormatRequest(messages, []) as Record<
        string,
        unknown
      >;

      expect(result.tools).toBeUndefined();
    });

    it('applies default maxTokens (1000) when not specified', () => {
      const provider = createProvider({
        model: 'gpt-4',
        maxTokens: undefined,
      });
      const messages: ChatMessage[] = [{ role: 'user', content: 'hi' }];
      const result = provider.exposedFormatRequest(messages) as Record<
        string,
        unknown
      >;

      expect(result.max_tokens).toBe(1000);
    });

    it('applies default temperature (0.7) when not specified', () => {
      const provider = createProvider({
        model: 'gpt-4',
        temperature: undefined,
      });
      const messages: ChatMessage[] = [{ role: 'user', content: 'hi' }];
      const result = provider.exposedFormatRequest(messages) as Record<
        string,
        unknown
      >;

      expect(result.temperature).toBe(0.7);
    });
  });

  /**
   * **Validates: Requirements 5.1**
   *
   * Property 5: OpenAI-compatible base includes authorization header.
   * For any non-empty apiKey string, getHeaders() returns an
   * Authorization: Bearer <key> header.
   */
  describe('Property 5: getHeaders includes authorization header', () => {
    it('returns Authorization: Bearer <apiKey> for any non-empty apiKey', () => {
      fc.assert(
        fc.property(arbNonEmptyString, apiKey => {
          const provider = createProvider({ apiKey });
          const headers = provider.exposedGetHeaders();

          expect(headers.Authorization).toBe(`Bearer ${apiKey}`);
          expect(headers['Content-Type']).toBe('application/json');
        }),
        { numRuns: 100 },
      );
    });

    it('does NOT include Authorization header when apiKey is undefined', () => {
      const provider = createProvider({ apiKey: undefined });
      const headers = provider.exposedGetHeaders();

      expect(headers.Authorization).toBeUndefined();
      expect(headers['Content-Type']).toBe('application/json');
    });
  });

  /**
   * **Validates: Requirements 4.2**
   *
   * testConnection() error mapping: verifies that HTTP error status codes
   * from the /models endpoint produce the correct user-facing error messages.
   */
  describe('testConnection error mapping', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('returns error for HTTP 401 with API key message', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      const provider = createProvider({ apiKey: 'bad-key' });
      const result = await provider.testConnection();

      expect(result.connected).toBe(false);
      expect(result.error).toBe(
        'Invalid API key. Please check your TestProvider API key configuration.',
      );
    });

    it('returns error for HTTP 403 with permissions message', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => 'Forbidden',
      });

      const provider = createProvider({ apiKey: 'some-key' });
      const result = await provider.testConnection();

      expect(result.connected).toBe(false);
      expect(result.error).toBe(
        'Access forbidden. Please check your API key permissions.',
      );
    });

    it('returns error for HTTP 404 with endpoint not found message', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      });

      const provider = createProvider({
        baseUrl: 'http://localhost:8080',
        apiKey: 'some-key',
      });
      const result = await provider.testConnection();

      expect(result.connected).toBe(false);
      expect(result.error).toBe(
        'TestProvider endpoint not found at http://localhost:8080/models.',
      );
    });

    it('returns error for HTTP 429 with rate limit message', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'Too Many Requests',
      });

      const provider = createProvider({ apiKey: 'some-key' });
      const result = await provider.testConnection();

      expect(result.connected).toBe(false);
      expect(result.error).toBe(
        'Rate limit exceeded. Please try again later or check your TestProvider usage limits.',
      );
    });

    it('returns error message from fetch network error', async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error('Network connection refused'));

      const provider = createProvider({ apiKey: 'some-key' });
      const result = await provider.testConnection();

      expect(result.connected).toBe(false);
      expect(result.error).toBe('Network connection refused');
    });

    it('returns "Unknown error" for non-Error thrown values', async () => {
      global.fetch = jest.fn().mockRejectedValue('something went wrong');

      const provider = createProvider({ apiKey: 'some-key' });
      const result = await provider.testConnection();

      expect(result.connected).toBe(false);
      expect(result.error).toBe('Unknown error');
    });

    it('returns connected true with model list on successful response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          data: [{ id: 'gpt-4' }, { id: 'gpt-3.5-turbo' }],
        }),
      });

      const provider = createProvider({ apiKey: 'valid-key' });
      const result = await provider.testConnection();

      expect(result.connected).toBe(true);
      expect(result.models).toEqual(['gpt-4', 'gpt-3.5-turbo']);
      expect(result.error).toBeUndefined();
    });
  });
});
