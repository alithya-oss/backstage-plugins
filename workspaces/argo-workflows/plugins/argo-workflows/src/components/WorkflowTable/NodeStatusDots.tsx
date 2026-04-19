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

import React from 'react';
import type { NodeStatusSummary } from '@backstage-community/plugin-argo-workflows-common';
import { PHASE_ICON_MAP } from '@backstage-community/plugin-argo-workflows-common';
import styles from './NodeStatusDots.module.css';

/**
 * Props for the NodeStatusDots component.
 * @public
 */
export interface NodeStatusDotsProps {
  nodes: NodeStatusSummary[];
}

const DOT_BG: Record<string, string> = {
  Succeeded: 'var(--bui-fg-success)',
  Failed: 'var(--bui-fg-danger)',
  Error: 'var(--bui-fg-danger)',
  Running: 'var(--bui-fg-info)',
  Pending: 'var(--bui-fg-warning)',
  Skipped: 'var(--bui-fg-tertiary)',
  Omitted: 'var(--bui-fg-tertiary)',
};

const MAX_VISIBLE = 10;
const OVERFLOW_THRESHOLD = 12;

function buildAriaLabel(nodes: NodeStatusSummary[]): string {
  if (nodes.length === 0) return 'Node status: none';
  const counts: Record<string, number> = {};
  for (const n of nodes) {
    counts[n.phase] = (counts[n.phase] ?? 0) + 1;
  }
  const parts = Object.entries(counts).map(
    ([phase, count]) => `${count} ${phase.toLowerCase()}`,
  );
  return `Node status: ${parts.join(', ')}`;
}

/**
 * Compact visual summary of node phases displayed as colored squares.
 *
 * @public
 */
export function NodeStatusDots({ nodes }: NodeStatusDotsProps) {
  if (nodes.length === 0) {
    return (
      <span className={styles.empty} aria-label="Node status: none">
        —
      </span>
    );
  }

  const showOverflow = nodes.length > OVERFLOW_THRESHOLD;
  const visibleNodes = showOverflow ? nodes.slice(0, MAX_VISIBLE) : nodes;
  const remaining = nodes.length - MAX_VISIBLE;

  return (
    <span className={styles.container} aria-label={buildAriaLabel(nodes)}>
      {visibleNodes.map((node, i) => (
        <span
          key={i}
          className={styles.dot}
          style={{ background: DOT_BG[node.phase] ?? 'var(--bui-fg-tertiary)' }}
          title={`${node.displayName}: ${node.phase}`}
          data-testid="node-dot"
        >
          {PHASE_ICON_MAP[node.phase] ?? '—'}
        </span>
      ))}
      {showOverflow && (
        <span className={styles.overflow} data-testid="node-dots-overflow">
          +{remaining} more
        </span>
      )}
    </span>
  );
}
