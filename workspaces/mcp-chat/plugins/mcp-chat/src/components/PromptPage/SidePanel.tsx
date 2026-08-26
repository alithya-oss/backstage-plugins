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

import { ConversationList } from './ConversationList';
import type { ConversationListProps } from './ConversationList';
import { McpServerToggles } from './McpServerToggles';
import type { McpServerTogglesProps } from './McpServerToggles';
import { ProviderStatusBlock } from './ProviderStatusBlock';
import type { ProviderStatusBlockProps } from './ProviderStatusBlock';
import styles from './SidePanel.module.css';

/**
 * Props of {@link SidePanel}.
 */
export interface SidePanelProps {
  /** The MCP server toggle list. */
  servers: McpServerTogglesProps;
  /** The read-only provider status block. */
  provider: ProviderStatusBlockProps;
  /** The stored conversation list. */
  conversations: ConversationListProps;
}

/**
 * The reduced side panel: MCP server toggles, provider status, conversations.
 *
 * Reduced is the operative word. The existing right pane also lists every tool
 * of every enabled server; that inventory is not carried over, because the
 * conversation itself now names each tool it invokes. What is carried over is
 * what Assistant UI has no answer for — which servers are in play, whether the
 * provider can answer, and which stored conversation is being continued.
 *
 * The three blocks are given as prop groups rather than being wired to hooks
 * here so the page stays the one place that owns the panel's state, which is the
 * same state a run reads.
 */
export const SidePanel = ({
  servers,
  provider,
  conversations,
}: SidePanelProps) => (
  <aside className={styles.root} aria-label="Chat settings and history">
    <McpServerToggles {...servers} />
    <ProviderStatusBlock {...provider} />
    <ConversationList {...conversations} />
  </aside>
);
