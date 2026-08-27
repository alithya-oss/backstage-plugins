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
import { identityApiRef } from '@backstage/frontend-plugin-api';
import { mcpChatApiRef } from '../../api';
import type { ChatStreamEvent } from '../../types';
import { PromptPageContent } from './PromptPageContent';

/** A stream the test drives event by event. */
function createStream() {
  const queue: ChatStreamEvent[] = [];
  const waiters: Array<() => void> = [];
  let closed = false;

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
    iterable: {
      async *[Symbol.asyncIterator]() {
        while (true) {
          while (queue.length > 0) {
            yield queue.shift() as ChatStreamEvent;
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
    getMCPServerStatus: jest.fn().mockResolvedValue({ servers: [] }),
    getAvailableTools: jest.fn(),
    getProviderStatus: jest.fn().mockResolvedValue({
      providers: [],
      summary: { totalProviders: 0, healthyProviders: 0 },
      timestamp: '2026-01-01T00:00:00Z',
    }),
    getConversations: jest.fn().mockResolvedValue({ conversations: [] }),
    getConversationById: jest.fn(),
    deleteConversation: jest.fn(),
    toggleConversationStar: jest.fn(),
  };

  const identityApi = {
    getBackstageIdentity: jest.fn().mockResolvedValue({
      type: 'user',
      userEntityRef: 'user:default/tester',
      ownershipEntityRefs: ['user:default/tester'],
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

/** Types into the given composer and submits with Enter. */
async function submit(name: string, text: string) {
  const input = await screen.findByRole('textbox', { name });
  await act(async () => {
    fireEvent.change(input, { target: { value: text } });
  });
  await act(async () => {
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
  });
}

/** Answers the run in flight with one fragment and a terminal event. */
async function answer(stream: ReturnType<typeof createStream>, text: string) {
  await act(async () => {
    stream.push({ type: 'text', text });
    stream.push({ type: 'complete', toolsUsed: [] });
    stream.close();
  });
}

async function click(name: string) {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name }));
  });
}

describe('revising and regenerating on the prompt page', () => {
  it('regenerates without discarding the previous answer and moves between the two', async () => {
    const first = createStream();
    const second = createStream();
    const streamChatMessage = jest
      .fn()
      .mockReturnValueOnce(first.iterable)
      .mockReturnValueOnce(second.iterable);
    renderPromptPage(streamChatMessage);

    await submit('Prompt', 'name three tools');
    await answer(first, 'The first answer.');
    expect(await screen.findByText('The first answer.')).toBeInTheDocument();
    // One answer, so nothing to move between yet.
    expect(
      screen.queryByRole('button', { name: 'Next answer' }),
    ).not.toBeInTheDocument();

    await click('Regenerate answer');
    await answer(second, 'The second answer.');

    // Both answers exist: the new one is shown, the picker says which, and the
    // prompt above is untouched.
    expect(await screen.findByText('The second answer.')).toBeInTheDocument();
    expect(await screen.findByText(/Answer\s*2\s*of\s*2/)).toBeInTheDocument();
    expect(screen.getByText('name three tools')).toBeInTheDocument();
    expect(screen.queryByText('The first answer.')).not.toBeInTheDocument();
    // The regeneration re-ran the same prompt, not the prompt plus its answer.
    expect(streamChatMessage.mock.calls[1][0]).toEqual([
      { role: 'user', content: 'name three tools' },
    ]);

    await click('Previous answer');

    // The shown answer changed and the conversation above it did not.
    expect(await screen.findByText('The first answer.')).toBeInTheDocument();
    expect(screen.queryByText('The second answer.')).not.toBeInTheDocument();
    expect(await screen.findByText(/Answer\s*1\s*of\s*2/)).toBeInTheDocument();
    expect(screen.getByText('name three tools')).toBeInTheDocument();

    await click('Next answer');
    expect(await screen.findByText('The second answer.')).toBeInTheDocument();
  });

  it('warns what an edit will discard before it applies, then re-runs from the edited prompt', async () => {
    const first = createStream();
    const second = createStream();
    const edited = createStream();
    const streamChatMessage = jest
      .fn()
      .mockReturnValueOnce(first.iterable)
      .mockReturnValueOnce(second.iterable)
      .mockReturnValueOnce(edited.iterable);
    renderPromptPage(streamChatMessage);

    await submit('Prompt', 'first question');
    await answer(first, 'First reply.');
    await submit('Prompt', 'second question');
    await answer(second, 'Second reply.');

    const editButtons = await screen.findAllByRole('button', {
      name: 'Edit prompt',
    });
    expect(editButtons).toHaveLength(2);

    // Editing the latest prompt loses only its own answer, and the warning says
    // so rather than being shown unconditionally.
    await act(async () => {
      fireEvent.click(editButtons[1]);
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'discards the 1 message that follow',
    );
    await click('Cancel');

    // Editing the earlier prompt loses the three turns after it, and the count
    // is spelled out before the edit is saved.
    await act(async () => {
      fireEvent.click(
        screen.getAllByRole('button', { name: 'Edit prompt' })[0],
      );
    });
    const warning = await screen.findByRole('alert');
    expect(warning).toHaveTextContent(
      'Saving re-runs this prompt and discards the 3 messages that follow it.',
    );
    // Nothing is lost yet: the later turns are still on screen.
    expect(screen.getByText('Second reply.')).toBeInTheDocument();
    expect(screen.getByText('second question')).toBeInTheDocument();

    await submit('Edit prompt', 'corrected question');
    await answer(edited, 'Reply to the correction.');

    // Now the truncation applied: the edited prompt and its new answer are all
    // that remain.
    expect(
      await screen.findByText('Reply to the correction.'),
    ).toBeInTheDocument();
    expect(screen.getByText('corrected question')).toBeInTheDocument();
    expect(screen.queryByText('second question')).not.toBeInTheDocument();
    expect(screen.queryByText('Second reply.')).not.toBeInTheDocument();
    expect(screen.queryByText('First reply.')).not.toBeInTheDocument();
    expect(streamChatMessage.mock.calls[2][0]).toEqual([
      { role: 'user', content: 'corrected question' },
    ]);
  });

  it('abandons the alternatives when the conversation continues past them', async () => {
    const first = createStream();
    const second = createStream();
    const third = createStream();
    const streamChatMessage = jest
      .fn()
      .mockReturnValueOnce(first.iterable)
      .mockReturnValueOnce(second.iterable)
      .mockReturnValueOnce(third.iterable);
    renderPromptPage(streamChatMessage);

    await submit('Prompt', 'name three tools');
    await answer(first, 'The first answer.');
    await click('Regenerate answer');
    await answer(second, 'The second answer.');
    expect(await screen.findByText(/Answer\s*2\s*of\s*2/)).toBeInTheDocument();

    await submit('Prompt', 'and the fourth?');
    await answer(third, 'The fourth one.');

    // The tail moved on: the earlier alternatives are gone and the picker has
    // nothing left to offer.
    expect(await screen.findByText('The fourth one.')).toBeInTheDocument();
    expect(screen.queryByText(/Answer\s*\d\s*of\s*\d/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Previous answer' }),
    ).not.toBeInTheDocument();
    // The answer that was shown is the one the conversation continued from, so
    // it is the one the backend stored.
    expect(streamChatMessage.mock.calls[2][0]).toEqual([
      { role: 'user', content: 'name three tools' },
      { role: 'assistant', content: 'The second answer.' },
      { role: 'user', content: 'and the fourth?' },
    ]);
  });
});
