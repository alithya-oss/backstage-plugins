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

import { AuiIf, ComposerPrimitive } from '@assistant-ui/react';
import { RiSendPlane2Line, RiStopCircleLine } from '@remixicon/react';
import styles from './PromptComposer.module.css';

/**
 * The prompt composer.
 *
 * `ComposerPrimitive.Input` is a textarea that grows with its content, so a
 * multi-line prompt needs no mode switch. `submitMode="enter"` is passed
 * explicitly rather than left to the default: Enter submits and Shift+Enter
 * inserts a newline, and stating it keeps that contract from moving with the
 * library's default.
 *
 * Send and cancel occupy the same slot, swapped on the runtime's running state.
 * That is what makes the cancel control appear exactly while a run is in flight
 * and disappear once it ends, without the page tracking that itself.
 */
export const PromptComposer = () => (
  <ComposerPrimitive.Root className={styles.root}>
    <ComposerPrimitive.Input
      className={styles.input}
      submitMode="enter"
      minRows={1}
      maxRows={12}
      placeholder="Ask about your MCP servers…"
      aria-label="Prompt"
    />
    <div className={styles.actions}>
      <AuiIf condition={state => !state.thread.isRunning}>
        <ComposerPrimitive.Send
          className={styles.button}
          aria-label="Send prompt"
        >
          <RiSendPlane2Line aria-hidden className={styles.icon} />
        </ComposerPrimitive.Send>
      </AuiIf>
      <AuiIf condition={state => state.thread.isRunning}>
        <ComposerPrimitive.Cancel
          className={styles.button}
          aria-label="Cancel run"
        >
          <RiStopCircleLine aria-hidden className={styles.icon} />
        </ComposerPrimitive.Cancel>
      </AuiIf>
    </div>
  </ComposerPrimitive.Root>
);
