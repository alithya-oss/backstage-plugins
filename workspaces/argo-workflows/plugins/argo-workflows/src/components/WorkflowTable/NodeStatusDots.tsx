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

import { useApi, configApiRef } from '@backstage/core-plugin-api';
import type { NodeStatusSummary } from '@alithya-oss/backstage-plugin-argo-workflows-common';
import { PHASE_ICON_MAP } from '@alithya-oss/backstage-plugin-argo-workflows-common';
import styles from './NodeStatusDots.module.css';

/**
 * Props for the NodeStatusDots component.
 * @public
 */
export interface NodeStatusDotsProps {
  nodes: NodeStatusSummary[];
}

const PHASE_COLOR: Record<string, string> = {
  Succeeded: 'var(--bui-fg-success)',
  Failed: 'var(--bui-fg-danger)',
  Error: 'var(--bui-fg-danger)',
  Running: 'var(--bui-fg-info)',
  Pending: 'var(--bui-fg-warning)',
  Skipped: 'var(--bui-fg-tertiary)',
  Omitted: 'var(--bui-fg-tertiary)',
};

const PHASE_ORDER = [
  'Succeeded',
  'Running',
  'Pending',
  'Failed',
  'Error',
  'Skipped',
  'Omitted',
] as const;

const MAX_VISIBLE_DOTS = 10;
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

/** Colored squares — one per node. */
function DotsView({ nodes }: { nodes: NodeStatusSummary[] }) {
  const showOverflow = nodes.length > OVERFLOW_THRESHOLD;
  const visible = showOverflow ? nodes.slice(0, MAX_VISIBLE_DOTS) : nodes;
  const remaining = nodes.length - MAX_VISIBLE_DOTS;

  return (
    <span
      className={styles.container}
      aria-label={buildAriaLabel(nodes)}
      data-testid="node-status-dots"
    >
      {visible.map((node, i) => (
        <span
          key={i}
          className={styles.dot}
          style={{ background: PHASE_COLOR[node.phase] ?? 'var(--bui-fg-tertiary)' }}
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

/** Horizontal stacked bar — segments proportional to phase counts. */
function BarView({ nodes }: { nodes: NodeStatusSummary[] }) {
  const counts: Record<string, number> = {};
  for (const n of nodes) {
    counts[n.phase] = (counts[n.phase] ?? 0) + 1;
  }
  const total = nodes.length;

  return (
    <div
      className={styles.bar}
      aria-label={buildAriaLabel(nodes)}
      title={buildAriaLabel(nodes)}
      data-testid="node-status-bar"
    >
      {PHASE_ORDER.map(phase => {
        const count = counts[phase] ?? 0;
        if (count === 0) return null;
        const pct = (count / total) * 100;
        return (
          <div
            key={phase}
            className={styles.segment}
            style={{
              width: `${pct}%`,
              background: PHASE_COLOR[phase] ?? 'var(--bui-fg-tertiary)',
            }}
            title={`${count} ${phase}`}
            data-testid="node-status-segment"
          />
        );
      })}
    </div>
  );
}

/**
 * Node status visualization — configurable as dots or bar.
 *
 * Set `argoWorkflows.nodeStatusStyle` in `app-config.yaml`:
 * - `'dots'` (default): colored squares, one per node
 * - `'bar'`: horizontal stacked bar proportional to phase counts
 *
 * @public
 */
export function NodeStatusDots({ nodes }: NodeStatusDotsProps) {
  let nodeStatusStyle = 'dots';
  try {
    const config = useApi(configApiRef);
    nodeStatusStyle =
      config.getOptionalString('argoWorkflows.nodeStatusStyle') ?? 'dots';
  } catch {
    // configApiRef not available (e.g. in tests) — default to dots
  }

  if (nodes.length === 0) {
    return (
      <span className={styles.empty} aria-label="Node status: none">
        —
      </span>
    );
  }

  if (nodeStatusStyle === 'bar') {
    return <BarView nodes={nodes} />;
  }

  return <DotsView nodes={nodes} />;
}
