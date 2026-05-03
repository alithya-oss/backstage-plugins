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

import { useCallback, useRef, useState } from 'react';
import type { WheelEvent, MouseEvent, KeyboardEvent, RefObject } from 'react';
import type {
  DAGNode,
  DAGGraph,
} from '@alithya-oss/backstage-plugin-argo-workflows-react';
import type { WorkflowStatus } from '@alithya-oss/backstage-plugin-argo-workflows-common';
import dagre from 'dagre';

// ─── Types ──────────────────────────────────────────────────────────────────

/** Positioned node after dagre layout. */
export interface LayoutNode extends DAGNode {
  x: number;
  y: number;
}

/** Positioned edge after dagre layout. */
export interface LayoutEdge {
  source: string;
  target: string;
  points: Array<{ x: number; y: number }>;
}

/** Result of a dagre layout computation. */
export interface LayoutResult {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
}

/** Tooltip positioning and content state. */
export interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  node: DAGNode | null;
}

/** Pan/zoom transform state. */
export interface TransformState {
  x: number;
  y: number;
  scale: number;
}

/** Configuration for node dimensions and layout spacing. */
export interface DAGLayoutConfig {
  nodeWidth: number;
  nodeHeight: number;
  nodeRx: number;
  padding: number;
  nodesep?: number;
  ranksep?: number;
  /** Maximum characters before truncating the node label. */
  labelMaxChars: number;
  /** Font size for node labels. */
  fontSize: number;
  /** Minimum zoom scale. */
  minScale: number;
  /** Maximum zoom scale. */
  maxScale: number;
}

// ─── Preset configs ─────────────────────────────────────────────────────────

/** Layout config for the full-page DAG view. */
export const DAG_VIEW_CONFIG: DAGLayoutConfig = {
  nodeWidth: 180,
  nodeHeight: 40,
  nodeRx: 8,
  padding: 40,
  nodesep: 50,
  ranksep: 80,
  labelMaxChars: 20,
  fontSize: 12,
  minScale: 0.1,
  maxScale: 5,
};

/** Layout config for the inline (table-row) DAG view. */
export const DAG_INLINE_CONFIG: DAGLayoutConfig = {
  nodeWidth: 160,
  nodeHeight: 36,
  nodeRx: 6,
  padding: 30,
  nodesep: 40,
  ranksep: 60,
  labelMaxChars: 18,
  fontSize: 11,
  minScale: 0.3,
  maxScale: 3,
};

// ─── Pure functions ─────────────────────────────────────────────────────────

/**
 * Returns a BUI CSS variable for a given workflow status.
 */
export function statusColor(status: WorkflowStatus): string {
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

/**
 * Formats a duration in seconds into a human-readable string.
 */
export function formatDurationSeconds(seconds?: number): string {
  if (seconds === undefined || seconds === null) return '—';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
}

/**
 * Computes the dagre layout for a DAG graph using the given config.
 */
export function computeLayout(
  graph: DAGGraph,
  config: DAGLayoutConfig,
): LayoutResult {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: 'LR',
    nodesep: config.nodesep ?? 40,
    ranksep: config.ranksep ?? 60,
  });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of graph.nodes) {
    g.setNode(node.id, {
      width: config.nodeWidth,
      height: config.nodeHeight,
    });
  }
  for (const edge of graph.edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  const nodes: LayoutNode[] = graph.nodes.map(node => {
    const pos = g.node(node.id);
    return { ...node, x: pos.x, y: pos.y };
  });

  const edges: LayoutEdge[] = graph.edges.map(edge => {
    const dagreEdge = g.edge(edge.source, edge.target);
    return {
      source: edge.source,
      target: edge.target,
      points: dagreEdge.points as Array<{ x: number; y: number }>,
    };
  });

  const dagreGraph = g.graph();
  const width = (dagreGraph.width ?? 0) + config.padding * 2;
  const height = (dagreGraph.height ?? 0) + config.padding * 2;

  return { nodes, edges, width, height };
}

/**
 * Builds an SVG path string from an array of points.
 */
export function buildEdgePath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  return d;
}

/**
 * Truncates a label to the configured max length with an ellipsis.
 */
export function truncateLabel(label: string, maxChars: number): string {
  return label.length > maxChars
    ? `${label.substring(0, maxChars - 2)}…`
    : label;
}

// ─── Interaction hook ───────────────────────────────────────────────────────

/** Return type of the `useDAGInteraction` hook. */
export interface DAGInteraction {
  svgRef: RefObject<SVGSVGElement>;
  transform: TransformState;
  isPanning: boolean;
  tooltip: TooltipState;
  selectedNode: DAGNode | null;
  setSelectedNode: (node: DAGNode | null) => void;
  handlers: {
    onWheel: (e: WheelEvent<SVGSVGElement>) => void;
    onMouseDown: (e: MouseEvent<SVGSVGElement>) => void;
    onMouseMove: (e: MouseEvent<SVGSVGElement>) => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
  };
  nodeHandlers: {
    onMouseEnter: (e: MouseEvent, node: DAGNode) => void;
    onMouseLeave: () => void;
    onClick: (node: DAGNode) => void;
    onKeyDown: (e: KeyboardEvent, node: DAGNode) => void;
    onFocus: (node: DAGNode) => void;
    onBlur: () => void;
  };
  zoomIn: () => void;
  zoomOut: () => void;
  fitToView: (layout: LayoutResult) => void;
}

/**
 * Hook that encapsulates all DAG pan/zoom, tooltip, and node selection logic.
 * Both `WorkflowDAGView` and `WorkflowDAGInline` use this hook.
 */
export function useDAGInteraction(config: DAGLayoutConfig): DAGInteraction {
  const svgRef = useRef<SVGSVGElement>(null) as RefObject<SVGSVGElement>;
  const [transform, setTransform] = useState<TransformState>({
    x: config.padding,
    y: config.padding,
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

  // ── SVG-level handlers ──

  const onWheel = useCallback(
    (e: WheelEvent<SVGSVGElement>) => {
      e.preventDefault();
      const scaleFactor = e.deltaY < 0 ? 1.1 : 0.9;
      setTransform(prev => {
        const newScale = Math.min(
          Math.max(prev.scale * scaleFactor, config.minScale),
          config.maxScale,
        );
        const svgRect = svgRef.current?.getBoundingClientRect();
        if (!svgRect) return { ...prev, scale: newScale };
        const mouseX = e.clientX - svgRect.left;
        const mouseY = e.clientY - svgRect.top;
        const newX = mouseX - (mouseX - prev.x) * (newScale / prev.scale);
        const newY = mouseY - (mouseY - prev.y) * (newScale / prev.scale);
        return { x: newX, y: newY, scale: newScale };
      });
    },
    [config.minScale, config.maxScale],
  );

  const onMouseDown = useCallback(
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

  const onMouseMove = useCallback(
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

  const onMouseUp = useCallback(() => setIsPanning(false), []);

  const onMouseLeave = useCallback(() => {
    setIsPanning(false);
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  // ── Node-level handlers ──

  const onNodeMouseEnter = useCallback((e: MouseEvent, node: DAGNode) => {
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;
    setTooltip({
      visible: true,
      x: e.clientX - svgRect.left,
      y: e.clientY - svgRect.top,
      node,
    });
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  const onNodeClick = useCallback((node: DAGNode) => {
    setSelectedNode(prev => (prev?.id === node.id ? null : node));
  }, []);

  const onNodeKeyDown = useCallback(
    (e: KeyboardEvent, node: DAGNode) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onNodeClick(node);
      }
    },
    [onNodeClick],
  );

  const onNodeFocus = useCallback((node: DAGNode) => {
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;
    setTooltip({
      visible: true,
      x: svgRect.width / 2,
      y: svgRect.height / 2,
      node,
    });
  }, []);

  const onNodeBlur = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  // ── Zoom controls ──

  const zoomIn = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      scale: Math.min(prev.scale * 1.25, config.maxScale),
    }));
  }, [config.maxScale]);

  const zoomOut = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      scale: Math.max(prev.scale * 0.8, config.minScale),
    }));
  }, [config.minScale]);

  const fitToView = useCallback((layout: LayoutResult) => {
    if (!svgRef.current) return;
    const svgRect = svgRef.current.getBoundingClientRect();
    const scaleX = svgRect.width / layout.width;
    const scaleY = svgRect.height / layout.height;
    const newScale = Math.min(scaleX, scaleY, 1) * 0.9;
    const newX = (svgRect.width - layout.width * newScale) / 2;
    const newY = (svgRect.height - layout.height * newScale) / 2;
    setTransform({ x: newX, y: newY, scale: newScale });
  }, []);

  return {
    svgRef,
    transform,
    isPanning,
    tooltip,
    selectedNode,
    setSelectedNode,
    handlers: { onWheel, onMouseDown, onMouseMove, onMouseUp, onMouseLeave },
    nodeHandlers: {
      onMouseEnter: onNodeMouseEnter,
      onMouseLeave: onNodeMouseLeave,
      onClick: onNodeClick,
      onKeyDown: onNodeKeyDown,
      onFocus: onNodeFocus,
      onBlur: onNodeBlur,
    },
    zoomIn,
    zoomOut,
    fitToView,
  };
}
