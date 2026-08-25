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
import { LLMProvider } from '@alithya-oss/backstage-plugin-mcp-chat-node';
import { ProviderStatusData } from '@alithya-oss/backstage-plugin-mcp-chat-common';

/**
 * Reports the status of the configured LLM provider.
 *
 * @public
 */
export class ProviderStatusReporter {
  private readonly logger: LoggerService;
  private readonly llmProvider: LLMProvider;

  constructor(options: { logger: LoggerService; llmProvider: LLMProvider }) {
    this.logger = options.logger;
    this.llmProvider = options.llmProvider;
  }

  async getProviderStatus(): Promise<ProviderStatusData> {
    try {
      const status = await this.llmProvider.testConnection();

      const providers = [
        {
          id: this.llmProvider.getType(),
          model: this.llmProvider.getModel(),
          baseUrl: this.llmProvider.getBaseUrl(),
          connection: {
            connected: status.connected,
            models: status.models || [],
            error: status.error,
          },
          supportsStreaming: this.llmProvider.supportsStreaming(),
        },
      ];

      const summary = {
        totalProviders: providers.length,
        healthyProviders: providers.filter(
          p => p.connection?.connected === true,
        ).length,
      };

      return {
        providers,
        summary,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.warn(
        `Failed to test provider connection: ${
          error instanceof Error ? error.message : error
        }`,
      );
      return {
        providers: [],
        summary: {
          totalProviders: 0,
          healthyProviders: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date().toISOString(),
      };
    }
  }
}
