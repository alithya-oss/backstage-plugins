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
import { llmProviderExtensionPoint } from '@alithya-oss/backstage-plugin-mcp-chat-node';
import { DefaultAwsCredentialsManager } from '@backstage/integration-aws-node';
import { BedrockProvider } from './BedrockProvider';

/**
 * Backend module that registers the Amazon Bedrock LLM provider
 * with the mcp-chat backend plugin.
 *
 * Uses a custom `createBackendModule` instead of `createLlmProviderModule`
 * because it requires async AWS credential resolution before constructing
 * the provider.
 *
 * @public
 */
export default createBackendModule({
  pluginId: 'mcp-chat',
  moduleId: 'amazon-bedrock',
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
        const entry = providers.find(
          p => p.getString('id') === 'amazon-bedrock',
        );

        if (!entry) return; // Not configured — skip silently

        const region = entry.getOptionalString('region') ?? 'us-east-1';
        const accountId = entry.getOptionalString('accountId');

        const credsManager = DefaultAwsCredentialsManager.fromConfig(config);
        const credProvider = await credsManager.getCredentialProvider({
          accountId,
        });

        const providerConfig = {
          type: 'amazon-bedrock',
          apiKey: entry.getOptionalString('token'),
          baseUrl: entry.getOptionalString('baseUrl') ?? '',
          model: entry.getString('model'),
          logger,
          maxTokens: entry.getOptionalNumber('maxTokens'),
          temperature: entry.getOptionalNumber('temperature'),
        };

        llmProviders.registerProvider(
          'amazon-bedrock',
          new BedrockProvider(providerConfig, {
            region,
            credentialProvider: credProvider.sdkCredentialProvider,
          }),
        );
      },
    });
  },
});
