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

import { AuiIf, MessagePrimitive } from '@assistant-ui/react';
import { RiAlertLine } from '@remixicon/react';
import { MarkdownText } from './MarkdownText';
import styles from './PromptMessage.module.css';

/**
 * Part renderers shared by both roles.
 *
 * Declared once at module scope so the object identity is stable across
 * renders: `MessagePrimitive.Parts` treats a new `components` object as a
 * change, and a growing text part re-renders often enough for that to matter.
 *
 * Only `Text` is overridden here. Tool-call parts keep the library's default
 * until the catch-all tool renderer of the following task group replaces it, so
 * an invocation is never dropped from the turn in the meantime.
 */
const PART_COMPONENTS = { Text: MarkdownText };

/**
 * A user turn.
 */
export const PromptUserMessage = () => (
  <MessagePrimitive.Root className={styles.userRoot}>
    <div className={styles.userBubble}>
      <MessagePrimitive.Parts components={PART_COMPONENTS} />
    </div>
  </MessagePrimitive.Root>
);

/**
 * An assistant turn.
 *
 * The text is rendered by the same markdown component whether it is still
 * growing or finished, so formatting becomes readable before the run ends.
 *
 * A turn whose run did not reach completion keeps whatever text had arrived and
 * is labelled as interrupted rather than being retracted or presented as a
 * finished answer. The label is driven by the message's own status, so it
 * follows the run without the page tracking it.
 */
export const PromptAssistantMessage = () => (
  <MessagePrimitive.Root className={styles.assistantRoot}>
    <div className={styles.assistantBody}>
      <MessagePrimitive.Parts components={PART_COMPONENTS} />
      <AuiIf condition={state => state.message.status?.type === 'incomplete'}>
        <p className={styles.interrupted}>
          <RiAlertLine aria-hidden className={styles.interruptedIcon} />
          This answer was interrupted and is incomplete.
        </p>
      </AuiIf>
    </div>
  </MessagePrimitive.Root>
);
