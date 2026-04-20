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

import { useMemo } from 'react';
import type { NodeStatus } from '@alithya-oss/backstage-plugin-argo-workflows-common';
import { computeDAGLayout } from '../../utils/computeDAGLayout';
import { DAGNodeCard } from './DAGNodeCard';
import { DAGEdgeSVG } from './DAGEdgeSVG';
import styles from './DAGFlowView.module.css';

const CONTAINER_PADDING = 20;

/**
 * Props for the DAGFlowView component.
 * @public
 */
export interface DAGFlowViewProps {
  nodes: NodeStatus[];
  selectedNodeId?: string;
  onNodeClick?: (nodeId: string) => void;
  /** URL for the full-page DAG view. If provided, a "Full View" link is shown. */
  fullViewUrl?: string;
}

function buildAriaLabel(nodes: NodeStatus[]): string {
  const counts: Record<string, number> = {};
  for (const n of nodes) {
    counts[n.phase] = (counts[n.phase] ?? 0) + 1;
  }
  const parts = Object.entries(counts).map(
    ([phase, count]) => `${count} ${phase.toLowerCase()}`,
  );
  return `Workflow execution graph with ${nodes.length} nodes: ${parts.join(', ')}`;
}

/**
 * DAG visualization using dagre-positioned nodes and SVG edges.
 *
 * Renders workflow nodes at absolute positions computed by dagre,
 * with SVG path edges colored by source node phase.
 *
 * @public
 */
export function DAGFlowView({
  nodes,
  selectedNodeId,
  onNodeClick,
  fullViewUrl,
}: DAGFlowViewProps) {
  const layout = useMemo(() => computeDAGLayout(nodes), [nodes]);

  if (layout.nodes.length === 0) {
    return (
      <div className={styles.empty} data-testid="dag-empty">
        This workflow has no execution nodes.
      </div>
    );
  }

  const containerWidth =
    Math.max(...layout.nodes.map(n => n.x + n.width)) + CONTAINER_PADDING;
  const containerHeight =
    Math.max(...layout.nodes.map(n => n.y + n.height)) + CONTAINER_PADDING;

  const nodeMap = useMemo(() => {
    const map = new Map<string, NodeStatus>();
    for (const pn of layout.nodes) {
      map.set(pn.id, pn.data);
    }
    return map;
  }, [layout]);

  return (
    <div className={styles.wrapper}>
      <div
        className={styles.container}
        style={{ width: containerWidth, height: containerHeight }}
        data-testid="dag-flow-view"
        role="group"
        aria-label={buildAriaLabel(
          layout.nodes.map(n => n.data),
        )}
      >
        <DAGEdgeSVG
          edges={layout.edges}
          nodeMap={nodeMap}
          width={containerWidth}
          height={containerHeight}
        />
        {fullViewUrl && (
          <a
            href={fullViewUrl}
            className={styles.fullViewLink}
            data-testid="dag-full-view-link"
          >
            Full View ↗
          </a>
        )}
        {layout.nodes.map(pn => (
          <div
            key={pn.id}
            className={styles.node}
            style={{ left: pn.x, top: pn.y }}
          >
            <DAGNodeCard
              node={pn.data}
              isSelected={pn.id === selectedNodeId}
              onClick={
                onNodeClick ? () => onNodeClick(pn.id) : undefined
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
