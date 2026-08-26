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

import { useCallback, useEffect, useId, useState } from 'react';
import type { ToolCallMessagePartProps } from '@assistant-ui/react';
import {
  RiArrowRightSLine,
  RiCheckLine,
  RiErrorWarningLine,
  RiFileCopyLine,
  RiTerminalBoxLine,
} from '@remixicon/react';
import styles from './PromptToolCall.module.css';

/** How long the copy acknowledgement stays visible. */
const ACKNOWLEDGEMENT_MS = 2000;

type InvocationState = 'running' | 'failed' | 'succeeded';

const STATE_LABEL: Record<InvocationState, string> = {
  running: 'Running…',
  failed: 'Failed',
  succeeded: 'Done',
};

/**
 * Renders a value for reading: a string as it stands, anything else as
 * formatted JSON. The backend sends a tool result as text and arguments as
 * parsed JSON, so both shapes reach this renderer.
 */
function format(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return String(value);
  }
}

/**
 * Which of the three states an invocation is in.
 *
 * A missing `result` is what marks it as still running: the state layer omits
 * the field until the tool-result event lands.
 */
function stateOf(
  result: unknown,
  isError: boolean | undefined,
): InvocationState {
  if (isError) {
    return 'failed';
  }
  if (result === undefined) {
    return 'running';
  }
  return 'succeeded';
}

/**
 * The catch-all renderer for every MCP tool invocation of an assistant turn.
 *
 * MCP tool names come from configuration and are unknown at build time, so no
 * per-tool component can be registered. This one component is registered in the
 * `tools.Fallback` slot of `MessagePrimitive.Parts` — the slot the library uses
 * for any tool it has no specific renderer for — which is name-agnostic by
 * construction and, unlike `makeAssistantToolUI` / `useAssistantToolUI`, not
 * deprecated.
 *
 * No tool runs in the browser: this is a description of what the run did on the
 * server. `addResult`, `resume` and `respondToApproval` are therefore ignored.
 *
 * Because the runtime keys a part by its `toolCallId`, an invocation that gains
 * its result resolves in place rather than appearing a second time, and this
 * component keeps its own expansion state across that transition.
 */
export const PromptToolCall = ({
  toolName,
  args,
  result,
  isError,
}: ToolCallMessagePartProps) => {
  const detailsId = useId();
  const [expanded, setExpanded] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>(
    'idle',
  );

  const state = stateOf(result, isError);

  // The acknowledgement clears itself, and clears with the component, so a
  // resolved invocation is not left claiming a copy that happened long ago.
  useEffect(() => {
    if (copyState === 'idle') {
      return undefined;
    }
    const timer = setTimeout(() => setCopyState('idle'), ACKNOWLEDGEMENT_MS);
    return () => clearTimeout(timer);
  }, [copyState]);

  const onCopy = useCallback(async () => {
    try {
      await window.navigator.clipboard.writeText(format(result));
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  }, [result]);

  const StateIcon = state === 'failed' ? RiErrorWarningLine : RiTerminalBoxLine;
  const outcomeHeading = isError ? 'Error' : 'Result';

  return (
    <div className={styles.root} data-state={state}>
      <button
        type="button"
        className={styles.header}
        aria-expanded={expanded}
        aria-controls={detailsId}
        onClick={() => setExpanded(current => !current)}
      >
        <RiArrowRightSLine aria-hidden className={styles.chevron} />
        <StateIcon aria-hidden className={styles.icon} />
        <span className={styles.name}>{toolName}</span>
        <span className={styles.state}>{STATE_LABEL[state]}</span>
      </button>
      {expanded ? (
        <div className={styles.details} id={detailsId}>
          <section className={styles.section}>
            <h4 className={styles.sectionHeading}>Arguments</h4>
            <pre className={styles.code}>{format(args)}</pre>
          </section>
          <section className={styles.section}>
            <h4 className={styles.sectionHeading}>{outcomeHeading}</h4>
            {state === 'running' ? (
              <p className={styles.pending}>
                Waiting for this tool to return its result…
              </p>
            ) : (
              <>
                <pre className={styles.code}>{format(result)}</pre>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.copy}
                    onClick={onCopy}
                    aria-label={`Copy the ${toolName} ${outcomeHeading.toLowerCase()}`}
                  >
                    {copyState === 'copied' ? (
                      <RiCheckLine aria-hidden className={styles.copyIcon} />
                    ) : (
                      <RiFileCopyLine aria-hidden className={styles.copyIcon} />
                    )}
                    Copy
                  </button>
                  <span className={styles.acknowledgement} role="status">
                    {copyState === 'copied' && 'Copied to the clipboard'}
                    {copyState === 'failed' &&
                      'The clipboard could not be written to'}
                  </span>
                </div>
              </>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
};
