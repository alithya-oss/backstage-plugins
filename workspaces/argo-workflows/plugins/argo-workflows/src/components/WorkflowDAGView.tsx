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
import { useParams } from 'react-router-dom';
import { Alert, ButtonIcon, Flex, Skeleton, Text } from '@backstage/ui';
import {
  useArgoWorkflowDetail,
  buildDAG,
} from '@alithya-oss/backstage-plugin-argo-workflows-react';
import { RiAddLine, RiSubtractLine, RiFullscreenLine } from '@remixicon/react';
import { NodeDetailPanel } from './NodeDetailPanel';
import {
  DAG_VIEW_CONFIG,
  statusColor,
  formatDurationSeconds,
  computeLayout,
  buildEdgePath,
  truncateLabel,
  useDAGInteraction,
} from './dagHelpers';
import styles from './WorkflowDAGView.module.css';

const cfg = DAG_VIEW_CONFIG;

/**
 * Props for the WorkflowDAGView component.
 */
export interface WorkflowDAGViewProps {
  instanceName?: string;
}

/**
 * Displays the DAG visualization for a single Argo Workflow execution.
 *
 * Loads the workflow detail, constructs the graph with `buildDAG`,
 * computes layout with `dagre`, and renders an interactive SVG with
 * zoom/pan support, status-colored nodes, and a detail panel on click.
 */
export const WorkflowDAGView = ({ instanceName }: WorkflowDAGViewProps) => {
  const { namespace = '', name = '' } = useParams<{
    namespace: string;
    name: string;
  }>();

  const { workflow, loading, error } = useArgoWorkflowDetail({
    namespace,
    name,
    instanceName,
  });

  const dag = useDAGInteraction(cfg);

  const layout = useMemo(() => {
    if (!workflow) return null;
    const workflowNodes = workflow.status.nodes ?? {};
    if (Object.keys(workflowNodes).length === 0) return null;
    try {
      return computeLayout(buildDAG(workflow), cfg);
    } catch {
      return null;
    }
  }, [workflow]);

  if (loading) {
    return (
      <div
        data-testid="workflow-dag-loading"
        aria-live="polite"
        aria-busy="true"
      >
        <Skeleton style={{ height: 600, width: '100%' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="workflow-dag-error">
        <Alert
          status="danger"
          icon
          title="Failed to load workflow"
          description={error.message}
        />
      </div>
    );
  }

  if (!workflow || !layout) {
    return (
      <div data-testid="workflow-dag-empty" role="status">
        <Alert
          status="info"
          icon
          title="No tasks"
          description="This workflow does not contain any tasks."
        />
      </div>
    );
  }

  const { nodes, edges } = layout;

  return (
    <div data-testid="workflow-dag-view" className={styles.root}>
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
            aria-label={`DAG for workflow ${name}`}
            aria-describedby="workflow-dag-text-description"
          >
            <defs>
              <marker
                id="arrowhead"
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
                  markerEnd="url(#arrowhead)"
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
                    onFocus={() => dag.nodeHandlers.onFocus(node)}
                    onBlur={dag.nodeHandlers.onBlur}
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
              id="workflow-dag-tooltip"
              data-testid="workflow-dag-tooltip"
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

      {/* Accessible text alternative */}
      <details
        id="workflow-dag-text-description"
        data-testid="workflow-dag-text-description"
        className={styles.srOnly}
      >
        <summary>Text description of the DAG</summary>
        <Text variant="body-small">
          Workflow {name} contains {nodes.length} node
          {nodes.length > 1 ? 's' : ''} and {edges.length} dependency
          {edges.length > 1 ? 'ies' : 'y'}.
        </Text>
        <ul>
          {nodes.map(node => (
            <li key={node.id}>
              {node.label} — {node.status}
              {node.duration !== undefined
                ? ` (${formatDurationSeconds(node.duration)})`
                : ''}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
};
