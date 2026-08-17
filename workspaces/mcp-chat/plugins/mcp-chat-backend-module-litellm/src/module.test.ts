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

import { startTestBackend, mockServices } from '@backstage/backend-test-utils';
import { llmProviderExtensionPoint } from '@alithya-oss/backstage-plugin-mcp-chat-node';
import module from './module';

describe('litellm module', () => {
  it('registers provider when config is present', async () => {
    const registerProvider = jest.fn();

    const backend = await startTestBackend({
      extensionPoints: [[llmProviderExtensionPoint, { registerProvider }]],
      features: [
        module,
        mockServices.rootConfig.factory({
          data: {
            mcpChat: {
              providers: [{ id: 'litellm', model: 'gpt-4' }],
            },
          },
        }),
      ],
    });
    await backend.stop();

    expect(registerProvider).toHaveBeenCalledWith(
      'litellm',
      expect.any(Object),
    );
  });

  it('skips silently when config entry is absent', async () => {
    const registerProvider = jest.fn();

    const backend = await startTestBackend({
      extensionPoints: [[llmProviderExtensionPoint, { registerProvider }]],
      features: [
        module,
        mockServices.rootConfig.factory({
          data: { mcpChat: { providers: [] } },
        }),
      ],
    });
    await backend.stop();

    expect(registerProvider).not.toHaveBeenCalled();
  });
});
