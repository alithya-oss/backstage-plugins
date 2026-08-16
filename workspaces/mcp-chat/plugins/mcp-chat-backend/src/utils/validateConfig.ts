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
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';

/**
 * Validates the MCP server configuration.
 * Ensures that headers and env are objects with string key-value pairs.
 * Throws an error if any configuration is invalid.
 *
 * @param config - The root configuration service
 * @param logger - The logger service for diagnostic output
 * @public
 */
export const validateConfig = (
  config: RootConfigService,
  logger: LoggerService,
) => {
  const providerConfig =
    config.getOptionalConfigArray('mcpChat.providers') || [];
  const mcpServers = config.getOptionalConfigArray('mcpChat.mcpServers') || [];
  if (providerConfig.length === 0) {
    throw new Error(
      'No LLM providers configured in mcpChat.providers. Please add at least one provider.',
    );
  }

  for (const [index, serverConfig] of mcpServers.entries()) {
    try {
      const configs = [
        { config: serverConfig.getOptionalConfig('headers'), name: 'headers' },
        { config: serverConfig.getOptionalConfig('env'), name: 'env' },
      ];

      for (const { config: configItem, name } of configs) {
        if (configItem?.has('')) {
          const value = configItem.get();
          if (typeof value !== 'object' || Array.isArray(value)) {
            throw new Error(
              `${name} must be an object with string key-value pairs`,
            );
          }
        }
      }
    } catch (error) {
      throw new Error(
        `Invalid configuration for MCP server at index ${index}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  // Validate quickPrompts if present
  const quickPrompts =
    config.getOptionalConfigArray('mcpChat.quickPrompts') || [];
  for (const [index, promptConfig] of quickPrompts.entries()) {
    const requiredFields = ['title', 'description', 'prompt', 'category'];
    for (const field of requiredFields) {
      if (!promptConfig.has(field)) {
        throw new Error(
          `QuickPrompt at index ${index} is missing required field: '${field}'`,
        );
      }
      const value = promptConfig.getString(field);
      if (!value || value.trim() === '') {
        throw new Error(
          `QuickPrompt at index ${index} has empty value for required field: '${field}'`,
        );
      }
    }
  }

  // Validate toolCallTimeout if present
  const toolCallTimeout = config.getOptionalNumber('mcpChat.toolCallTimeout');
  if (toolCallTimeout !== undefined && toolCallTimeout <= 0) {
    throw new Error(
      `mcpChat.toolCallTimeout must be a strictly positive number, got: ${toolCallTimeout}`,
    );
  }

  // Validate systemPrompt if present
  const systemPrompt = config.getOptionalString('mcpChat.systemPrompt');
  if (systemPrompt !== undefined) {
    if (typeof systemPrompt !== 'string') {
      throw new Error('systemPrompt must be a string');
    }
    if (systemPrompt.trim() === '') {
      throw new Error('systemPrompt cannot be empty or whitespace-only');
    }
  }

  logger.info('MCP Chat configuration validated successfully');
};
