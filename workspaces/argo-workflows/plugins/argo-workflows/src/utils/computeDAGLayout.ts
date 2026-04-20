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

import dagre from '@dagrejs/dagre';
import type {
  DAGLayout,
  NodeStatus,
  PositionedNode,
  LayoutEdge,
} from '@alithya-oss/backstage-plugin-argo-workflows-common';

const BOUNDARY_TYPES = new Set(['DAG', 'Steps', 'StepGroup']);
const DEFAULT_NODE_WIDTH = 180;
const DEFAULT_NODE_HEIGHT = 60;
const RANK_SEP = 50;
const NODE_SEP = 30;

/**
 * Options for the DAG layout computation.
 * @public
 */
export interface ComputeDAGLayoutOptions {
  /** Node width in pixels (default: 180) */
  nodeWidth?: number;
  /** Node height in pixels (default: 60) */
  nodeHeight?: number;
}

/**
 * Computes a positioned DAG layout using dagre.
 *
 * Transforms a flat NodeStatus array into positioned nodes with x/y coordinates
 * and edges with routing points. Boundary nodes are filtered out.
 * Coordinates are top-left (converted from dagre's center coordinates).
 *
 * @public
 */
export function computeDAGLayout(
  nodes: NodeStatus[],
  options?: ComputeDAGLayoutOptions,
): DAGLayout {
  const empty: DAGLayout = { nodes: [], edges: [] };
  if (!nodes || nodes.length === 0) return empty;

  const nodeWidth = options?.nodeWidth ?? DEFAULT_NODE_WIDTH;
  const nodeHeight = options?.nodeHeight ?? DEFAULT_NODE_HEIGHT;

  // Filter out boundary nodes
  const execNodes = nodes.filter(n => !BOUNDARY_TYPES.has(n.type));
  if (execNodes.length === 0) return empty;

  // Build node map for lookup
  const nodeMap = new Map<string, NodeStatus>();
  for (const node of execNodes) {
    nodeMap.set(node.id, node);
  }

  // Create dagre graph
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', ranksep: RANK_SEP, nodesep: NODE_SEP });
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes
  for (const node of execNodes) {
    g.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  }

  // Add edges (only between execution nodes)
  for (const node of execNodes) {
    for (const childId of node.children ?? []) {
      if (nodeMap.has(childId)) {
        g.setEdge(node.id, childId);
      }
    }
  }

  // Run layout
  dagre.layout(g);

  // Extract positioned nodes (convert center → top-left coordinates)
  const positionedNodes: PositionedNode[] = g.nodes().map(id => {
    const layoutNode = g.node(id);
    return {
      id,
      x: layoutNode.x - nodeWidth / 2,
      y: layoutNode.y - nodeHeight / 2,
      width: nodeWidth,
      height: nodeHeight,
      data: nodeMap.get(id)!,
    };
  });

  // Extract edges with routing points
  const layoutEdges: LayoutEdge[] = g.edges().map(e => {
    const edgeData = g.edge(e);
    return {
      source: e.v,
      target: e.w,
      points: edgeData.points ?? [],
    };
  });

  return { nodes: positionedNodes, edges: layoutEdges };
}
