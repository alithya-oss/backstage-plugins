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

import { useMemo, useEffect, type KeyboardEvent } from 'react';
import {
  ReactFlow,
  Controls,
  Handle,
  Position,
  useReactFlow,
  type Node as RFNode,
  type Edge as RFEdge,
  type NodeProps,
  type EdgeProps,
  getSmoothStepPath,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiRefreshLine,
  RiTimeLine,
  RiIndeterminateCircleLine,
  RiSubtractLine,
} from '@remixicon/react';
import type {
  NodeStatus,
  NodePhase,
} from '@alithya-oss/backstage-plugin-argo-workflows-common';
import { formatDuration } from '@alithya-oss/backstage-plugin-argo-workflows-common';
import { computeDAGLayout } from '../../utils/computeDAGLayout';
import styles from './DAGFlowView.module.css';

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

/* ── Pill-shaped custom node ─────────────────────────────────── */

/* ── Phase icon mapping (same remix icons as the table) ───────── */

const ICON_SIZE = 16;

function PhaseIcon({ phase }: { phase: NodePhase }) {
  switch (phase) {
    case 'Succeeded':
      return (
        <RiCheckboxCircleLine size={ICON_SIZE} className={styles.iconSuccess} />
      );
    case 'Failed':
      return (
        <RiErrorWarningLine size={ICON_SIZE} className={styles.iconDanger} />
      );
    case 'Error':
      return (
        <RiErrorWarningLine size={ICON_SIZE} className={styles.iconDanger} />
      );
    case 'Running':
      return <RiRefreshLine size={ICON_SIZE} className={styles.iconInfo} />;
    case 'Pending':
      return <RiTimeLine size={ICON_SIZE} className={styles.iconWarning} />;
    case 'Skipped':
      return (
        <RiIndeterminateCircleLine
          size={ICON_SIZE}
          className={styles.iconNeutral}
        />
      );
    case 'Omitted':
      return <RiSubtractLine size={ICON_SIZE} className={styles.iconNeutral} />;
    default:
      return <RiTimeLine size={ICON_SIZE} className={styles.iconNeutral} />;
  }
}

/* ── Border color per phase ──────────────────────────────────── */

const PILL_BORDER: Record<string, string> = {
  Succeeded: 'var(--bui-fg-success, #16a34a)',
  Failed: 'var(--bui-fg-danger, #dc2626)',
  Error: 'var(--bui-fg-danger, #dc2626)',
  Running: 'var(--bui-fg-info, #2563eb)',
  Pending: 'var(--bui-fg-warning, #ca8a04)',
  Skipped: 'var(--bui-fg-tertiary, #9ca3af)',
  Omitted: 'var(--bui-fg-tertiary, #9ca3af)',
};

function PillNode({ data }: NodeProps) {
  const nodeData = data as unknown as {
    node: NodeStatus;
    isSelected: boolean;
    onNodeClick?: (id: string) => void;
  };
  const node = nodeData.node;
  const borderColor = PILL_BORDER[node.phase] ?? PILL_BORDER.Pending;

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        style={{ visibility: 'hidden' }}
      />
      <div
        className={`${styles.pill}${
          nodeData.isSelected ? ` ${styles.pillSelected}` : ''
        }`}
        style={{
          borderColor,
        }}
        role="button"
        tabIndex={0}
        onClick={
          nodeData.onNodeClick
            ? () => nodeData.onNodeClick!(node.id)
            : undefined
        }
        onKeyDown={
          nodeData.onNodeClick
            ? (e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  nodeData.onNodeClick!(node.id);
                }
              }
            : undefined
        }
        title={`${node.displayName} — ${node.phase} — ${formatDuration(
          node.duration,
        )}`}
        data-testid={`dag-node-${node.id}`}
      >
        <PhaseIcon phase={node.phase} />
        <span className={styles.pillName}>{node.displayName}</span>
        <span className={styles.pillDuration}>
          {formatDuration(node.duration)}
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ visibility: 'hidden' }}
      />
    </>
  );
}

/* ── Custom edge ─────────────────────────────────────────────── */

const EDGE_COLORS: Record<string, string> = {
  Succeeded: 'var(--bui-fg-success, #16a34a)',
  Failed: 'var(--bui-fg-danger, #dc2626)',
  Error: 'var(--bui-fg-danger, #dc2626)',
  Running: 'var(--bui-fg-info, #2563eb)',
  Pending: 'var(--bui-fg-warning, #ca8a04)',
  Skipped: 'var(--bui-fg-tertiary, #9ca3af)',
  Omitted: 'var(--bui-fg-tertiary, #9ca3af)',
};

function StatusEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const phase = (data as any)?.phase ?? 'Pending';
  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 8,
  });
  return (
    <path
      id={id}
      d={path}
      fill="none"
      stroke={EDGE_COLORS[phase] ?? 'var(--bui-fg-tertiary, #9ca3af)'}
      strokeWidth={2}
    />
  );
}

const nodeTypes = { pill: PillNode };
const edgeTypes = { status: StatusEdge };

/* ── Auto-fit helper ─────────────────────────────────────────── */

/**
 * Triggers fitView whenever `selectedNodeId` changes (panel open/close),
 * giving the container a moment to resize first.
 */
function FitViewOnChange({ selectedNodeId }: { selectedNodeId?: string }) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    const timer = setTimeout(() => fitView({ duration: 200 }), 50);
    return () => clearTimeout(timer);
  }, [selectedNodeId, fitView]);
  return null;
}

/* ── Main component ──────────────────────────────────────────── */

function buildAriaLabel(nodes: NodeStatus[]): string {
  const counts: Record<string, number> = {};
  for (const n of nodes) {
    counts[n.phase] = (counts[n.phase] ?? 0) + 1;
  }
  const parts = Object.entries(counts).map(
    ([phase, count]) => `${count} ${phase.toLowerCase()}`,
  );
  return `Workflow execution graph with ${nodes.length} nodes: ${parts.join(
    ', ',
  )}`;
}

/**
 * Inline DAG visualization using React Flow with pill-shaped nodes.
 *
 * Renders workflow nodes positioned by dagre with smooth step edges,
 * zoom/fit controls, and phase-colored styling.
 *
 * @public
 */
export function DAGFlowView({
  nodes,
  selectedNodeId,
  onNodeClick,
  fullViewUrl,
}: DAGFlowViewProps) {
  // Create a stable key from node IDs so React Flow remounts when the workflow changes
  const flowKey = useMemo(
    () =>
      nodes
        .map(n => n.id)
        .sort()
        .join(','),
    [nodes],
  );

  const layout = useMemo(
    () => computeDAGLayout(nodes, { nodeWidth: 200, nodeHeight: 40 }),
    [nodes],
  );

  const nodeMap = useMemo(() => {
    const map = new Map<string, NodeStatus>();
    for (const pn of layout.nodes) {
      map.set(pn.id, pn.data);
    }
    return map;
  }, [layout]);

  const rfNodes: RFNode[] = useMemo(
    () =>
      layout.nodes.map(pn => ({
        id: pn.id,
        position: { x: pn.x, y: pn.y },
        type: 'pill',
        data: {
          node: pn.data,
          isSelected: pn.id === selectedNodeId,
          onNodeClick,
        },
      })),
    [layout, selectedNodeId, onNodeClick],
  );

  const rfEdges: RFEdge[] = useMemo(
    () =>
      layout.edges.map(e => ({
        id: `${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        type: 'status',
        data: { phase: nodeMap.get(e.source)?.phase ?? 'Pending' },
      })),
    [layout, nodeMap],
  );

  if (layout.nodes.length === 0) {
    return (
      <div className={styles.empty} data-testid="dag-empty">
        This workflow has no execution nodes.
      </div>
    );
  }

  return (
    <div
      className={styles.flowContainer}
      data-testid="dag-flow-view"
      role="group"
      aria-label={buildAriaLabel(layout.nodes.map(n => n.data))}
    >
      {fullViewUrl && (
        <a
          href={fullViewUrl}
          className={styles.fullViewLink}
          data-testid="dag-full-view-link"
        >
          Full View ↗
        </a>
      )}
      <ReactFlow
        key={flowKey}
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Controls showInteractive={false} />
        <FitViewOnChange selectedNodeId={selectedNodeId} />
      </ReactFlow>
    </div>
  );
}
