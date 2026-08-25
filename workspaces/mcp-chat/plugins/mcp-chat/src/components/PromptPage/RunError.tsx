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
  RiCloudOffLine,
  RiErrorWarningLine,
  RiRefreshLine,
} from '@remixicon/react';
import type { PromptThreadError } from './promptThreadTypes';
import styles from './RunError.module.css';

/**
 * Props of {@link RunError}.
 */
export interface RunErrorProps {
  /** The failure of the last run. */
  error: PromptThreadError;
  /** Re-runs the last user turn. */
  onRetry: () => void;
}

const HEADLINE: Record<PromptThreadError['kind'], string> = {
  transport: 'The chat service is unavailable.',
  provider: 'The chat provider could not answer.',
};

/**
 * A failed run, rendered outside the conversation.
 *
 * The failure is deliberately not assistant content: it sits in its own alert
 * next to the conversation, so a partial answer above it stays visible and
 * marked as interrupted instead of being replaced or passed off as complete.
 *
 * `transport` and `provider` are worded differently because they are different
 * problems for the reader — one is the plugin's backend being out of reach, the
 * other is the provider rejecting the run. Retry re-runs the last user turn
 * either way.
 */
export const RunError = ({ error, onRetry }: RunErrorProps) => {
  const Icon = error.kind === 'transport' ? RiCloudOffLine : RiErrorWarningLine;

  return (
    <div className={styles.root} role="alert">
      <Icon aria-hidden className={styles.icon} />
      <div className={styles.body}>
        <p className={styles.headline}>{HEADLINE[error.kind]}</p>
        <p className={styles.detail}>{error.message}</p>
      </div>
      <button type="button" className={styles.retry} onClick={onRetry}>
        <RiRefreshLine aria-hidden className={styles.retryIcon} />
        Retry
      </button>
    </div>
  );
};
