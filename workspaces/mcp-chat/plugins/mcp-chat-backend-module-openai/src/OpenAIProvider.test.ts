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

import { OpenAIProvider } from './OpenAIProvider';
import type {
  ChatMessage,
  Tool,
  ProviderConfig,
} from '@alithya-oss/backstage-plugin-mcp-chat-node';

const mockFetch = jest.fn() as jest.Mock;
global.fetch = mockFetch;

function createProvider(
  configOverrides?: Partial<ProviderConfig>,
): OpenAIProvider {
  const config: ProviderConfig = {
    type: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    apiKey: 'test-api-key',
    logger: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      child: jest.fn(),
    } as any,
    ...configOverrides,
  };
  return new OpenAIProvider(config);
}

const sampleTool: Tool = {
  type: 'function',
  function: {
    name: 'get_weather',
    description: 'Get the weather',
    parameters: { type: 'object', properties: { city: { type: 'string' } } },
  },
};

describe('OpenAIProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('sends a message and returns the response', async () => {
      const provider = createProvider();
      const apiResponse = {
        choices: [{ message: { role: 'assistant', content: 'Hello there!' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => apiResponse,
      });

      const messages: ChatMessage[] = [{ role: 'user', content: 'Hi' }];
      const result = await provider.sendMessage(messages);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({ method: 'POST' }),
      );
      expect(result).toEqual(apiResponse);
    });

    it('includes tools in the request when provided', async () => {
      const provider = createProvider();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            { message: { role: 'assistant', content: null, tool_calls: [] } },
          ],
        }),
      });

      await provider.sendMessage(
        [{ role: 'user', content: 'Weather?' }],
        [sampleTool],
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.tools).toEqual([sampleTool]);
    });

    it('throws on API error', async () => {
      const provider = createProvider();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      await expect(
        provider.sendMessage([{ role: 'user', content: 'Hello' }]),
      ).rejects.toThrow();
    });
  });

  describe('testConnection', () => {
    it('returns connected with models on success', async () => {
      const provider = createProvider();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ id: 'gpt-4o' }, { id: 'gpt-4o-mini' }],
        }),
      });

      const result = await provider.testConnection();

      expect(result).toEqual({
        connected: true,
        models: ['gpt-4o', 'gpt-4o-mini'],
      });
    });

    it('returns error message on 401', async () => {
      const provider = createProvider();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () =>
          JSON.stringify({ error: { message: 'Unauthorized' } }),
      });

      const result = await provider.testConnection();

      expect(result.connected).toBe(false);
      expect(result.error).toContain('Invalid API key');
      expect(result.error).toContain('OpenAI');
    });

    it('returns error message on 429', async () => {
      const provider = createProvider();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Too Many Requests',
      });

      const result = await provider.testConnection();

      expect(result.connected).toBe(false);
      expect(result.error).toContain('Rate limit exceeded');
      expect(result.error).toContain('OpenAI');
    });

    it('returns error message on 403', async () => {
      const provider = createProvider();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => 'Forbidden',
      });

      const result = await provider.testConnection();

      expect(result.connected).toBe(false);
      expect(result.error).toContain('Access forbidden');
    });

    it('handles network errors', async () => {
      const provider = createProvider();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await provider.testConnection();

      expect(result.connected).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('handles non-Error exceptions', async () => {
      const provider = createProvider();
      mockFetch.mockRejectedValueOnce('string error');

      const result = await provider.testConnection();

      expect(result.connected).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });

  describe('getHeaders', () => {
    it('includes Authorization header when API key is set', () => {
      const provider = createProvider();
      const headers = (provider as any).getHeaders();
      expect(headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-api-key',
      });
    });

    it('omits Authorization header when no API key', () => {
      const provider = createProvider({ apiKey: undefined });
      const headers = (provider as any).getHeaders();
      expect(headers).toEqual({ 'Content-Type': 'application/json' });
      expect(headers.Authorization).toBeUndefined();
    });
  });

  describe('formatRequest', () => {
    const messages: ChatMessage[] = [{ role: 'user', content: 'Hello' }];

    it.each([
      ['gpt-4o-mini', 'max_tokens'],
      ['gpt-4o', 'max_tokens'],
      ['gpt-4', 'max_tokens'],
      ['gpt-3.5-turbo', 'max_tokens'],
      ['o1', 'max_completion_tokens'],
      ['o1-mini', 'max_completion_tokens'],
      ['o1-preview', 'max_completion_tokens'],
      ['o3-mini', 'max_completion_tokens'],
      ['o4-mini', 'max_completion_tokens'],
      ['gpt-5', 'max_completion_tokens'],
      ['gpt-5.2', 'max_completion_tokens'],
    ])('model %s uses %s', (model, expectedParam) => {
      const provider = createProvider({ model });
      const request = (provider as any).formatRequest(messages);

      expect(request[expectedParam]).toBeDefined();
      const unexpectedParam =
        expectedParam === 'max_tokens' ? 'max_completion_tokens' : 'max_tokens';
      expect(request[unexpectedParam]).toBeUndefined();
    });

    it.each([
      [undefined, 1000],
      [4096, 4096],
      [512, 512],
    ])('maxTokens config %s results in %d', (maxTokens, expected) => {
      const provider = createProvider({ maxTokens });
      const request = (provider as any).formatRequest(messages);
      expect(request.max_tokens).toBe(expected);
    });

    it.each([
      [undefined, 0.7],
      [0.2, 0.2],
      [0, 0],
      [1, 1],
    ])('temperature config %s results in %s', (temperature, expected) => {
      const provider = createProvider({ temperature });
      const request = (provider as any).formatRequest(messages);
      expect(request.temperature).toBe(expected);
    });

    it.each(['o1', 'o1-mini', 'o3-mini', 'o4-mini', 'gpt-5', 'gpt-5.2'])(
      'model %s does NOT include temperature',
      model => {
        const provider = createProvider({ model, temperature: 0.5 });
        const request = (provider as any).formatRequest(messages);
        expect(request.temperature).toBeUndefined();
      },
    );

    it.each(['gpt-4o-mini', 'gpt-4o', 'gpt-4', 'gpt-3.5-turbo'])(
      'model %s includes temperature',
      model => {
        const provider = createProvider({ model, temperature: 0.5 });
        const request = (provider as any).formatRequest(messages);
        expect(request.temperature).toBe(0.5);
      },
    );

    it('does not include tools when array is empty', () => {
      const provider = createProvider();
      const request = (provider as any).formatRequest(messages, []);
      expect(request.tools).toBeUndefined();
    });
  });

  describe('parseResponse', () => {
    it('returns the response as-is', () => {
      const provider = createProvider();
      const response = {
        choices: [{ message: { role: 'assistant', content: 'Hello' } }],
      };
      expect((provider as any).parseResponse(response)).toEqual(response);
    });
  });
});
