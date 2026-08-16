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
});
