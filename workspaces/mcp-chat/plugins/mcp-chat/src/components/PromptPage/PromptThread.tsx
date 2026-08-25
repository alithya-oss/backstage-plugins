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

import type { ReactNode } from 'react';
import { AuiIf, ThreadPrimitive } from '@assistant-ui/react';
import type { MessageState } from '@assistant-ui/react';
import { PromptComposer } from './PromptComposer';
import { PromptAssistantMessage, PromptUserMessage } from './PromptMessage';
import { RunError } from './RunError';
import type { PromptThreadError } from './promptThreadTypes';
import styles from './PromptThread.module.css';

/**
 * Picks the renderer for one turn.
 *
 * Declared at module scope because `ThreadPrimitive.Messages` compares its
 * children by identity: an inline function would re-create the whole list on
 * every fragment of a streamed reply.
 */
const renderMessage = ({ message }: { message: MessageState }): ReactNode =>
  message.role === 'user' ? <PromptUserMessage /> : <PromptAssistantMessage />;

/**
 * Props of {@link PromptThread}.
 */
export interface PromptThreadProps {
  /** The failure of the last run, or `undefined` while none is outstanding. */
  error?: PromptThreadError | undefined;
  /** Re-runs the last user turn. */
  onRetry: () => void;
}

/**
 * The conversation surface: viewport, turns, run indication and composer.
 *
 * Everything about the run comes from the runtime rather than from props. The
 * turns are read through `ThreadPrimitive.Messages`, and the working indication
 * is gated on `thread.isRunning`, so it appears the moment a run starts — before
 * any fragment has arrived — and clears when the run completes, fails or is
 * cancelled.
 *
 * The failure is the one thing passed in: it belongs to the page's own state,
 * not to a message, which is exactly why it renders outside the conversation.
 */
export const PromptThread = ({ error, onRetry }: PromptThreadProps) => (
  <ThreadPrimitive.Root className={styles.root}>
    <ThreadPrimitive.Viewport className={styles.viewport}>
      <AuiIf condition={state => state.thread.isEmpty}>
        <p className={styles.empty}>
          Ask a question to start a conversation with your MCP servers.
        </p>
      </AuiIf>
      <ThreadPrimitive.Messages>{renderMessage}</ThreadPrimitive.Messages>
      <AuiIf condition={state => state.thread.isRunning}>
        <p className={styles.running} role="status">
          <span aria-hidden className={styles.spinner} />
          The assistant is working…
        </p>
      </AuiIf>
    </ThreadPrimitive.Viewport>
    {error ? <RunError error={error} onRetry={onRetry} /> : null}
    <PromptComposer />
  </ThreadPrimitive.Root>
);
