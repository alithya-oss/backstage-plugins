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

import { FC, ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { TestApiProvider } from '@backstage/test-utils';
import type { AppendMessage } from '@assistant-ui/react';
import { mcpChatApiRef } from '../../api';
import type { ChatStreamEvent } from '../../types';
import { usePromptThread, toPromptTurns } from './usePromptThread';

/**
 * A stream the test drives event by event, so a turn can be inspected between
 * two fragments rather than only after the run.
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

  const waitForActivity = () =>
    new Promise<void>(resolve => {
      waiters.push(resolve);
    });

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
          await waitForActivity();
        }
      },
    } as AsyncIterable<ChatStreamEvent>,
  };
}

function appendMessage(
  text: string,
  overrides: Partial<AppendMessage> = {},
): AppendMessage {
  return {
    role: 'user',
    content: [{ type: 'text', text }],
    parentId: null,
    sourceId: null,
    runConfig: undefined,
    ...overrides,
  } as AppendMessage;
}

function createApi(streamChatMessage: jest.Mock) {
  return {
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
}

function renderPromptThread(streamChatMessage: jest.Mock) {
  const api = createApi(streamChatMessage);
  const wrapper: FC<{ children: ReactNode }> = ({ children }) => (
    <TestApiProvider apis={[[mcpChatApiRef, api]]}>{children}</TestApiProvider>
  );
  const rendered = renderHook(
    () => usePromptThread({ enabledServerIds: ['catalog'] }),
    { wrapper },
  );
  return { ...rendered, api };
}

describe('usePromptThread', () => {
  it('appends a submitted prompt and starts a run carrying the conversation and enabled servers', async () => {
    const stream = createStream();
    const streamChatMessage = jest.fn().mockReturnValue(stream.iterable);
    const { result } = renderPromptThread(streamChatMessage);

    let run: Promise<void> = Promise.resolve();
    await act(async () => {
      run = result.current.adapter.onNew(appendMessage('list my components'));
    });

    expect(result.current.turns.map(turn => turn.role)).toEqual([
      'user',
      'assistant',
    ]);
    expect(result.current.turns[0].text).toBe('list my components');
    expect(result.current.isRunning).toBe(true);
    expect(streamChatMessage).toHaveBeenCalledTimes(1);

    const [messages, enabledTools, signal, conversationId] =
      streamChatMessage.mock.calls[0];
    expect(messages).toEqual([{ role: 'user', content: 'list my components' }]);
    expect(enabledTools).toEqual(['catalog']);
    expect(signal.aborted).toBe(false);
    expect(conversationId).toBeUndefined();

    await act(async () => {
      stream.push({ type: 'complete', toolsUsed: [] });
      stream.close();
      await run;
    });
  });

  it('rejects a blank prompt without appending a turn or starting a run', async () => {
    const streamChatMessage = jest.fn();
    const { result } = renderPromptThread(streamChatMessage);

    await act(async () => {
      await result.current.adapter.onNew(appendMessage('   \n  '));
    });

    expect(result.current.turns).toEqual([]);
    expect(result.current.isRunning).toBe(false);
    expect(streamChatMessage).not.toHaveBeenCalled();
  });

  it('grows the assistant turn fragment by fragment, then completes it', async () => {
    const stream = createStream();
    const streamChatMessage = jest.fn().mockReturnValue(stream.iterable);
    const { result } = renderPromptThread(streamChatMessage);

    let run: Promise<void> = Promise.resolve();
    await act(async () => {
      run = result.current.adapter.onNew(appendMessage('hello'));
    });

    await act(async () => {
      stream.push({ type: 'text', text: 'Look' });
    });
    expect(result.current.turns[1].text).toBe('Look');
    expect(result.current.turns[1].status).toEqual({ type: 'running' });

    await act(async () => {
      stream.push({ type: 'text', text: 'ing up' });
    });
    expect(result.current.turns[1].text).toBe('Looking up');
    expect(result.current.turns[1].status).toEqual({ type: 'running' });

    await act(async () => {
      stream.push({
        type: 'complete',
        conversationId: 'conv-1',
        toolsUsed: [],
      });
      stream.close();
      await run;
    });

    expect(result.current.turns[1].text).toBe('Looking up');
    expect(result.current.turns[1].status).toEqual({ type: 'complete' });
    expect(result.current.isRunning).toBe(false);
    expect(result.current.conversationId).toBe('conv-1');
    expect(result.current.error).toBeUndefined();
  });

  it('renders a single-fragment reply from a non-streaming provider normally', async () => {
    const stream = createStream();
    const streamChatMessage = jest.fn().mockReturnValue(stream.iterable);
    const { result } = renderPromptThread(streamChatMessage);

    let run: Promise<void> = Promise.resolve();
    await act(async () => {
      run = result.current.adapter.onNew(appendMessage('hello'));
    });
    await act(async () => {
      stream.push({ type: 'text', text: 'The whole reply at once.' });
      stream.push({ type: 'complete', toolsUsed: [] });
      stream.close();
      await run;
    });

    expect(result.current.turns[1].text).toBe('The whole reply at once.');
    expect(result.current.turns[1].status).toEqual({ type: 'complete' });
    expect(result.current.isRunning).toBe(false);
  });

  it('shows an invocation before its result arrives, then fills it in place', async () => {
    const stream = createStream();
    const streamChatMessage = jest.fn().mockReturnValue(stream.iterable);
    const { result } = renderPromptThread(streamChatMessage);

    let run: Promise<void> = Promise.resolve();
    await act(async () => {
      run = result.current.adapter.onNew(appendMessage('list my components'));
    });

    await act(async () => {
      stream.push({
        type: 'tool-call',
        id: 'call-1',
        name: 'list-components',
        arguments: { owner: 'team-a' },
        serverId: 'catalog',
      });
    });

    expect(result.current.turns[1].invocations).toEqual([
      {
        id: 'call-1',
        name: 'list-components',
        arguments: { owner: 'team-a' },
        serverId: 'catalog',
      },
    ]);

    await act(async () => {
      stream.push({
        type: 'tool-result',
        id: 'call-1',
        result: 'component-a',
        isError: false,
      });
    });

    // Filled in place: still one invocation, now carrying its outcome.
    expect(result.current.turns[1].invocations).toEqual([
      {
        id: 'call-1',
        name: 'list-components',
        arguments: { owner: 'team-a' },
        serverId: 'catalog',
        result: 'component-a',
        isError: false,
      },
    ]);

    await act(async () => {
      stream.push({ type: 'complete', toolsUsed: ['list-components'] });
      stream.close();
      await run;
    });
  });

  it('abandons the run on cancel, leaving no partial turn and no running turn', async () => {
    const stream = createStream();
    const streamChatMessage = jest.fn().mockReturnValue(stream.iterable);
    const { result } = renderPromptThread(streamChatMessage);

    let run: Promise<void> = Promise.resolve();
    await act(async () => {
      run = result.current.adapter.onNew(appendMessage('long question'));
    });
    await act(async () => {
      stream.push({ type: 'text', text: 'Starting to ans' });
    });

    const signal = streamChatMessage.mock.calls[0][2];

    await act(async () => {
      await result.current.adapter.onCancel!();
      stream.fail(Object.assign(new Error('aborted'), { name: 'AbortError' }));
      await run;
    });

    expect(signal.aborted).toBe(true);
    expect(result.current.isRunning).toBe(false);
    expect(
      result.current.turns.some(turn => turn.status?.type === 'running'),
    ).toBe(false);
    // The partial assistant turn is gone; the user's prompt stays.
    expect(result.current.turns.map(turn => turn.role)).toEqual(['user']);

    // And the conversation accepts a new prompt right away.
    const second = createStream();
    streamChatMessage.mockReturnValue(second.iterable);
    let secondRun: Promise<void> = Promise.resolve();
    await act(async () => {
      secondRun = result.current.adapter.onNew(appendMessage('shorter one'));
    });
    expect(streamChatMessage).toHaveBeenCalledTimes(2);

    await act(async () => {
      second.push({ type: 'complete', toolsUsed: [] });
      second.close();
      await secondRun;
    });
  });

  it('does not interleave a second run against the same conversation', async () => {
    const stream = createStream();
    const streamChatMessage = jest.fn().mockReturnValue(stream.iterable);
    const { result } = renderPromptThread(streamChatMessage);

    let run: Promise<void> = Promise.resolve();
    await act(async () => {
      run = result.current.adapter.onNew(appendMessage('first prompt'));
    });

    await act(async () => {
      await result.current.adapter.onNew(appendMessage('second prompt'));
    });

    expect(streamChatMessage).toHaveBeenCalledTimes(1);
    expect(result.current.turns.map(turn => turn.text)).toEqual([
      'first prompt',
      '',
    ]);

    await act(async () => {
      stream.push({ type: 'complete', toolsUsed: [] });
      stream.close();
      await run;
    });
  });

  it('routes a provider failure to error state, keeping any partial text', async () => {
    const stream = createStream();
    const streamChatMessage = jest.fn().mockReturnValue(stream.iterable);
    const { result } = renderPromptThread(streamChatMessage);

    let run: Promise<void> = Promise.resolve();
    await act(async () => {
      run = result.current.adapter.onNew(appendMessage('hello'));
    });
    await act(async () => {
      stream.push({ type: 'text', text: 'Half an answ' });
      stream.push({ type: 'error', message: 'provider rejected the request' });
      stream.close();
      await run;
    });

    expect(result.current.error).toEqual({
      kind: 'provider',
      message: 'provider rejected the request',
    });
    // The partial text survives, marked interrupted rather than complete.
    expect(result.current.turns[1].text).toBe('Half an answ');
    expect(result.current.turns[1].status).toEqual({
      type: 'error',
      message: 'provider rejected the request',
    });
    expect(result.current.isRunning).toBe(false);
  });

  it('reports an unreachable backend as a transport failure', async () => {
    const streamChatMessage = jest.fn().mockImplementation(() => {
      throw new Error('Request failed with status 404 Not Found');
    });
    const { result } = renderPromptThread(streamChatMessage);

    await act(async () => {
      await result.current.adapter.onNew(appendMessage('hello'));
    });

    expect(result.current.error).toEqual({
      kind: 'transport',
      message:
        'The chat service is unavailable: Request failed with status 404 Not Found',
    });
    expect(result.current.turns[1].status?.type).toBe('error');
    expect(result.current.isRunning).toBe(false);
  });

  it('reports a stream that ends without its terminal event', async () => {
    const stream = createStream();
    const streamChatMessage = jest.fn().mockReturnValue(stream.iterable);
    const { result } = renderPromptThread(streamChatMessage);

    let run: Promise<void> = Promise.resolve();
    await act(async () => {
      run = result.current.adapter.onNew(appendMessage('hello'));
    });
    await act(async () => {
      stream.push({ type: 'text', text: 'Cut off' });
      stream.close();
      await run;
    });

    expect(result.current.error).toEqual({
      kind: 'provider',
      message: 'The chat run ended before it completed.',
    });
    expect(result.current.turns[1].text).toBe('Cut off');
  });

  it('replaces the failed turn when a retry succeeds', async () => {
    const failing = createStream();
    const streamChatMessage = jest.fn().mockReturnValue(failing.iterable);
    const { result } = renderPromptThread(streamChatMessage);

    let run: Promise<void> = Promise.resolve();
    await act(async () => {
      run = result.current.adapter.onNew(appendMessage('hello'));
    });
    await act(async () => {
      failing.push({ type: 'error', message: 'provider is down' });
      failing.close();
      await run;
    });
    expect(result.current.error?.kind).toBe('provider');

    const succeeding = createStream();
    streamChatMessage.mockReturnValue(succeeding.iterable);
    let retryRun: Promise<void> = Promise.resolve();
    await act(async () => {
      retryRun = result.current.retry();
    });
    await act(async () => {
      succeeding.push({ type: 'text', text: 'Second time lucky' });
      succeeding.push({
        type: 'complete',
        conversationId: 'conv-2',
        toolsUsed: [],
      });
      succeeding.close();
      await retryRun;
    });

    expect(result.current.error).toBeUndefined();
    // One user turn and one assistant turn: the failed turn was replaced, not
    // left beside the new one.
    expect(result.current.turns).toHaveLength(2);
    expect(result.current.turns[1].text).toBe('Second time lucky');
    expect(result.current.turns[1].status).toEqual({ type: 'complete' });
    expect(streamChatMessage.mock.calls[1][0]).toEqual([
      { role: 'user', content: 'hello' },
    ]);
  });

  it('truncates to the edited turn on edit and regenerates from a parent on reload', async () => {
    const first = createStream();
    const streamChatMessage = jest.fn().mockReturnValue(first.iterable);
    const { result } = renderPromptThread(streamChatMessage);

    let run: Promise<void> = Promise.resolve();
    await act(async () => {
      run = result.current.adapter.onNew(appendMessage('original prompt'));
    });
    await act(async () => {
      first.push({ type: 'text', text: 'first answer' });
      first.push({ type: 'complete', conversationId: 'conv-1', toolsUsed: [] });
      first.close();
      await run;
    });

    const userTurnId = result.current.turns[0].id;

    const edited = createStream();
    streamChatMessage.mockReturnValue(edited.iterable);
    let editRun: Promise<void> = Promise.resolve();
    await act(async () => {
      editRun = result.current.adapter.onEdit!(
        appendMessage('edited prompt', { sourceId: userTurnId }),
      );
    });

    // The edited turn replaces the original and its answer.
    expect(result.current.turns.map(turn => turn.text)).toEqual([
      'edited prompt',
      '',
    ]);
    expect(streamChatMessage.mock.calls[1][0]).toEqual([
      { role: 'user', content: 'edited prompt' },
    ]);
    // The active conversation id rides along on the follow-up run.
    expect(streamChatMessage.mock.calls[1][3]).toBe('conv-1');

    await act(async () => {
      edited.push({ type: 'complete', toolsUsed: [] });
      edited.close();
      await editRun;
    });

    const reloadParentId = result.current.turns[0].id;
    const reloaded = createStream();
    streamChatMessage.mockReturnValue(reloaded.iterable);
    let reloadRun: Promise<void> = Promise.resolve();
    await act(async () => {
      reloadRun = result.current.adapter.onReload!(reloadParentId, {} as any);
    });

    expect(streamChatMessage.mock.calls[2][0]).toEqual([
      { role: 'user', content: 'edited prompt' },
    ]);

    await act(async () => {
      reloaded.push({ type: 'complete', toolsUsed: [] });
      reloaded.close();
      await reloadRun;
    });
  });

  it('accepts a stored conversation and clears it for a new one', async () => {
    const streamChatMessage = jest.fn();
    const { result } = renderPromptThread(streamChatMessage);

    const stored = toPromptTurns([
      { role: 'user', content: 'stored question' },
      { role: 'assistant', content: 'stored answer' },
    ]);

    act(() => {
      result.current.setConversation(stored, 'conv-9');
    });

    expect(result.current.turns).toEqual([
      { id: 'stored-0', role: 'user', text: 'stored question' },
      {
        id: 'stored-1',
        role: 'assistant',
        text: 'stored answer',
        status: { type: 'complete' },
      },
    ]);
    expect(result.current.conversationId).toBe('conv-9');

    act(() => {
      result.current.startNewConversation();
    });

    expect(result.current.turns).toEqual([]);
    expect(result.current.conversationId).toBeUndefined();
  });

  it('lets the runtime rewrite the list through setMessages', () => {
    const streamChatMessage = jest.fn();
    const { result } = renderPromptThread(streamChatMessage);

    act(() => {
      result.current.adapter.setMessages!([
        { id: 'a', role: 'user', text: 'kept' },
      ]);
    });

    expect(result.current.turns).toEqual([
      { id: 'a', role: 'user', text: 'kept' },
    ]);
  });

  it('exposes exactly the handler set the design fixes', () => {
    const streamChatMessage = jest.fn();
    const { result } = renderPromptThread(streamChatMessage);

    expect(Object.keys(result.current.adapter).sort()).toEqual([
      'convertMessage',
      'isLoading',
      'isRunning',
      'messages',
      'onCancel',
      'onEdit',
      'onNew',
      'onReload',
      'setMessages',
    ]);
    // Tools run server-side: no client-side tool pipeline, no thread list slot.
    expect(result.current.adapter.onAddToolResult).toBeUndefined();
    expect(
      result.current.adapter.unstable_enableToolInvocations,
    ).toBeUndefined();
    expect(result.current.adapter.adapters).toBeUndefined();
  });
});
