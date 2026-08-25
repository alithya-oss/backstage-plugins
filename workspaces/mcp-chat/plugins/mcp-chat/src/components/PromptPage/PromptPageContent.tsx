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
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
} from '@assistant-ui/react';
import { usePromptThread } from './usePromptThread';
import styles from './PromptPageContent.module.css';

/**
 * Inner prompt page content without the Page/Content shell — PageBlueprint
 * provides the page shell.
 *
 * The conversation state lives in `usePromptThread` and reaches the runtime
 * through its `ExternalStoreAdapter`, so React state stays the single source of
 * truth: selecting a stored conversation replaces the list without the runtime
 * having to import a message repository.
 *
 * The thread primitives, tool call rendering and reduced side panel are added by
 * the following task groups of the `add-mcp-chat-prompt-page` change.
 */
export const PromptPageContent = () => {
  const { adapter } = usePromptThread();
  const runtime = useExternalStoreRuntime(adapter);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className={styles.root}>
        <h1 className={styles.heading}>MCP Prompt</h1>
        <div className={styles.thread}>
          <p>The conversation surface is not wired up yet.</p>
        </div>
      </div>
    </AssistantRuntimeProvider>
  );
};
