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

import {
  ActionBarPrimitive,
  AuiIf,
  MessagePrimitive,
} from '@assistant-ui/react';
import { RiAlertLine, RiPencilLine, RiRefreshLine } from '@remixicon/react';
import { MarkdownText } from './MarkdownText';
import { PromptBranchPicker } from './PromptBranchPicker';
import { PromptEditComposer } from './PromptEditComposer';
import { PromptToolCall } from './PromptToolCall';
import styles from './PromptMessage.module.css';

/**
 * Part renderers shared by both roles.
 *
 * Declared once at module scope so the object identity is stable across
 * renders: `MessagePrimitive.Parts` treats a new `components` object as a
 * change, and a growing text part re-renders often enough for that to matter.
 *
 * `tools.Fallback` is the slot the library uses for a tool it has no specific
 * renderer for, which is exactly what MCP needs: tool names come from
 * configuration, so a single name-agnostic renderer handles every invocation
 * and `by_name` stays unused. This is the standard components variant — the
 * chain-of-thought variant types `tools` as `never`, so the two cannot be mixed.
 */
const PART_COMPONENTS = {
  Text: MarkdownText,
  tools: { Fallback: PromptToolCall },
};

/**
 * A user turn.
 *
 * The turn swaps for its edit composer while one is open, rather than opening a
 * dialog beside it, so the edit reads as a revision of that turn. The swap is
 * driven by the message's own composer state, which is what the runtime toggles
 * when the edit action fires.
 */
export const PromptUserMessage = () => (
  <MessagePrimitive.Root className={styles.userRoot}>
    <AuiIf condition={state => state.message.composer.isEditing}>
      <PromptEditComposer />
    </AuiIf>
    <AuiIf condition={state => !state.message.composer.isEditing}>
      <div className={styles.userColumn}>
        <div className={styles.userBubble}>
          <MessagePrimitive.Parts components={PART_COMPONENTS} />
        </div>
        <ActionBarPrimitive.Root
          hideWhenRunning
          className={styles.userActions}
          aria-label="Prompt actions"
        >
          <ActionBarPrimitive.Edit
            className={styles.actionButton}
            aria-label="Edit prompt"
          >
            <RiPencilLine aria-hidden className={styles.actionIcon} />
          </ActionBarPrimitive.Edit>
        </ActionBarPrimitive.Root>
      </div>
    </AuiIf>
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
 *
 * Regenerating keeps the answer on screen as a version and adds the new one
 * beside it, so the action bar and the branch picker sit together: one produces
 * an alternative, the other moves between them.
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
      <div className={styles.assistantFooter}>
        <ActionBarPrimitive.Root
          hideWhenRunning
          className={styles.assistantActions}
          aria-label="Answer actions"
        >
          <ActionBarPrimitive.Reload
            className={styles.actionButton}
            aria-label="Regenerate answer"
          >
            <RiRefreshLine aria-hidden className={styles.actionIcon} />
          </ActionBarPrimitive.Reload>
        </ActionBarPrimitive.Root>
        <PromptBranchPicker />
      </div>
    </div>
  </MessagePrimitive.Root>
);
