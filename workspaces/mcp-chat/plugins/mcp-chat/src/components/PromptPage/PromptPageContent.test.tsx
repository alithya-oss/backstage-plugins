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

import { render, screen } from '@testing-library/react';
import { TestApiProvider } from '@backstage/test-utils';
import { mcpChatApiRef } from '../../api';
import { PromptPageContent } from './PromptPageContent';

describe('PromptPageContent', () => {
  it('mounts the external store runtime over the prompt thread state', async () => {
    const mcpChatApi = {
      sendChatMessage: jest.fn(),
      streamChatMessage: jest.fn(),
      getMCPServerStatus: jest.fn(),
      getAvailableTools: jest.fn(),
      getProviderStatus: jest.fn(),
      getConversations: jest.fn(),
      getConversationById: jest.fn(),
      deleteConversation: jest.fn(),
      toggleConversationStar: jest.fn(),
    };

    render(
      <TestApiProvider apis={[[mcpChatApiRef, mcpChatApi]]}>
        <PromptPageContent />
      </TestApiProvider>,
    );

    expect(
      await screen.findByRole('heading', { name: 'MCP Prompt' }),
    ).toBeInTheDocument();
    // Mounting is enough to prove the runtime accepted the adapter; no run is
    // started until a prompt is submitted.
    expect(mcpChatApi.streamChatMessage).not.toHaveBeenCalled();
  });
});
