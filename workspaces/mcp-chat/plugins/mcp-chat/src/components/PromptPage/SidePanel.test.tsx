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

import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MCPServerType } from '../../types';
import type {
  ConversationRecord,
  MCPServer,
  ProviderStatusData,
} from '../../types';
import { SidePanel } from './SidePanel';
import type { SidePanelProps } from './SidePanel';

function server(overrides: Partial<MCPServer> & { id: string }): MCPServer {
  return {
    name: overrides.id,
    type: MCPServerType.STREAMABLE_HTTP,
    enabled: true,
    status: { valid: true, connected: true },
    ...overrides,
  };
}

function conversation(
  overrides: Partial<ConversationRecord> & { id: string },
): ConversationRecord {
  return {
    userId: 'user:default/tester',
    messages: [{ role: 'user', content: 'Hello' }],
    isStarred: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

const providerStatus: ProviderStatusData = {
  providers: [
    {
      id: 'openai',
      model: 'gpt-4o-mini',
      baseUrl: 'https://api.openai.com/v1',
      connection: { connected: true, models: ['gpt-4o-mini'] },
      supportsStreaming: true,
    },
  ],
  summary: { totalProviders: 1, healthyProviders: 1 },
  timestamp: '2026-01-01T00:00:00Z',
};

interface PanelOverrides {
  servers?: Partial<SidePanelProps['servers']>;
  provider?: Partial<SidePanelProps['provider']>;
  conversations?: Partial<SidePanelProps['conversations']>;
}

function renderPanel(overrides: PanelOverrides = {}) {
  const handlers = {
    onToggle: jest.fn(),
    onRetry: jest.fn(),
    onSearchChange: jest.fn(),
    onSelect: jest.fn().mockResolvedValue(undefined),
    onToggleStar: jest.fn().mockResolvedValue(undefined),
    onDelete: jest.fn().mockResolvedValue(undefined),
    onNewConversation: jest.fn(),
  };

  render(
    <SidePanel
      servers={{
        servers: [],
        isLoading: false,
        onToggle: handlers.onToggle,
        onRetry: handlers.onRetry,
        ...overrides.servers,
      }}
      provider={{
        providerStatusData: providerStatus,
        isLoading: false,
        ...overrides.provider,
      }}
      conversations={{
        starred: [],
        recent: [],
        loading: false,
        searchQuery: '',
        onSearchChange: handlers.onSearchChange,
        onSelect: handlers.onSelect,
        onToggleStar: handlers.onToggleStar,
        onDelete: handlers.onDelete,
        onNewConversation: handlers.onNewConversation,
        ...overrides.conversations,
      }}
    />,
  );

  return handlers;
}

describe('the reduced side panel', () => {
  it('lists every MCP server as its own switch and reports each toggle', async () => {
    const handlers = renderPanel({
      servers: {
        servers: [
          server({ id: 'filesystem', name: 'Filesystem' }),
          server({ id: 'github', name: 'GitHub', enabled: false }),
        ],
      },
    });

    // A disabled server stays listed rather than disappearing: it is the switch
    // that carries the state, so the user can put it back.
    const filesystem = await screen.findByRole('switch', {
      name: 'Filesystem',
    });
    const github = await screen.findByRole('switch', { name: 'GitHub' });
    expect(filesystem).toBeChecked();
    expect(github).not.toBeChecked();

    await userEvent.click(filesystem);
    expect(handlers.onToggle).toHaveBeenCalledWith('filesystem');

    await userEvent.click(github);
    expect(handlers.onToggle).toHaveBeenLastCalledWith('github');
  });

  it('reports an unavailable server list in place and leaves the rest of the panel usable', async () => {
    const handlers = renderPanel({
      servers: { servers: [], error: new Error('boom') },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The MCP server list is unavailable.',
    );
    // A conversation without MCP tools is still a conversation, so nothing else
    // in the panel is withheld.
    expect(
      await screen.findByRole('searchbox', { name: 'Search conversations' }),
    ).toBeVisible();

    await userEvent.click(await screen.findByRole('button', { name: 'Retry' }));
    expect(handlers.onRetry).toHaveBeenCalled();
  });

  it('shows the provider connection, model and streaming capability, and offers no control to change them', async () => {
    renderPanel();

    const providerSection = await screen.findByRole('region', {
      name: 'Provider',
    });
    expect(await within(providerSection).findByText('Connected')).toBeVisible();
    expect(
      await within(providerSection).findByText('gpt-4o-mini'),
    ).toBeVisible();
    // The single-fragment fallback is exactly what this line distinguishes.
    expect(
      await within(providerSection).findByText('incremental'),
    ).toBeVisible();

    expect(
      within(providerSection).queryByRole('button'),
    ).not.toBeInTheDocument();
    expect(
      within(providerSection).queryByRole('combobox'),
    ).not.toBeInTheDocument();
    expect(
      within(providerSection).queryByRole('textbox'),
    ).not.toBeInTheDocument();
  });

  it('describes a provider without native streaming as a single response', async () => {
    renderPanel({
      provider: {
        providerStatusData: {
          ...providerStatus,
          providers: [
            { ...providerStatus.providers[0], supportsStreaming: false },
          ],
        },
      },
    });

    const providerSection = await screen.findByRole('region', {
      name: 'Provider',
    });
    expect(
      await within(providerSection).findByText('single response'),
    ).toBeVisible();
  });

  it('reports an unreadable provider status without blocking the panel', async () => {
    renderPanel({
      provider: {
        providerStatusData: null,
        error: new Error('status endpoint down'),
      },
    });

    expect(
      await screen.findByText('Provider status is unavailable.'),
    ).toBeVisible();
    expect(await screen.findByText('status endpoint down')).toBeVisible();
    expect(
      await screen.findByRole('searchbox', { name: 'Search conversations' }),
    ).toBeVisible();
  });

  it('groups pinned conversations ahead of the rest, most recently updated first', async () => {
    renderPanel({
      conversations: {
        starred: [
          conversation({
            id: 'pinned-old',
            title: 'Pinned older',
            isStarred: true,
            updatedAt: '2026-02-01T00:00:00Z',
          }),
          conversation({
            id: 'pinned-new',
            title: 'Pinned newer',
            isStarred: true,
            updatedAt: '2026-03-01T00:00:00Z',
          }),
        ],
        recent: [
          conversation({
            id: 'recent-old',
            title: 'Recent older',
            updatedAt: '2026-01-01T00:00:00Z',
          }),
          conversation({
            id: 'recent-new',
            title: 'Recent newer',
            updatedAt: '2026-01-15T00:00:00Z',
          }),
        ],
      },
    });

    const pinnedList = await screen.findByRole('list', {
      name: 'Pinned conversations',
    });
    const recentList = await screen.findByRole('list', {
      name: 'Recent conversations',
    });

    const openLabels = (list: HTMLElement) =>
      within(list)
        .getAllByRole('button', { name: /^(Pinned|Recent) (older|newer)$/ })
        .map(button => button.getAttribute('aria-label'));

    expect(openLabels(pinnedList)).toEqual(['Pinned newer', 'Pinned older']);
    expect(openLabels(recentList)).toEqual(['Recent newer', 'Recent older']);

    // And the pinned group as a whole precedes the unpinned one.
    const following =
      pinnedList.compareDocumentPosition(recentList) &
      Node.DOCUMENT_POSITION_FOLLOWING;
    expect(following).toBeTruthy();
  });

  it('opens, pins and deletes a conversation, starts a fresh one, and says so when an action is rejected', async () => {
    const handlers = renderPanel({
      conversations: {
        recent: [conversation({ id: 'conv-1', title: 'Deploy the service' })],
        onDelete: jest.fn().mockRejectedValue(new Error('nope')),
      },
    });

    await userEvent.click(
      await screen.findByRole('button', { name: 'Deploy the service' }),
    );
    expect(handlers.onSelect).toHaveBeenCalledWith('conv-1');

    const pin = await screen.findByRole('button', {
      name: 'Pin Deploy the service',
    });
    expect(pin).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(pin);
    expect(handlers.onToggleStar).toHaveBeenCalledWith('conv-1');

    await userEvent.click(await screen.findByRole('button', { name: 'New' }));
    expect(handlers.onNewConversation).toHaveBeenCalled();

    // `useConversations` rolls its own optimistic state back on a failure; what
    // it cannot do is tell the user, which is why the panel does.
    await userEvent.click(
      await screen.findByRole('button', { name: 'Delete Deploy the service' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'That conversation could not be deleted.',
    );
  });

  it('reports an empty list without an error and forwards the search text it is given', async () => {
    const handlers = renderPanel();

    expect(
      await screen.findByText('No stored conversations yet.'),
    ).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    fireEvent.change(
      await screen.findByRole('searchbox', { name: 'Search conversations' }),
      { target: { value: 'DEPLOY' } },
    );
    expect(handlers.onSearchChange).toHaveBeenLastCalledWith('DEPLOY');
  });
});
