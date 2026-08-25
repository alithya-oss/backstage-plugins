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

import type { ThreadMessageLike } from '@assistant-ui/react';
import type { PromptTurn, PromptTurnStatus } from './promptThreadTypes';

type ThreadMessageStatus = NonNullable<ThreadMessageLike['status']>;
type ThreadMessageContent = Exclude<ThreadMessageLike['content'], string>;
type ThreadMessagePart = ThreadMessageContent[number];
type ToolCallPart = Extract<ThreadMessagePart, { type: 'tool-call' }>;

/**
 * Maps a turn's lifecycle onto the runtime's message status.
 *
 * A failed or cancelled turn is `incomplete`, never `complete`: that is what
 * keeps partial text from being presented as a finished answer.
 */
function toMessageStatus(status: PromptTurnStatus): ThreadMessageStatus {
  switch (status.type) {
    case 'running':
      return { type: 'running' };
    case 'complete':
      return { type: 'complete', reason: 'stop' };
    case 'cancelled':
      return { type: 'incomplete', reason: 'cancelled' };
    case 'error':
    default:
      return { type: 'incomplete', reason: 'error', error: status.message };
  }
}

/**
 * Converts one turn of our conversation state into the shape the runtime reads.
 *
 * An assistant turn's content is every tool invocation as a `tool-call` part,
 * in start order, followed by a single `text` part holding the text accumulated
 * so far. A `tool-call` part is keyed by `toolCallId`, so an invocation that
 * gains its result is filled in place instead of appearing a second time, and
 * omits `result` while it is still running.
 */
export function convertMessage(turn: PromptTurn): ThreadMessageLike {
  if (turn.role === 'user') {
    return {
      role: 'user',
      id: turn.id,
      content: [{ type: 'text', text: turn.text }],
    };
  }

  const toolCalls: ToolCallPart[] = (turn.invocations ?? []).map(
    invocation => ({
      type: 'tool-call',
      toolCallId: invocation.id,
      toolName: invocation.name,
      // The arguments come from the backend as parsed JSON, which is what the
      // part's own type says it carries.
      args: invocation.arguments as ToolCallPart['args'],
      // `result` stays absent until the tool-result event lands; the tool UI
      // reads that absence as the invocation still running.
      ...(invocation.result === undefined ? {} : { result: invocation.result }),
      ...(invocation.isError === undefined
        ? {}
        : { isError: invocation.isError }),
    }),
  );

  const content: ThreadMessageContent = [
    ...toolCalls,
    { type: 'text', text: turn.text },
  ];

  return {
    role: 'assistant',
    id: turn.id,
    content,
    ...(turn.status ? { status: toMessageStatus(turn.status) } : {}),
  };
}
