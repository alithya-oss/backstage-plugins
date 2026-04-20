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

import type { NodeStatus } from '@alithya-oss/backstage-plugin-argo-workflows-common';
import {
  PHASE_ICON_MAP,
  formatDuration,
} from '@alithya-oss/backstage-plugin-argo-workflows-common';
import styles from './DAGNodeCard.module.css';

/**
 * Props for the DAGNodeCard component.
 * @public
 */
export interface DAGNodeCardProps {
  node: NodeStatus;
  isSelected?: boolean;
  onClick?: () => void;
}

const BORDER_CLASS: Record<string, string> = {
  Succeeded: styles.borderSucceeded,
  Failed: styles.borderFailed,
  Error: styles.borderFailed,
  Running: styles.borderRunning,
  Pending: styles.borderPending,
};

const DIMMED_PHASES = new Set(['Skipped', 'Omitted']);

/**
 * Individual node card within the DAG card flow.
 * Shows node identity and status at a glance.
 *
 * @public
 */
export function DAGNodeCard({ node, isSelected, onClick }: DAGNodeCardProps) {
  const borderClass = BORDER_CLASS[node.phase] ?? '';
  const isDimmed = DIMMED_PHASES.has(node.phase);
  const icon = PHASE_ICON_MAP[node.phase] ?? '—';

  const classNames = [
    styles.card,
    borderClass,
    isDimmed ? styles.dimmed : '',
    isSelected ? styles.selected : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      className={classNames}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      title={`${node.displayName} — ${node.phase}`}
      role="button"
      tabIndex={0}
      aria-label={`${node.displayName}, ${node.phase}, ${formatDuration(
        node.duration,
      )}`}
      aria-pressed={isSelected ?? false}
      data-testid={`dag-node-${node.id}`}
    >
      <div className={styles.topRow}>
        <span className={styles.icon}>{icon}</span>
        <span className={styles.name}>{node.displayName}</span>
      </div>
      <span className={styles.duration}>{formatDuration(node.duration)}</span>
    </div>
  );
}
