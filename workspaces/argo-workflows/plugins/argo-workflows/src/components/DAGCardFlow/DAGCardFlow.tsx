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

import { Fragment } from 'react';
import type { NodeStatus, DAGColumn } from '@alithya-oss/backstage-plugin-argo-workflows-common';
import { computeDAGColumns } from '@alithya-oss/backstage-plugin-argo-workflows-common';
import { DAGNodeCard } from './DAGNodeCard';
import { DAGArrow, type ArrowStatus } from './DAGArrow';
import styles from './DAGCardFlow.module.css';

/**
 * Props for the DAGCardFlow component.
 * @public
 */
export interface DAGCardFlowProps {
  nodes: NodeStatus[];
  selectedNodeId?: string;
  onNodeClick?: (nodeId: string) => void;
}

const FAILURE_PHASES = new Set(['Failed', 'Error']);
const SUCCESS_PHASES = new Set(['Succeeded']);

function getArrowStatus(column: DAGColumn): ArrowStatus {
  const hasFailure = column.nodes.some(n => FAILURE_PHASES.has(n.phase));
  if (hasFailure) return 'danger';
  const allSucceeded = column.nodes.every(n => SUCCESS_PHASES.has(n.phase));
  if (allSucceeded) return 'success';
  return 'inactive';
}

function buildFlowAriaLabel(cols: DAGColumn[]): string {
  const allNodes = cols.flatMap(c => c.nodes);
  const counts: Record<string, number> = {};
  for (const n of allNodes) {
    counts[n.phase] = (counts[n.phase] ?? 0) + 1;
  }
  const parts = Object.entries(counts).map(
    ([phase, count]) => `${count} ${phase.toLowerCase()}`,
  );
  return `Workflow execution graph with ${allNodes.length} nodes: ${parts.join(', ')}`;
}

/**
 * Horizontal left-to-right DAG card flow visualization.
 *
 * Renders workflow nodes grouped into columns by execution stage,
 * connected by status-colored arrows.
 *
 * @public
 */
export function DAGCardFlow({
  nodes,
  selectedNodeId,
  onNodeClick,
}: DAGCardFlowProps) {
  const columns = computeDAGColumns(nodes);

  if (columns.length === 0) {
    return (
      <div className={styles.empty} data-testid="dag-empty">
        This workflow has no execution nodes.
      </div>
    );
  }

  return (
    <div
      className={styles.container}
      data-testid="dag-card-flow"
      role="group"
      aria-label={buildFlowAriaLabel(columns)}
    >
      {columns.map((column, colIndex) => (
        <Fragment key={colIndex}>
          {colIndex > 0 && (
            <DAGArrow status={getArrowStatus(columns[colIndex - 1])} />
          )}
          <div className={styles.column}>
            {column.isParallel && (
              <span className={styles.parallelLabel}>parallel</span>
            )}
            {column.nodes.map(node => (
              <DAGNodeCard
                key={node.id}
                node={node}
                isSelected={node.id === selectedNodeId}
                onClick={onNodeClick ? () => onNodeClick(node.id) : undefined}
              />
            ))}
          </div>
        </Fragment>
      ))}
    </div>
  );
}
