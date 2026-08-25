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
import { TestApiProvider } from '@backstage/test-utils';
import { mcpChatApiRef } from '../../api';
import type { ChatStreamEvent } from '../../types';
import { PromptPageContent } from './PromptPageContent';

/**
 * A stream the test drives event by event, so the surface can be inspected
 * between two fragments rather than only once the run is over.
 */
function createStream() {
  const queue: ChatStreamEvent[] = [];
  const waiters: Array<() => void> = [];
  let closed = false;
  let failure: unknown;

  const nudge = () => {
    while (waiters.length > 0) {
      (waiters.shift() as () => void)();
    }
  };

  return {
    push(event: ChatStreamEvent) {
      queue.push(event);
      nudge();
    },
    close() {
      closed = true;
      nudge();
    },
    fail(error: unknown) {
      failure = error;
      closed = true;
      nudge();
    },
    iterable: {
      async *[Symbol.asyncIterator]() {
        while (true) {
          while (queue.length > 0) {
            yield queue.shift() as ChatStreamEvent;
          }
          if (failure) {
            throw failure;
          }
          if (closed) {
            return;
          }
          await new Promise<void>(resolve => {
            waiters.push(resolve);
          });
        }
      },
    } as AsyncIterable<ChatStreamEvent>,
  };
}

function renderPromptPage(streamChatMessage: jest.Mock) {
  const mcpChatApi = {
    sendChatMessage: jest.fn(),
    streamChatMessage,
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
  return input as HTMLTextAreaElement;
}

/** Applies stream activity and lets the run loop drain it. */
async function flush(apply: () => void) {
  await act(async () => {
    apply();
  });
}

describe('the prompt page conversation surface', () => {
  it('submits a prompt on Enter, keeps Shift+Enter for a newline, and refuses a blank prompt', async () => {
    const stream = createStream();
    const streamChatMessage = jest.fn().mockReturnValue(stream.iterable);
    renderPromptPage(streamChatMessage);

    const input = await screen.findByRole('textbox', { name: 'Prompt' });

    // A whitespace-only prompt starts nothing.
    await act(async () => {
      fireEvent.change(input, { target: { value: '   ' } });
    });
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    });
    expect(streamChatMessage).not.toHaveBeenCalled();

    // Shift+Enter is a newline, not a submission: the composer keeps its text
    // and no run starts.
    await act(async () => {
      fireEvent.change(input, { target: { value: 'first line' } });
    });
    await act(async () => {
      fireEvent.keyDown(input, {
        key: 'Enter',
        code: 'Enter',
        shiftKey: true,
      });
    });
    expect(streamChatMessage).not.toHaveBeenCalled();
    expect(input).toHaveValue('first line');

    await act(async () => {
      fireEvent.change(input, {
        target: { value: 'first line\nlist my components' },
      });
    });
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    });

    expect(
      await screen.findByText(/first line\s*list my components/),
    ).toBeInTheDocument();
    expect(input).toHaveValue('');
    expect(streamChatMessage).toHaveBeenCalledTimes(1);
    expect(streamChatMessage.mock.calls[0][0]).toEqual([
      { role: 'user', content: 'first line\nlist my components' },
    ]);
  });

  it('grows the assistant turn fragment by fragment while offering a cancel control, then renders the completed markdown', async () => {
    const stream = createStream();
    const streamChatMessage = jest.fn().mockReturnValue(stream.iterable);
    renderPromptPage(streamChatMessage);

    await submitPrompt('list my components');

    // A run is in progress: the page says so and offers a way to cancel, before
    // any fragment has arrived.
    expect(await screen.findByRole('status')).toHaveTextContent(
      'The assistant is working',
    );
    expect(
      await screen.findByRole('button', { name: 'Cancel run' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Send prompt' }),
    ).not.toBeInTheDocument();

    await flush(() => stream.push({ type: 'text', text: '## Components\n\n' }));

    // The markdown is already formatted while the reply is still growing.
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Components' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();

    await flush(() =>
      stream.push({ type: 'text', text: '- **catalog** is ready' }),
    );

    const item = await screen.findByRole('listitem');
    expect(item).toHaveTextContent('catalog is ready');
    expect(item.querySelector('strong')).toHaveTextContent('catalog');
    // Still marked as running between the last fragment and the terminal event.
    expect(screen.getByRole('status')).toBeInTheDocument();

    await flush(() => {
      stream.push({ type: 'complete', toolsUsed: [], conversationId: 'c-1' });
      stream.close();
    });

    // The run indication clears and the composer offers to send again.
    expect(
      await screen.findByRole('button', { name: 'Send prompt' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Cancel run' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Components' }),
    ).toBeInTheDocument();
    // A completed turn carries no interruption notice.
    expect(screen.queryByText(/interrupted/i)).not.toBeInTheDocument();
  });

  it("renders and completes a non-streaming provider's single-fragment reply through the same path", async () => {
    const stream = createStream();
    const streamChatMessage = jest.fn().mockReturnValue(stream.iterable);
    renderPromptPage(streamChatMessage);

    await submitPrompt('how many components do I own?');

    await flush(() => {
      // The base-class fallback delivers the whole reply as one fragment,
      // immediately followed by the terminal event.
      stream.push({
        type: 'text',
        text: 'You own **three** components.',
      });
      stream.push({ type: 'complete', toolsUsed: [] });
      stream.close();
    });

    // The reply is a single paragraph split across a bold run, so the assertion
    // reads the paragraph's whole text rather than one of its text nodes.
    const reply = await screen.findByText(/You own/);
    expect(reply).toHaveTextContent('You own three components.');
    expect(reply.querySelector('strong')).toHaveTextContent('three');
    expect(
      await screen.findByRole('button', { name: 'Send prompt' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText(/interrupted/i)).not.toBeInTheDocument();
  });

  it('surfaces a provider failure as an error outside the conversation and retries into an answer', async () => {
    const failing = createStream();
    const succeeding = createStream();
    const streamChatMessage = jest
      .fn()
      .mockReturnValueOnce(failing.iterable)
      .mockReturnValueOnce(succeeding.iterable);
    renderPromptPage(streamChatMessage);

    await submitPrompt('list my components');

    await flush(() => {
      failing.push({ type: 'error', message: 'model quota exceeded' });
      failing.close();
    });

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('The chat provider could not answer.');
    expect(alert).toHaveTextContent('model quota exceeded');
    // The failure is not assistant content and the page is not stuck running.
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: 'Send prompt' }),
    ).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    });

    await flush(() => {
      succeeding.push({ type: 'text', text: 'Two components.' });
      succeeding.push({ type: 'complete', toolsUsed: [] });
      succeeding.close();
    });

    expect(await screen.findByText('Two components.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('list my components')).toBeInTheDocument();
    expect(streamChatMessage).toHaveBeenCalledTimes(2);
  });

  it('reports an unreachable backend and keeps partial text marked interrupted when a run fails after output', async () => {
    const unreachable = createStream();
    const interrupted = createStream();
    const streamChatMessage = jest
      .fn()
      .mockReturnValueOnce(unreachable.iterable)
      .mockReturnValueOnce(interrupted.iterable);
    renderPromptPage(streamChatMessage);

    await submitPrompt('list my components');

    await flush(() => unreachable.fail(new Error('Failed to fetch')));

    const transportAlert = await screen.findByRole('alert');
    expect(transportAlert).toHaveTextContent(
      'The chat service is unavailable.',
    );
    expect(transportAlert).toHaveTextContent('Failed to fetch');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    // Retry, this time failing only after some text has been rendered.
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    });

    await flush(() =>
      interrupted.push({ type: 'text', text: 'Reading the catalog' }),
    );
    expect(await screen.findByText('Reading the catalog')).toBeInTheDocument();

    await flush(() => {
      interrupted.push({ type: 'error', message: 'upstream timeout' });
      interrupted.close();
    });

    // The partial text survives, marked as interrupted rather than passed off
    // as a finished answer, and the failure is reported next to it.
    expect(
      await screen.findByText(/interrupted and is incomplete/),
    ).toBeInTheDocument();
    expect(screen.getByText('Reading the catalog')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('upstream timeout');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('clears the run indication and drops the partial turn when the run is cancelled', async () => {
    const stream = createStream();
    const streamChatMessage = jest.fn().mockReturnValue(stream.iterable);
    renderPromptPage(streamChatMessage);

    await submitPrompt('list my components');

    await flush(() => stream.push({ type: 'text', text: 'Reading the' }));
    expect(await screen.findByText('Reading the')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel run' }));
    });

    // No partial turn is left behind marked running, and the composer accepts a
    // prompt again.
    expect(
      await screen.findByRole('button', { name: 'Send prompt' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText('Reading the')).not.toBeInTheDocument();
    expect(screen.getByText('list my components')).toBeInTheDocument();
  });
});
