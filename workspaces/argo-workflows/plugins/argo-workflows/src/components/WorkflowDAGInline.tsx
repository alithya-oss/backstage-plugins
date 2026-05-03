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
import { ButtonIcon, Flex, Text } from '@backstage/ui';
import { buildDAG } from '@alithya-oss/backstage-plugin-argo-workflows-react';
import type { Workflow } from '@alithya-oss/backstage-plugin-argo-workflows-common';
import { RiAddLine, RiSubtractLine, RiFullscreenLine } from '@remixicon/react';
import { NodeDetailPanel } from './NodeDetailPanel';
import {
  DAG_INLINE_CONFIG,
  statusColor,
  formatDurationSeconds,
  computeLayout,
  buildEdgePath,
  truncateLabel,
  useDAGInteraction,
} from './dagHelpers';
import styles from './WorkflowDAGInline.module.css';

const cfg = DAG_INLINE_CONFIG;

/**
 * Props for the WorkflowDAGInline component.
 * Accepts a Workflow object directly — no routing or fetching needed.
 */
export interface WorkflowDAGInlineProps {
  workflow: Workflow;
}

/**
 * Inline DAG visualization for a workflow.
 * Renders directly from a Workflow object without fetching or routing.
 * Designed to be displayed inside an expandable table row.
 * Clicking a node opens a detail panel alongside the graph.
 */
export const WorkflowDAGInline = ({ workflow }: WorkflowDAGInlineProps) => {
  const dag = useDAGInteraction(cfg);

  const layout = useMemo(() => {
    const workflowNodes = workflow.status.nodes ?? {};
    if (Object.keys(workflowNodes).length === 0) return null;
    try {
      return computeLayout(buildDAG(workflow), cfg);
    } catch {
      return null;
    }
  }, [workflow]);

  if (!layout) {
    return (
      <div data-testid="workflow-dag-inline-empty" className={styles.empty}>
        <Text variant="body-small" color="secondary">
          This workflow does not contain any tasks.
        </Text>
      </div>
    );
  }

  const { nodes, edges } = layout;

  return (
    <div data-testid="workflow-dag-inline" className={styles.root}>
      <Flex style={{ gap: 'var(--bui-space-4)' }}>
        <div className={styles.container}>
          <svg
            ref={dag.svgRef}
            width="100%"
            height="100%"
            className={`${styles.svg} ${dag.isPanning ? styles.panning : ''}`}
            onWheel={dag.handlers.onWheel}
            onMouseDown={dag.handlers.onMouseDown}
            onMouseMove={dag.handlers.onMouseMove}
            onMouseUp={dag.handlers.onMouseUp}
            onMouseLeave={dag.handlers.onMouseLeave}
            role="img"
            aria-label={`DAG for workflow ${workflow.metadata.name}`}
          >
            <defs>
              <marker
                id="arrowhead-inline"
                markerWidth="10"
                markerHeight="7"
                refX="10"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="var(--bui-fg-secondary)"
                />
              </marker>
            </defs>

            <g
              transform={`translate(${dag.transform.x}, ${dag.transform.y}) scale(${dag.transform.scale})`}
            >
              {edges.map(edge => (
                <path
                  key={`${edge.source}-${edge.target}`}
                  d={buildEdgePath(edge.points)}
                  fill="none"
                  stroke="var(--bui-fg-secondary)"
                  strokeWidth={1.5}
                  markerEnd="url(#arrowhead-inline)"
                />
              ))}

              {nodes.map(node => {
                const isSelected = dag.selectedNode?.id === node.id;
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x - cfg.nodeWidth / 2}, ${
                      node.y - cfg.nodeHeight / 2
                    })`}
                    onMouseEnter={e => dag.nodeHandlers.onMouseEnter(e, node)}
                    onMouseLeave={dag.nodeHandlers.onMouseLeave}
                    onClick={() => dag.nodeHandlers.onClick(node)}
                    onKeyDown={e => dag.nodeHandlers.onKeyDown(e, node)}
                    className={styles.node}
                    role="button"
                    aria-label={`${node.label}: ${node.status}`}
                    aria-pressed={isSelected}
                    tabIndex={0}
                  >
                    <rect
                      width={cfg.nodeWidth}
                      height={cfg.nodeHeight}
                      rx={cfg.nodeRx}
                      ry={cfg.nodeRx}
                      fill={statusColor(node.status)}
                      stroke={isSelected ? '#ffffff' : 'none'}
                      strokeWidth={isSelected ? 3 : 0}
                    />
                    <text
                      x={cfg.nodeWidth / 2}
                      y={cfg.nodeHeight / 2}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#ffffff"
                      fontSize={cfg.fontSize}
                      fontFamily="sans-serif"
                    >
                      {truncateLabel(node.label, cfg.labelMaxChars)}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Zoom & fit controls */}
          <div className={styles.controls}>
            <ButtonIcon
              variant="secondary"
              icon={<RiAddLine size={16} />}
              onPress={dag.zoomIn}
              aria-label="Zoom in"
            />
            <ButtonIcon
              variant="secondary"
              icon={<RiSubtractLine size={16} />}
              onPress={dag.zoomOut}
              aria-label="Zoom out"
            />
            <ButtonIcon
              variant="secondary"
              icon={<RiFullscreenLine size={16} />}
              onPress={() => dag.fitToView(layout)}
              aria-label="Fit to view"
            />
          </div>

          {/* Hover tooltip */}
          {dag.tooltip.visible && dag.tooltip.node && (
            <div
              data-testid="workflow-dag-inline-tooltip"
              role="tooltip"
              className={styles.tooltip}
              style={{ left: dag.tooltip.x + 12, top: dag.tooltip.y - 10 }}
            >
              <div className={styles.tooltipTitle}>
                {dag.tooltip.node.label}
              </div>
              <div>
                <Text variant="body-x-small" className={styles.tooltipLabel}>
                  Status:
                </Text>{' '}
                <Text
                  variant="body-x-small"
                  className={styles.tooltipStatus}
                  style={{ color: statusColor(dag.tooltip.node.status) }}
                >
                  {dag.tooltip.node.status}
                </Text>
              </div>
              <div>
                <Text variant="body-x-small" className={styles.tooltipLabel}>
                  Duration:
                </Text>{' '}
                {formatDurationSeconds(dag.tooltip.node.duration)}
              </div>
            </div>
          )}
        </div>

        {dag.selectedNode && (
          <NodeDetailPanel
            node={dag.selectedNode}
            onClose={() => dag.setSelectedNode(null)}
          />
        )}
      </Flex>
    </div>
  );
};
