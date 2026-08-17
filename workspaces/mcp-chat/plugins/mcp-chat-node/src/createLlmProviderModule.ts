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
  createBackendModule,
  coreServices,
} from '@backstage/backend-plugin-api';
import { llmProviderExtensionPoint } from './extensions';
import { LLMProvider } from './LLMProvider';
import type { ProviderConfig } from './types';

/**
 * Options for creating an LLM provider backend module.
 * @public
 */
export interface CreateLlmProviderModuleOptions {
  /** Provider identifier — matches `mcpChat.providers[].id` in config. */
  providerId: string;
  /** Default base URL when config omits `baseUrl`. */
  defaultBaseUrl: string;
  /** Constructor that produces the LLM_Provider from a ProviderConfig. */
  providerFactory: (config: ProviderConfig) => LLMProvider;
}

/**
 * Creates a Backstage backend module that registers one LLM provider.
 *
 * @public
 */
export function createLlmProviderModule(
  options: CreateLlmProviderModuleOptions,
) {
  const { providerId, defaultBaseUrl, providerFactory } = options;

  return createBackendModule({
    pluginId: 'mcp-chat',
    moduleId: providerId,
    register(reg) {
      reg.registerInit({
        deps: {
          config: coreServices.rootConfig,
          logger: coreServices.logger,
          llmProviders: llmProviderExtensionPoint,
        },
        async init({ config, logger, llmProviders }) {
          const providers =
            config.getOptionalConfigArray('mcpChat.providers') ?? [];
          const entry = providers.find(p => p.getString('id') === providerId);

          if (!entry) return; // Not configured — skip silently

          const providerConfig: ProviderConfig = {
            type: providerId,
            apiKey: entry.getOptionalString('token'),
            baseUrl: entry.getOptionalString('baseUrl') ?? defaultBaseUrl,
            model: entry.getString('model'),
            deploymentName: entry.getOptionalString('deploymentName'),
            logger,
            maxTokens: entry.getOptionalNumber('maxTokens'),
            temperature: entry.getOptionalNumber('temperature'),
          };

          const provider = providerFactory(providerConfig);
          llmProviders.registerProvider(providerId, provider);
        },
      });
    },
  });
}
