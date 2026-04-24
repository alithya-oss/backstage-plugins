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

import { useState, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  Handle,
  Position,
  type Node as RFNode,
  type Edge as RFEdge,
  type NodeProps,
  type EdgeProps,
  getSmoothStepPath,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { NodeStatus } from '@alithya-oss/backstage-plugin-argo-workflows-common';
import {
  PHASE_ICON_MAP,
  formatDuration,
} from '@alithya-oss/backstage-plugin-argo-workflows-common';
import { computeDAGLayout } from '../src/utils/computeDAGLayout';
import {
  ciPipelineDetail,
  mockWorkflowDetails,
} from '../src/__fixtures__';

/* ── Pill-shaped custom node ─────────────────────────────────── */

const PILL_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Succeeded: { bg: '#dcfce7', border: '#16a34a', text: '#15803d' },
  Failed:    { bg: '#fee2e2', border: '#dc2626', text: '#b91c1c' },
  Error:     { bg: '#fee2e2', border: '#dc2626', text: '#b91c1c' },
  Running:   { bg: '#dbeafe', border: '#2563eb', text: '#1d4ed8' },
  Pending:   { bg: '#fef9c3', border: '#ca8a04', text: '#a16207' },
  Skipped:   { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' },
  Omitted:   { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' },
};

function PillNode({ data }: NodeProps) {
  const node = data.node as NodeStatus;
  const colors = PILL_COLORS[node.phase] ?? PILL_COLORS.Pending;
  const icon = PHASE_ICON_MAP[node.phase] ?? '—';

  return (
    <>
      <Handle type="target" position={Position.Left} style={{ visibility: 'hidden' }} />
      <div
        style={{
          alignItems: 'center',
          background: colors.bg,
          border: `2px solid ${colors.border}`,
          borderRadius: 20,
          color: colors.text,
          display: 'flex',
          fontSize: 12,
          fontWeight: 500,
          gap: 6,
          padding: '6px 14px',
          whiteSpace: 'nowrap',
        }}
        title={`${node.displayName} — ${node.phase} — ${formatDuration(node.duration)}`}
      >
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span>{node.displayName}</span>
        <span style={{ color: colors.border, fontSize: 10, opacity: 0.8 }}>
          {formatDuration(node.duration)}
        </span>
      </div>
      <Handle type="source" position={Position.Right} style={{ visibility: 'hidden' }} />
    </>
  );
}

/* ── Custom edge ─────────────────────────────────────────────── */

const EDGE_COLORS: Record<string, string> = {
  Succeeded: '#16a34a',
  Failed: '#dc2626',
  Error: '#dc2626',
  Running: '#2563eb',
  Pending: '#ca8a04',
  Skipped: '#9ca3af',
  Omitted: '#9ca3af',
};

function StatusEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data,
}: EdgeProps) {
  const phase = (data as any)?.phase ?? 'Pending';
  const [path] = getSmoothStepPath({
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
    borderRadius: 8,
  });
  return (
    <path
      id={id}
      d={path}
      fill="none"
      stroke={EDGE_COLORS[phase] ?? '#9ca3af'}
      strokeWidth={2}
    />
  );
}

const nodeTypes = { pill: PillNode };
const edgeTypes = { status: StatusEdge };

/* ── Preview component ───────────────────────────────────────── */

export function DAGPreview() {
  const workflows = [
    ciPipelineDetail,
    ...Object.values(mockWorkflowDetails),
  ];

  const [selectedIdx, setSelectedIdx] = useState(0);
  const wf = workflows[selectedIdx] ?? ciPipelineDetail;

  const layout = useMemo(() => computeDAGLayout(wf.nodes, { nodeWidth: 200, nodeHeight: 40 }), [wf]);

  const nodeMap = useMemo(() => {
    const m = new Map<string, NodeStatus>();
    for (const pn of layout.nodes) m.set(pn.id, pn.data);
    return m;
  }, [layout]);

  const rfNodes: RFNode[] = useMemo(() =>
    layout.nodes.map(pn => ({
      id: pn.id,
      position: { x: pn.x, y: pn.y },
      type: 'pill',
      data: { node: pn.data },
    })),
  [layout]);

  const rfEdges: RFEdge[] = useMemo(() =>
    layout.edges.map(e => ({
      id: `${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      type: 'status',
      data: { phase: nodeMap.get(e.source)?.phase ?? 'Pending' },
    })),
  [layout, nodeMap]);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {workflows.map((w, i) => (
          <button
            key={w.name}
            type="button"
            onClick={() => setSelectedIdx(i)}
            style={{
              background: i === selectedIdx ? '#2563eb' : '#f3f4f6',
              border: 'none',
              borderRadius: 6,
              color: i === selectedIdx ? '#fff' : '#374151',
              cursor: 'pointer',
              fontSize: 12,
              padding: '6px 12px',
            }}
          >
            {w.name} ({w.phase})
          </button>
        ))}
      </div>
      <div style={{ height: 400, border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}
