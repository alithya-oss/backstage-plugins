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


import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { DAGGroup } from '@alithya-oss/backstage-plugin-argo-workflows-common';
import styles from './DAGGroupNode.module.css';

/**
 * Data shape for the DAGGroupNode React Flow custom node.
 * @public
 */
export interface DAGGroupNodeData {
  group: DAGGroup;
  isCollapsed: boolean;
  onToggle: (groupId: string) => void;
}

const BORDER_CLASS: Record<string, string> = {
  Succeeded: styles.borderSuccess,
  Failed: styles.borderDanger,
  Error: styles.borderDanger,
  Running: styles.borderInfo,
  Pending: styles.borderWarning,
};

/**
 * React Flow custom node for collapsible DAG template groups.
 *
 * Expanded: labeled dashed container (children rendered by React Flow inside).
 * Collapsed: compact card with group name and child count.
 *
 * @public
 */
export function DAGGroupNode({ data }: NodeProps) {
  const { group, isCollapsed, onToggle } = data as unknown as DAGGroupNodeData;
  const borderClass = BORDER_CLASS[group.phase] ?? '';

  if (isCollapsed) {
    return (
      <div
        className={`${styles.collapsed} ${borderClass}`}
        data-testid={`dag-group-${group.id}`}
      >
        <Handle type="target" position={Position.Left} style={{ visibility: 'hidden' }} />
        <button
          type="button"
          className={styles.toggle}
          onClick={() => onToggle(group.id)}
          data-testid={`dag-group-toggle-${group.id}`}
        >
          ▶
        </button>
        <span className={styles.name}>{group.displayName}</span>
        <span className={styles.badge}>{group.childNodeIds.length} nodes</span>
        <Handle type="source" position={Position.Right} style={{ visibility: 'hidden' }} />
      </div>
    );
  }

  return (
    <div
      className={`${styles.group} ${borderClass}`}
      data-testid={`dag-group-${group.id}`}
    >
      <div className={styles.header}>
        <button
          type="button"
          className={styles.toggle}
          onClick={() => onToggle(group.id)}
          data-testid={`dag-group-toggle-${group.id}`}
        >
          ▼
        </button>
        <span className={styles.name}>{group.displayName}</span>
        <span className={styles.badge}>{group.type}</span>
      </div>
    </div>
  );
}
