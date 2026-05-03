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

import { useCallback, useMemo, useRef, useState } from 'react';
import type { WheelEvent, MouseEvent } from 'react';
import { ButtonIcon, Flex, Text } from '@backstage/ui';
import { buildDAG } from '@backstage-community/plugin-argo-workflows-react';
import type {
  DAGNode,
  DAGGraph,
} from '@backstage-community/plugin-argo-workflows-react';
import type {
  Workflow,
  WorkflowStatus,
} from '@backstage-community/plugin-argo-workflows-common';
import dagre from 'dagre';
import { NodeDetailPanel } from './NodeDetailPanel';
import { RiAddLine, RiSubtractLine, RiFullscreenLine } from '@remixicon/react';
import styles from './WorkflowDAGInline.module.css';

/**
 * Props for the WorkflowDAGInline component.
 * Accepts a Workflow object directly — no routing or fetching needed.
 */
export interface WorkflowDAGInlineProps {
  workflow: Workflow;
}

/** Node dimensions used for dagre layout */
const NODE_WIDTH = 160;
const NODE_HEIGHT = 36;
const NODE_RX = 6;
const PADDING = 30;

function statusColor(status: WorkflowStatus): string {
  switch (status) {
    case 'Succeeded':
      return 'var(--bui-fg-success)';
    case 'Failed':
      return 'var(--bui-fg-danger)';
    case 'Running':
      return 'var(--bui-fg-info)';
    case 'Pending':
      return 'var(--bui-fg-secondary)';
    case 'Error':
      return 'var(--bui-fg-danger)';
    default:
      return 'var(--bui-fg-secondary)';
  }
}

function formatDurationSeconds(seconds?: number): string {
  if (seconds === undefined || seconds === null) return '—';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
}

interface LayoutNode extends DAGNode {
  x: number;
  y: number;
}

interface LayoutEdge {
  source: string;
  target: string;
  points: Array<{ x: number; y: number }>;
}

function computeLayout(graph: DAGGraph): {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
} {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 60 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of graph.nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const edge of graph.edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  const layoutNodes: LayoutNode[] = graph.nodes.map(node => {
    const pos = g.node(node.id);
    return { ...node, x: pos.x, y: pos.y };
  });

  const layoutEdges: LayoutEdge[] = graph.edges.map(edge => {
    const dagreEdge = g.edge(edge.source, edge.target);
    return {
      source: edge.source,
      target: edge.target,
      points: dagreEdge.points as Array<{ x: number; y: number }>,
    };
  });

  const dagreGraph = g.graph();
  const width = (dagreGraph.width ?? 0) + PADDING * 2;
  const height = (dagreGraph.height ?? 0) + PADDING * 2;

  return { nodes: layoutNodes, edges: layoutEdges, width, height };
}

function buildEdgePath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  return d;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  node: DAGNode | null;
}

/**
 * Inline DAG visualization for a workflow.
 * Renders directly from a Workflow object without fetching or routing.
 * Designed to be displayed inside an expandable table row.
 * Clicking a node opens a detail panel alongside the graph.
 */
export const WorkflowDAGInline = ({ workflow }: WorkflowDAGInlineProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({
    x: PADDING,
    y: PADDING,
    scale: 1,
  });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    node: null,
  });
  const [selectedNode, setSelectedNode] = useState<DAGNode | null>(null);

  const handleWheel = useCallback((e: WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const scaleFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setTransform(prev => {
      const newScale = Math.min(Math.max(prev.scale * scaleFactor, 0.3), 3);
      const svgRect = svgRef.current?.getBoundingClientRect();
      if (!svgRect) return { ...prev, scale: newScale };
      const mouseX = e.clientX - svgRect.left;
      const mouseY = e.clientY - svgRect.top;
      const newX = mouseX - (mouseX - prev.x) * (newScale / prev.scale);
      const newY = mouseY - (mouseY - prev.y) * (newScale / prev.scale);
      return { x: newX, y: newY, scale: newScale };
    });
  }, []);

  const handleMouseDown = useCallback(
    (e: MouseEvent<SVGSVGElement>) => {
      if (e.button === 0) {
        setIsPanning(true);
        setPanStart({
          x: e.clientX - transform.x,
          y: e.clientY - transform.y,
        });
      }
    },
    [transform.x, transform.y],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent<SVGSVGElement>) => {
      if (isPanning) {
        setTransform(prev => ({
          ...prev,
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        }));
      }
    },
    [isPanning, panStart.x, panStart.y],
  );

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  const handleNodeMouseEnter = useCallback((e: MouseEvent, node: DAGNode) => {
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;
    setTooltip({
      visible: true,
      x: e.clientX - svgRect.left,
      y: e.clientY - svgRect.top,
      node,
    });
  }, []);

  const handleNodeMouseLeave = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  const handleNodeClick = useCallback((node: DAGNode) => {
    setSelectedNode(prev => (prev?.id === node.id ? null : node));
  }, []);

  const handleNodeKeyDown = useCallback(
    (e: React.KeyboardEvent, node: DAGNode) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleNodeClick(node);
      }
    },
    [handleNodeClick],
  );

  const layout = useMemo(() => {
    const workflowNodes = workflow.status.nodes ?? {};
    if (Object.keys(workflowNodes).length === 0) return null;
    try {
      const graph = buildDAG(workflow);
      return computeLayout(graph);
    } catch {
      return null;
    }
  }, [workflow]);

  const handleZoomIn = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      scale: Math.min(prev.scale * 1.25, 3),
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      scale: Math.max(prev.scale * 0.8, 0.3),
    }));
  }, []);

  const handleFit = useCallback(() => {
    if (!layout || !svgRef.current) return;
    const svgRect = svgRef.current.getBoundingClientRect();
    const scaleX = svgRect.width / layout.width;
    const scaleY = svgRect.height / layout.height;
    const newScale = Math.min(scaleX, scaleY, 1) * 0.9;
    const newX = (svgRect.width - layout.width * newScale) / 2;
    const newY = (svgRect.height - layout.height * newScale) / 2;
    setTransform({ x: newX, y: newY, scale: newScale });
  }, [layout]);

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
            ref={svgRef}
            width="100%"
            height="100%"
            className={`${styles.svg} ${isPanning ? styles.panning : ''}`}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
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
              transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}
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
                const isSelected = selectedNode?.id === node.id;
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x - NODE_WIDTH / 2}, ${
                      node.y - NODE_HEIGHT / 2
                    })`}
                    onMouseEnter={e => handleNodeMouseEnter(e, node)}
                    onMouseLeave={handleNodeMouseLeave}
                    onClick={() => handleNodeClick(node)}
                    onKeyDown={e => handleNodeKeyDown(e, node)}
                    className={styles.node}
                    role="button"
                    aria-label={`${node.label}: ${node.status}`}
                    aria-pressed={isSelected}
                    tabIndex={0}
                  >
                    <rect
                      width={NODE_WIDTH}
                      height={NODE_HEIGHT}
                      rx={NODE_RX}
                      ry={NODE_RX}
                      fill={statusColor(node.status)}
                      stroke={isSelected ? '#ffffff' : 'none'}
                      strokeWidth={isSelected ? 3 : 0}
                    />
                    <text
                      x={NODE_WIDTH / 2}
                      y={NODE_HEIGHT / 2}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#ffffff"
                      fontSize={11}
                      fontFamily="sans-serif"
                    >
                      {node.label.length > 18
                        ? `${node.label.substring(0, 16)}…`
                        : node.label}
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
              onPress={handleZoomIn}
              aria-label="Zoom in"
            />
            <ButtonIcon
              variant="secondary"
              icon={<RiSubtractLine size={16} />}
              onPress={handleZoomOut}
              aria-label="Zoom out"
            />
            <ButtonIcon
              variant="secondary"
              icon={<RiFullscreenLine size={16} />}
              onPress={handleFit}
              aria-label="Fit to view"
            />
          </div>

          {/* Hover tooltip */}
          {tooltip.visible && tooltip.node && (
            <div
              data-testid="workflow-dag-inline-tooltip"
              role="tooltip"
              className={styles.tooltip}
              style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
            >
              <div className={styles.tooltipTitle}>{tooltip.node.label}</div>
              <div>
                <Text variant="body-x-small" className={styles.tooltipLabel}>
                  Status:
                </Text>{' '}
                <Text
                  variant="body-x-small"
                  className={styles.tooltipStatus}
                  style={{ color: statusColor(tooltip.node.status) }}
                >
                  {tooltip.node.status}
                </Text>
              </div>
              <div>
                <Text variant="body-x-small" className={styles.tooltipLabel}>
                  Duration:
                </Text>{' '}
                {formatDurationSeconds(tooltip.node.duration)}
              </div>
            </div>
          )}
        </div>

        {/* Detail panel — shown when a node is selected */}
        {selectedNode && (
          <NodeDetailPanel
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </Flex>
    </div>
  );
};
