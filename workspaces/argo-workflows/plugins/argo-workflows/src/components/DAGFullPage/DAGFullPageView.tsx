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

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Handle,
  Position,
  type Node as RFNode,
  type Edge as RFEdge,
  type NodeProps,
  type EdgeProps,
  getSmoothStepPath,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { NodeStatus } from '@backstage-community/plugin-argo-workflows-common';
import { useWorkflowDetail } from '../../hooks';
import { computeDAGLayout } from '../../utils/computeDAGLayout';
import { DAGNodeCard } from '../DAGCardFlow/DAGNodeCard';
import { NodeDetailPanel } from '../NodeDetailPanel';
import styles from './DAGFullPageView.module.css';

const FAILURE_PHASES = new Set(['Failed', 'Error']);
const SUCCESS_PHASES = new Set(['Succeeded']);

function getEdgeColor(phase: string): string {
  if (FAILURE_PHASES.has(phase)) return 'var(--bui-fg-danger, #dc2626)';
  if (SUCCESS_PHASES.has(phase)) return 'var(--bui-fg-success, #16a34a)';
  return 'var(--bui-fg-tertiary, #9ca3af)';
}

/** Custom React Flow node wrapping DAGNodeCard. */
function DAGCustomNode({ data }: NodeProps) {
  const nodeData = data as { node: NodeStatus; isSelected: boolean; onNodeClick?: (id: string) => void };
  return (
    <>
      <Handle type="target" position={Position.Left} style={{ visibility: 'hidden' }} />
      <DAGNodeCard
        node={nodeData.node}
        isSelected={nodeData.isSelected}
        onClick={nodeData.onNodeClick ? () => nodeData.onNodeClick!(nodeData.node.id) : undefined}
      />
      <Handle type="source" position={Position.Right} style={{ visibility: 'hidden' }} />
    </>
  );
}

/** Custom React Flow edge colored by source phase. */
function DAGCustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const phase = (data as { phase?: string })?.phase ?? 'Pending';
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  return (
    <path
      id={id}
      d={edgePath}
      fill="none"
      stroke={getEdgeColor(phase)}
      strokeWidth={1.5}
    />
  );
}

const nodeTypes = { dagNode: DAGCustomNode };
const edgeTypes = { dagEdge: DAGCustomEdge };

/**
 * Full-page DAG view with React Flow zoom, pan, minimap, and controls.
 *
 * @public
 */
export function DAGFullPageView() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();
  const navigate = useNavigate();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const { workflow, loading, error } = useWorkflowDetail(
    namespace ?? '',
    name ?? '',
  );

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(prev => (prev === nodeId ? null : nodeId));
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  useEffect(() => {
    if (!selectedNodeId) return undefined;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedNodeId(null);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selectedNodeId]);

  const layout = useMemo(
    () => (workflow ? computeDAGLayout(workflow.nodes) : null),
    [workflow],
  );

  const rfNodes: RFNode[] = useMemo(() => {
    if (!layout) return [];
    return layout.nodes.map(pn => ({
      id: pn.id,
      position: { x: pn.x, y: pn.y },
      type: 'dagNode' as const,
      data: {
        node: pn.data,
        isSelected: pn.id === selectedNodeId,
        onNodeClick: handleNodeClick,
      },
    }));
  }, [layout, selectedNodeId, handleNodeClick]);

  const nodeMap = useMemo(() => {
    if (!layout) return new Map<string, NodeStatus>();
    const map = new Map<string, NodeStatus>();
    for (const pn of layout.nodes) {
      map.set(pn.id, pn.data);
    }
    return map;
  }, [layout]);

  const rfEdges: RFEdge[] = useMemo(() => {
    if (!layout) return [];
    return layout.edges.map(e => ({
      id: `${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      type: 'dagEdge' as const,
      data: { phase: nodeMap.get(e.source)?.phase ?? 'Pending' },
    }));
  }, [layout, nodeMap]);

  const selectedNode = selectedNodeId
    ? nodeMap.get(selectedNodeId) ?? null
    : null;

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
          <span className={styles.title}>
            {namespace}/{name}
          </span>
        </div>
        <div className={styles.loading}>Loading workflow…</div>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className={styles.page}>
        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
        </div>
        <div className={styles.loading}>
          {error ? `Error: ${error.message}` : 'Workflow not found'}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page} data-testid="dag-full-page">
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate(-1)}
          data-testid="back-button"
        >
          ← Back
        </button>
        <span className={styles.title}>
          {workflow.name}
        </span>
      </div>
      <div className={styles.content}>
        <div className={styles.flowContainer}>
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
            <MiniMap />
            <Controls />
          </ReactFlow>
        </div>
        {selectedNode && (
          <NodeDetailPanel node={selectedNode} onClose={handleClosePanel} />
        )}
      </div>
    </div>
  );
}
