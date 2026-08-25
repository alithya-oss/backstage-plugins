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

import { mockServices } from '@backstage/backend-test-utils';
import { ProviderStatusReporter } from './ProviderStatusReporter';

describe('ProviderStatusReporter', () => {
  let reporter: ProviderStatusReporter;
  let mockLogger: ReturnType<typeof mockServices.logger.mock>;
  let mockLLMProvider: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger = mockServices.logger.mock();
    mockLLMProvider = {
      testConnection: jest.fn(),
      getType: jest.fn().mockReturnValue('openai'),
      getModel: jest.fn().mockReturnValue('gpt-4'),
      getBaseUrl: jest.fn().mockReturnValue('https://api.openai.com/v1'),
      supportsStreaming: jest.fn().mockReturnValue(false),
    };
  });

  describe('getProviderStatus', () => {
    it('returns proper ProviderStatusData when connection succeeds with models', async () => {
      mockLLMProvider.testConnection.mockResolvedValue({
        connected: true,
        models: ['gpt-4', 'gpt-3.5-turbo'],
      });

      reporter = new ProviderStatusReporter({
        logger: mockLogger,
        llmProvider: mockLLMProvider,
      });

      const status = await reporter.getProviderStatus();

      expect(status.providers).toHaveLength(1);
      expect(status.providers[0]).toMatchObject({
        id: 'openai',
        model: 'gpt-4',
        baseUrl: 'https://api.openai.com/v1',
        connection: {
          connected: true,
          models: ['gpt-4', 'gpt-3.5-turbo'],
        },
      });
      expect(status.summary).toEqual({
        totalProviders: 1,
        healthyProviders: 1,
      });
      expect(status.timestamp).toBeDefined();
    });

    it('includes error when connection returns disconnected', async () => {
      mockLLMProvider.testConnection.mockResolvedValue({
        connected: false,
        error: 'Invalid API key',
      });

      reporter = new ProviderStatusReporter({
        logger: mockLogger,
        llmProvider: mockLLMProvider,
      });

      const status = await reporter.getProviderStatus();

      expect(status.providers).toHaveLength(1);
      expect(status.providers[0].connection).toEqual({
        connected: false,
        models: [],
        error: 'Invalid API key',
      });
      expect(status.summary.healthyProviders).toBe(0);
    });

    it('returns empty providers with error when testConnection throws', async () => {
      mockLLMProvider.testConnection.mockRejectedValue(
        new Error('Network timeout'),
      );

      reporter = new ProviderStatusReporter({
        logger: mockLogger,
        llmProvider: mockLLMProvider,
      });

      const status = await reporter.getProviderStatus();

      expect(status.providers).toEqual([]);
      expect(status.summary).toEqual({
        totalProviders: 0,
        healthyProviders: 0,
        error: 'Network timeout',
      });
      expect(status.timestamp).toBeDefined();
    });

    it('handles non-Error thrown values gracefully', async () => {
      mockLLMProvider.testConnection.mockRejectedValue('string error');

      reporter = new ProviderStatusReporter({
        logger: mockLogger,
        llmProvider: mockLLMProvider,
      });

      const status = await reporter.getProviderStatus();

      expect(status.providers).toEqual([]);
      expect(status.summary.error).toBe('Unknown error');
    });

    it('reports whether the active provider streams incrementally', async () => {
      mockLLMProvider.testConnection.mockResolvedValue({ connected: true });
      mockLLMProvider.supportsStreaming.mockReturnValue(true);

      reporter = new ProviderStatusReporter({
        logger: mockLogger,
        llmProvider: mockLLMProvider,
      });

      const streaming = await reporter.getProviderStatus();
      expect(streaming.providers[0].supportsStreaming).toBe(true);

      mockLLMProvider.supportsStreaming.mockReturnValue(false);
      const fallback = await reporter.getProviderStatus();
      expect(fallback.providers[0].supportsStreaming).toBe(false);
    });

    it('logs a warning when testConnection throws', async () => {
      mockLLMProvider.testConnection.mockRejectedValue(
        new Error('Connection refused'),
      );

      reporter = new ProviderStatusReporter({
        logger: mockLogger,
        llmProvider: mockLLMProvider,
      });

      await reporter.getProviderStatus();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Connection refused'),
      );
    });
  });
});
