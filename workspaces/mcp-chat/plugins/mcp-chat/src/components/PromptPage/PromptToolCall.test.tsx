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

import { useMemo } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
} from '@assistant-ui/react';
import type { ExternalStoreAdapter } from '@assistant-ui/react';
import { convertMessage } from './convertMessage';
import { PromptThread } from './PromptThread';
import type { PromptToolInvocation, PromptTurn } from './promptThreadTypes';

/**
 * The real conversation surface over a conversation the test controls.
 *
 * The tool rendering is exercised through the runtime and
 * `MessagePrimitive.Parts`, so what is asserted is what the registered
 * `tools.Fallback` slot actually produces — not a component rendered in
 * isolation. Handing a new turn list in re-renders the surface exactly as a
 * stream event does, which is how an invocation is observed before and after its
 * result exists.
 */
const Surface = ({ turns }: { turns: PromptTurn[] }) => {
  const adapter = useMemo<ExternalStoreAdapter<PromptTurn>>(
    () => ({
      messages: turns,
      convertMessage,
      isRunning: false,
      onNew: async () => {},
    }),
    [turns],
  );
  const runtime = useExternalStoreRuntime(adapter);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <PromptThread onRetry={() => {}} />
    </AssistantRuntimeProvider>
  );
};

const listInvocation: PromptToolInvocation = {
  id: 'call-1',
  name: 'catalog_list',
  arguments: { kind: 'Component', limit: 20 },
  serverId: 'catalog',
};

const getInvocation: PromptToolInvocation = {
  id: 'call-2',
  name: 'catalog_get',
  arguments: { name: 'backstage' },
  serverId: 'catalog',
};

function conversation(
  invocations: PromptToolInvocation[],
  status: PromptTurn['status'] = { type: 'complete' },
): PromptTurn[] {
  return [
    { id: 'turn-1', role: 'user', text: 'list my components' },
    {
      id: 'turn-2',
      role: 'assistant',
      text: 'Here is what I found.',
      invocations,
      status,
    },
  ];
}

/** The collapsed header of one invocation, matched on its tool name. */
const headerOf = (toolName: string) =>
  screen.findByRole('button', { name: new RegExp(`^${toolName}`) });

describe('the MCP tool call rendering', () => {
  it('lists every invocation of a turn collapsed, and expands each one independently', async () => {
    render(
      <Surface
        turns={conversation([
          { ...listInvocation, result: '12 components' },
          { ...getInvocation, result: 'component backstage' },
        ])}
      />,
    );

    const first = await headerOf('catalog_list');
    const second = await headerOf('catalog_get');

    // Both invocations are listed on the turn, and both start collapsed.
    expect(first).toHaveAttribute('aria-expanded', 'false');
    expect(second).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.queryByRole('heading', { name: 'Arguments' }),
    ).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(first);
    });

    // Expanding one reveals its arguments and its result, and leaves the other
    // collapsed — one expansion per invocation, not one for the turn.
    expect(first).toHaveAttribute('aria-expanded', 'true');
    expect(second).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getAllByRole('heading', { name: 'Arguments' })).toHaveLength(
      1,
    );
    expect(await screen.findByText(/"kind": "Component"/)).toBeInTheDocument();
    expect(screen.getByText('12 components')).toBeInTheDocument();
    expect(screen.queryByText('component backstage')).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(second);
    });

    expect(first).toHaveAttribute('aria-expanded', 'true');
    expect(second).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('heading', { name: 'Arguments' })).toHaveLength(
      2,
    );
    expect(await screen.findByText('component backstage')).toBeInTheDocument();
  });

  it('shows an invocation as running before its result exists, then resolves it in place', async () => {
    const { rerender } = render(
      <Surface turns={conversation([listInvocation], { type: 'running' })} />,
    );

    const header = await headerOf('catalog_list');
    expect(header).toHaveTextContent('Running');
    expect(header).toHaveTextContent('catalog_list');

    await act(async () => {
      fireEvent.click(header);
    });

    // The name and the arguments are readable while the tool is still working;
    // only the outcome is missing.
    expect(await screen.findByText(/"limit": 20/)).toBeInTheDocument();
    expect(
      screen.getByText(/Waiting for this tool to return its result/),
    ).toBeInTheDocument();

    rerender(
      <Surface
        turns={conversation([{ ...listInvocation, result: '12 components' }])}
      />,
    );

    // The same invocation gains its result: it stops being marked running and
    // is not listed a second time.
    expect(await screen.findByText('12 components')).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: /^catalog_list/ }),
    ).toHaveLength(1);
    expect(
      screen.getByRole('button', { name: /^catalog_list/ }),
    ).not.toHaveTextContent('Running');
    expect(
      screen.queryByText(/Waiting for this tool to return its result/),
    ).not.toBeInTheDocument();
  });

  it('copies an expanded result to the clipboard and acknowledges it', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    render(
      <Surface
        turns={conversation([{ ...listInvocation, result: '12 components' }])}
      />,
    );

    await act(async () => {
      fireEvent.click(await headerOf('catalog_list'));
    });

    await act(async () => {
      fireEvent.click(
        await screen.findByRole('button', {
          name: 'Copy the catalog_list result',
        }),
      );
    });

    expect(writeText).toHaveBeenCalledWith('12 components');
    expect(await screen.findByText('Copied to the clipboard')).toBeVisible();
  });

  it('tells a failed invocation apart and exposes its error detail on expansion', async () => {
    render(
      <Surface
        turns={conversation([
          {
            ...listInvocation,
            result: 'the catalog server refused the request',
            isError: true,
          },
        ])}
      />,
    );

    const header = await headerOf('catalog_list');
    expect(header).toHaveTextContent('Failed');
    // The failure is carried by the container's state, which is what the styling
    // keys on, so it reads as failed rather than only being labelled so.
    expect(header.parentElement).toHaveAttribute('data-state', 'failed');

    await act(async () => {
      fireEvent.click(header);
    });

    expect(
      await screen.findByRole('heading', { name: 'Error' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('the catalog server refused the request'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Result' }),
    ).not.toBeInTheDocument();
  });

  it('renders no tool-call section on a reply that invoked nothing', async () => {
    render(<Surface turns={conversation([])} />);

    expect(
      await screen.findByText('Here is what I found.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Arguments' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Result' }),
    ).not.toBeInTheDocument();
    // No invocation header: the only buttons are the composer's send control
    // and the per-turn edit and regenerate actions.
    expect(
      screen.getByRole('button', { name: 'Send prompt' }),
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole('button')
        .map(button => button.getAttribute('aria-label')),
    ).toEqual(['Edit prompt', 'Regenerate answer', 'Send prompt']);
  });
});
