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
import { startTestBackend, mockServices } from '@backstage/backend-test-utils';
import { createLlmProviderModule } from './createLlmProviderModule';
import { llmProviderExtensionPoint } from './extensions';
import { LLMProvider } from './LLMProvider';
import type { ProviderConfig } from './types';
import type { ChatMessage, Tool, ChatResponse } from './types';

/** Minimal concrete LLMProvider for testing purposes. */
class MockLLMProvider extends LLMProvider {
  async sendMessage(
    _messages: ChatMessage[],
    _tools?: Tool[],
  ): Promise<ChatResponse> {
    return { choices: [] } as unknown as ChatResponse;
  }

  async testConnection() {
    return { connected: true };
  }

  protected getHeaders(): Record<string, string> {
    return {};
  }

  protected formatRequest(_messages: ChatMessage[], _tools?: Tool[]): unknown {
    return {};
  }

  protected parseResponse(response: unknown): ChatResponse {
    return response as ChatResponse;
  }
}

/**
 * Arbitrary that generates valid Backstage module IDs.
 * Must match /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/ per Backstage validation.
 */
const providerIdArb = fc.stringMatching(
  /^[a-z][a-z0-9]{0,5}(-[a-z0-9]{1,5}){0,2}$/,
);

/**
 * Arbitrary that generates valid base URLs.
 */
const baseUrlArb = fc
  .tuple(
    fc.constantFrom('http', 'https'),
    fc.stringMatching(/^[a-z][a-z0-9]{0,10}\.[a-z]{2,4}$/),
  )
  .map(([scheme, host]) => `${scheme}://${host}`);

/**
 * Arbitrary for model names (non-empty, safe characters).
 */
const modelArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9._-]{0,19}$/);

describe('createLlmProviderModule', () => {
  /**
   * Property 1: Factory module registration
   *
   * For any valid provider id (non-empty string), valid base URL, and mock
   * provider constructor, calling `createLlmProviderModule` and initializing
   * it with a config containing a matching `mcpChat.providers[].id` entry
   * SHALL result in `registerProvider` being called on the extension point
   * with the correct providerId and provider instance.
   *
   * **Validates: Requirements 4.1, 4.4**
   */
  it('Property 1: registers the provider on the extension point when config matches', async () => {
    await fc.assert(
      fc.asyncProperty(
        providerIdArb,
        baseUrlArb,
        modelArb,
        async (providerId, defaultBaseUrl, model) => {
          let registeredId: string | undefined;
          let registeredProvider: LLMProvider | undefined;

          const module = createLlmProviderModule({
            providerId,
            defaultBaseUrl,
            providerFactory: config => new MockLLMProvider(config),
          });

          const backend = await startTestBackend({
            extensionPoints: [
              [
                llmProviderExtensionPoint,
                {
                  registerProvider(type: string, provider: LLMProvider) {
                    registeredId = type;
                    registeredProvider = provider;
                  },
                },
              ],
            ],
            features: [
              module,
              mockServices.rootConfig.factory({
                data: {
                  mcpChat: {
                    providers: [
                      {
                        id: providerId,
                        model,
                      },
                    ],
                  },
                },
              }),
            ],
          });

          await backend.stop();

          expect(registeredId).toBe(providerId);
          expect(registeredProvider).toBeInstanceOf(MockLLMProvider);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 2: Factory default base URL fallback
   *
   * For any valid provider id and any baseUrl config value (present or absent),
   * the provider receives `defaultBaseUrl` when config omits baseUrl,
   * and the config value when present.
   *
   * **Validates: Requirements 4.3**
   */
  it('Property 2: uses defaultBaseUrl when config omits baseUrl, config value when present', async () => {
    await fc.assert(
      fc.asyncProperty(
        providerIdArb,
        baseUrlArb,
        baseUrlArb,
        modelArb,
        fc.boolean(),
        async (
          providerId,
          defaultBaseUrl,
          configBaseUrl,
          model,
          includeBaseUrl,
        ) => {
          let receivedConfig: ProviderConfig | undefined;

          const module = createLlmProviderModule({
            providerId,
            defaultBaseUrl,
            providerFactory: config => {
              receivedConfig = config;
              return new MockLLMProvider(config);
            },
          });

          const providerEntry: Record<string, string> = {
            id: providerId,
            model,
          };
          if (includeBaseUrl) {
            providerEntry.baseUrl = configBaseUrl;
          }

          const backend = await startTestBackend({
            extensionPoints: [
              [
                llmProviderExtensionPoint,
                {
                  registerProvider(_type: string, _provider: LLMProvider) {},
                },
              ],
            ],
            features: [
              module,
              mockServices.rootConfig.factory({
                data: {
                  mcpChat: {
                    providers: [providerEntry],
                  },
                },
              }),
            ],
          });

          await backend.stop();

          expect(receivedConfig).toBeDefined();
          const expectedBaseUrl = includeBaseUrl
            ? configBaseUrl
            : defaultBaseUrl;
          expect(receivedConfig!.baseUrl).toBe(expectedBaseUrl);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 3: Factory maxTokens and temperature propagation
   *
   * For any numeric maxTokens and temperature values in config,
   * the provider constructor receives them unchanged.
   *
   * **Validates: Requirements 4.5**
   */
  it('Property 3: propagates maxTokens and temperature from config to providerFactory unchanged', async () => {
    await fc.assert(
      fc.asyncProperty(
        providerIdArb,
        baseUrlArb,
        modelArb,
        fc.integer({ min: 1, max: 100000 }),
        fc.double({ min: 0, max: 2, noNaN: true }),
        async (providerId, defaultBaseUrl, model, maxTokens, temperature) => {
          let receivedConfig: ProviderConfig | undefined;

          const module = createLlmProviderModule({
            providerId,
            defaultBaseUrl,
            providerFactory: config => {
              receivedConfig = config;
              return new MockLLMProvider(config);
            },
          });

          const backend = await startTestBackend({
            extensionPoints: [
              [
                llmProviderExtensionPoint,
                {
                  registerProvider(_type: string, _provider: LLMProvider) {},
                },
              ],
            ],
            features: [
              module,
              mockServices.rootConfig.factory({
                data: {
                  mcpChat: {
                    providers: [
                      {
                        id: providerId,
                        model,
                        maxTokens,
                        temperature,
                      },
                    ],
                  },
                },
              }),
            ],
          });

          await backend.stop();

          expect(receivedConfig).toBeDefined();
          expect(receivedConfig!.maxTokens).toBe(maxTokens);
          expect(receivedConfig!.temperature).toBe(temperature);
        },
      ),
      { numRuns: 100 },
    );
  });
});
