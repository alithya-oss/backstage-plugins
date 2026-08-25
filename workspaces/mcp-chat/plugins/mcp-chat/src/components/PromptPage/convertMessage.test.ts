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

import { convertMessage } from './convertMessage';
import type { PromptTurn } from './promptThreadTypes';

describe('convertMessage', () => {
  it('converts a user turn to a single text part with no status', () => {
    const converted = convertMessage({
      id: 'turn-1',
      role: 'user',
      text: 'list my components',
    });

    expect(converted).toEqual({
      role: 'user',
      id: 'turn-1',
      content: [{ type: 'text', text: 'list my components' }],
    });
    expect(converted.status).toBeUndefined();
  });

  it('maps every turn lifecycle onto the runtime message status', () => {
    const base: PromptTurn = {
      id: 'turn-2',
      role: 'assistant',
      text: 'Partial',
    };

    expect(
      convertMessage({ ...base, status: { type: 'running' } }).status,
    ).toEqual({ type: 'running' });
    expect(
      convertMessage({ ...base, status: { type: 'complete' } }).status,
    ).toEqual({ type: 'complete', reason: 'stop' });
    expect(
      convertMessage({ ...base, status: { type: 'cancelled' } }).status,
    ).toEqual({ type: 'incomplete', reason: 'cancelled' });
    expect(
      convertMessage({
        ...base,
        status: { type: 'error', message: 'provider rejected the request' },
      }).status,
    ).toEqual({
      type: 'incomplete',
      reason: 'error',
      error: 'provider rejected the request',
    });
  });

  it('keeps partial text on an interrupted turn rather than dropping it', () => {
    const converted = convertMessage({
      id: 'turn-3',
      role: 'assistant',
      text: 'Half an answ',
      status: { type: 'error', message: 'upstream timeout' },
    });

    expect(converted.content).toEqual([{ type: 'text', text: 'Half an answ' }]);
    expect(converted.status).toEqual({
      type: 'incomplete',
      reason: 'error',
      error: 'upstream timeout',
    });
  });

  it('renders a running invocation without a result, then fills it in place', () => {
    const running = convertMessage({
      id: 'turn-4',
      role: 'assistant',
      text: '',
      status: { type: 'running' },
      invocations: [
        {
          id: 'call-1',
          name: 'list-components',
          arguments: { owner: 'team-a' },
          serverId: 'catalog',
        },
      ],
    });

    const toolCall = (running.content as any[])[0];
    expect(toolCall).toEqual({
      type: 'tool-call',
      toolCallId: 'call-1',
      toolName: 'list-components',
      args: { owner: 'team-a' },
    });
    expect('result' in toolCall).toBe(false);
    expect('isError' in toolCall).toBe(false);

    const resolved = convertMessage({
      id: 'turn-4',
      role: 'assistant',
      text: 'Here they are',
      status: { type: 'complete' },
      invocations: [
        {
          id: 'call-1',
          name: 'list-components',
          arguments: { owner: 'team-a' },
          serverId: 'catalog',
          result: 'component-a, component-b',
          isError: false,
        },
      ],
    });

    // The same invocation resolves in place: still one tool-call part, keyed by
    // the same id, followed by the accumulated text.
    expect(resolved.content).toEqual([
      {
        type: 'tool-call',
        toolCallId: 'call-1',
        toolName: 'list-components',
        args: { owner: 'team-a' },
        result: 'component-a, component-b',
        isError: false,
      },
      { type: 'text', text: 'Here they are' },
    ]);
  });

  it('reads isError from the tool result and keeps invocation order', () => {
    const converted = convertMessage({
      id: 'turn-5',
      role: 'assistant',
      text: 'Two tools ran',
      status: { type: 'complete' },
      invocations: [
        {
          id: 'call-1',
          name: 'first',
          arguments: {},
          serverId: 'catalog',
          result: 'ok',
          isError: false,
        },
        {
          id: 'call-2',
          name: 'second',
          arguments: {},
          serverId: 'catalog',
          result: 'tool timed out',
          isError: true,
        },
      ],
    });

    const parts = converted.content as any[];
    expect(parts.map(part => part.toolCallId ?? part.type)).toEqual([
      'call-1',
      'call-2',
      'text',
    ]);
    expect(parts[0].isError).toBe(false);
    expect(parts[1].isError).toBe(true);
    expect(parts[1].result).toBe('tool timed out');
  });
});
