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

import { ComposerPrimitive, useAuiState } from '@assistant-ui/react';
import { RiAlertLine } from '@remixicon/react';
import styles from './PromptEditComposer.module.css';

/**
 * How many turns follow the one being edited.
 *
 * Editing a user turn truncates everything after it — branching is confined to
 * the last answer — so this count is exactly what saving is about to discard.
 */
const useDiscardedTurnCount = () =>
  useAuiState(state =>
    Math.max(0, state.thread.messages.length - 1 - state.message.index),
  );

/**
 * The number of turns that would be lost, spelled out.
 *
 * Rendered before the edit is saved rather than after, because the loss is not
 * recoverable: without the warning, correcting a typo six exchanges up silently
 * removes those exchanges and reads as a bug.
 */
const TruncationWarning = () => {
  const discarded = useDiscardedTurnCount();
  if (discarded === 0) {
    return null;
  }
  return (
    <p className={styles.warning} role="alert">
      <RiAlertLine aria-hidden className={styles.warningIcon} />
      Saving re-runs this prompt and discards the {discarded} message
      {discarded === 1 ? '' : 's'} that follow it.
    </p>
  );
};

/**
 * The composer a user turn is edited in.
 *
 * Rendered in place of the turn while its edit composer is open, so the edit
 * happens where the turn sits rather than in a separate dialog. Saving goes
 * through the runtime's edit path, which is wired to `onEdit`.
 */
export const PromptEditComposer = () => (
  <ComposerPrimitive.Root className={styles.root}>
    <ComposerPrimitive.Input
      className={styles.input}
      submitMode="enter"
      minRows={1}
      maxRows={12}
      aria-label="Edit prompt"
    />
    <TruncationWarning />
    <div className={styles.actions}>
      <ComposerPrimitive.Cancel className={styles.secondary}>
        Cancel
      </ComposerPrimitive.Cancel>
      <ComposerPrimitive.Send className={styles.primary}>
        Save and re-run
      </ComposerPrimitive.Send>
    </div>
  </ComposerPrimitive.Root>
);
