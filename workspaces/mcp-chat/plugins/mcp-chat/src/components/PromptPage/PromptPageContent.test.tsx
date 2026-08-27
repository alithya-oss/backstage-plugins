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

import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestApiProvider } from '@backstage/test-utils';
import { identityApiRef } from '@backstage/frontend-plugin-api';
import { mcpChatApiRef } from '../../api';
import { MCPServerType } from '../../types';
import type { ChatStreamEvent, ConversationRecord } from '../../types';
import { PromptPageContent } from './PromptPageContent';

/** A stream that terminates immediately — these tests inspect the request. */
async function* completedStream(): AsyncGenerator<ChatStreamEvent> {
  yield { type: 'text', text: 'Done.' };
  yield { type: 'complete', conversationId: 'conv-new', toolsUsed: [] };
}

const storedConversations: ConversationRecord[] = [
  {
    id: 'conv-deploy',
    userId: 'user:default/tester',
    title: 'Deploy the service',
    messages: [
      { role: 'user', content: 'How do I deploy?' },
      { role: 'assistant', content: 'Run the pipeline.' },
    ],
    isStarred: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  },
  {
    id: 'conv-metrics',
    userId: 'user:default/tester',
    title: 'Dashboards',
    messages: [{ role: 'user', content: 'Where are the metrics?' }],
    isStarred: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

function renderPage(
  overrides: {
    streamChatMessage?: jest.Mock;
    getMCPServerStatus?: jest.Mock;
    getProviderStatus?: jest.Mock;
    getConversations?: jest.Mock;
    getConversationById?: jest.Mock;
    userEntityRef?: string;
  } = {},
) {
  const mcpChatApi = {
    sendChatMessage: jest.fn(),
    streamChatMessage:
      overrides.streamChatMessage ??
      jest.fn().mockImplementation(() => completedStream()),
    getMCPServerStatus:
      overrides.getMCPServerStatus ??
      jest.fn().mockResolvedValue({
        total: 2,
        valid: 2,
        active: 2,
        timestamp: '2026-01-01T00:00:00Z',
        servers: [
          {
            id: 'filesystem',
            name: 'Filesystem',
            type: MCPServerType.STREAMABLE_HTTP,
            status: { valid: true, connected: true },
          },
          {
            id: 'github',
            name: 'GitHub',
            type: MCPServerType.STREAMABLE_HTTP,
            status: { valid: true, connected: true },
          },
        ],
      }),
    getAvailableTools: jest.fn(),
    getProviderStatus:
      overrides.getProviderStatus ??
      jest.fn().mockResolvedValue({
        providers: [
          {
            id: 'openai',
            model: 'gpt-4o-mini',
            baseUrl: 'https://api.openai.com/v1',
            connection: { connected: true },
            supportsStreaming: true,
          },
        ],
        summary: { totalProviders: 1, healthyProviders: 1 },
        timestamp: '2026-01-01T00:00:00Z',
      }),
    getConversations:
      overrides.getConversations ??
      jest.fn().mockResolvedValue({
        conversations: storedConversations,
        count: storedConversations.length,
      }),
    getConversationById:
      overrides.getConversationById ??
      jest
        .fn()
        .mockImplementation(async (id: string) =>
          storedConversations.find(record => record.id === id),
        ),
    deleteConversation: jest.fn().mockResolvedValue(undefined),
    toggleConversationStar: jest.fn().mockResolvedValue({ isStarred: true }),
  };

  const identityApi = {
    getBackstageIdentity: jest.fn().mockResolvedValue({
      type: 'user',
      userEntityRef: overrides.userEntityRef ?? 'user:default/tester',
      ownershipEntityRefs: [overrides.userEntityRef ?? 'user:default/tester'],
    }),
    getCredentials: jest.fn().mockResolvedValue({ token: undefined }),
    getProfileInfo: jest.fn().mockResolvedValue({ displayName: 'Tester' }),
  };

  render(
    <TestApiProvider
      apis={[
        [mcpChatApiRef, mcpChatApi],
        [identityApiRef, identityApi],
      ]}
    >
      <PromptPageContent />
    </TestApiProvider>,
  );

  return { mcpChatApi };
}

/** Types into the composer and submits with Enter. */
async function submitPrompt(text: string) {
  const input = await screen.findByRole('textbox', { name: 'Prompt' });
  await act(async () => {
    fireEvent.change(input, { target: { value: text } });
  });
  await act(async () => {
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
  });
}

describe('the prompt page side panel wiring', () => {
  it('mounts the runtime without starting a run', async () => {
    const { mcpChatApi } = renderPage();

    expect(
      await screen.findByRole('heading', { name: 'MCP Prompt' }),
    ).toBeInTheDocument();
    expect(mcpChatApi.streamChatMessage).not.toHaveBeenCalled();
  });

  it('withholds a disabled server from the next run while keeping the enabled ones', async () => {
    const { mcpChatApi } = renderPage();

    // Every configured server starts enabled, so both ids travel with a run
    // until one is switched off.
    await userEvent.click(
      await screen.findByRole('switch', { name: 'GitHub' }),
    );

    await submitPrompt('What changed?');

    expect(mcpChatApi.streamChatMessage).toHaveBeenCalledTimes(1);
    const [, enabledServerIds] = mcpChatApi.streamChatMessage.mock.calls[0];
    expect(enabledServerIds).toEqual(['filesystem']);
  });

  it('replaces the conversation with a selected one and continues it on the next prompt', async () => {
    const { mcpChatApi } = renderPage();

    await userEvent.click(
      await screen.findByRole('button', { name: 'Deploy the service' }),
    );

    // The stored turns become the page's conversation, in their stored order.
    expect(await screen.findByText('How do I deploy?')).toBeVisible();
    expect(await screen.findByText('Run the pipeline.')).toBeVisible();
    // A reloaded conversation is linear: its answer has no alternatives, so the
    // version picker has nothing to show and reports no inconsistency.
    expect(screen.queryByText(/Answer\s*\d\s*of\s*\d/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Previous answer' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await submitPrompt('And how do I roll back?');

    const [history, , , conversationId] =
      mcpChatApi.streamChatMessage.mock.calls[0];
    // The stored id travels with the run, so the backend appends to the same
    // conversation rather than storing a new one.
    expect(conversationId).toBe('conv-deploy');
    expect(history).toEqual([
      { role: 'user', content: 'How do I deploy?' },
      { role: 'assistant', content: 'Run the pipeline.' },
      { role: 'user', content: 'And how do I roll back?' },
    ]);
  });

  it('empties the conversation and drops the stored id when a fresh conversation is started', async () => {
    const { mcpChatApi } = renderPage();

    await userEvent.click(
      await screen.findByRole('button', { name: 'Deploy the service' }),
    );
    expect(await screen.findByText('How do I deploy?')).toBeVisible();

    await userEvent.click(await screen.findByRole('button', { name: 'New' }));

    expect(screen.queryByText('How do I deploy?')).not.toBeInTheDocument();

    await submitPrompt('A brand new question');

    const [history, , , conversationId] =
      mcpChatApi.streamChatMessage.mock.calls[0];
    expect(conversationId).toBeUndefined();
    expect(history).toEqual([
      { role: 'user', content: 'A brand new question' },
    ]);
  });

  it('narrows the list case-insensitively over titles and user turns', async () => {
    renderPage();

    expect(
      await screen.findByRole('button', { name: 'Deploy the service' }),
    ).toBeVisible();

    const search = await screen.findByRole('searchbox', {
      name: 'Search conversations',
    });

    // Matched against the title, in the wrong case on purpose.
    await userEvent.type(search, 'DEPLOY');
    expect(
      await screen.findByRole('button', { name: 'Deploy the service' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Dashboards' }),
    ).not.toBeInTheDocument();

    // Matched against a user turn rather than the title.
    await userEvent.clear(search);
    await userEvent.type(search, 'METRICS');
    expect(
      await screen.findByRole('button', { name: 'Dashboards' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Deploy the service' }),
    ).not.toBeInTheDocument();
  });

  it('reports an empty list and still accepts a prompt when the identity cannot own conversations', async () => {
    const getConversations = jest.fn();
    const { mcpChatApi } = renderPage({
      userEntityRef: 'user:development/guest',
      getConversations,
    });

    expect(
      await screen.findByText('No stored conversations yet.'),
    ).toBeVisible();
    // A guest identity is never asked for, so no failure is reported either.
    expect(getConversations).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await submitPrompt('Can I still ask?');
    expect(mcpChatApi.streamChatMessage).toHaveBeenCalledTimes(1);
  });

  it('accepts a prompt even when the server list and the provider status both fail', async () => {
    const { mcpChatApi } = renderPage({
      getMCPServerStatus: jest.fn().mockRejectedValue(new Error('servers')),
      getProviderStatus: jest.fn().mockRejectedValue(new Error('provider')),
    });

    expect(
      await screen.findByText('The MCP server list is unavailable.'),
    ).toBeVisible();
    expect(
      await screen.findByText('Provider status is unavailable.'),
    ).toBeVisible();

    await submitPrompt('Answer anyway');

    expect(mcpChatApi.streamChatMessage).toHaveBeenCalledTimes(1);
    const [, enabledServerIds] = mcpChatApi.streamChatMessage.mock.calls[0];
    expect(enabledServerIds).toEqual([]);
  });
});
