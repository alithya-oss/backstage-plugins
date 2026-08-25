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

import styles from './PromptPageContent.module.css';

/**
 * Inner prompt page content without the Page/Content shell — PageBlueprint
 * provides the page shell.
 *
 * This is the mount point of the Assistant UI conversation surface. The
 * runtime, thread primitives, tool call rendering and reduced side panel are
 * added by the following task groups of the `add-mcp-chat-prompt-page` change;
 * the page is routable from here on so both pages can be verified to coexist.
 */
export const PromptPageContent = () => (
  <div className={styles.root}>
    <h1 className={styles.heading}>MCP Prompt</h1>
    <div className={styles.thread}>
      <p>The conversation surface is not wired up yet.</p>
    </div>
  </div>
);
