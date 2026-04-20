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

import type { DAGColumn, NodeStatus } from './types';

const BOUNDARY_TYPES = new Set(['DAG', 'Steps', 'StepGroup']);

/**
 * Transforms a flat NodeStatus array into ordered columns for horizontal DAG rendering.
 *
 * Uses Kahn's algorithm (BFS topological sort) to group nodes by execution stage.
 * Boundary nodes (DAG, Steps, StepGroup) are filtered out — only execution nodes appear.
 *
 * @deprecated Use {@link computeDAGLayout} from `./computeDAGLayout` instead.
 * This function returns column-based grouping without x/y positions.
 * `computeDAGLayout` returns precise positions using dagre.
 *
 * @public
 */
export function computeDAGColumns(nodes: NodeStatus[]): DAGColumn[] {
  if (!nodes || nodes.length === 0) return [];

  // Filter out boundary nodes
  const execNodes = nodes.filter(n => !BOUNDARY_TYPES.has(n.type));
  if (execNodes.length === 0) return [];

  // Build node map and initialize in-degree to 0
  const nodeMap = new Map<string, NodeStatus>();
  const inDegree = new Map<string, number>();
  for (const node of execNodes) {
    nodeMap.set(node.id, node);
    inDegree.set(node.id, 0);
  }

  // Compute in-degrees from children edges (only between execution nodes)
  for (const node of execNodes) {
    for (const childId of node.children ?? []) {
      if (nodeMap.has(childId)) {
        inDegree.set(childId, (inDegree.get(childId) ?? 0) + 1);
      }
    }
  }

  // BFS level-by-level (Kahn's algorithm)
  let queue = [...nodeMap.keys()].filter(id => inDegree.get(id) === 0);
  const columns: DAGColumn[] = [];

  while (queue.length > 0) {
    const levelNodes = queue.map(id => nodeMap.get(id)!);
    columns.push({
      nodes: levelNodes,
      isParallel: levelNodes.length > 1,
    });

    const nextQueue: string[] = [];
    for (const id of queue) {
      const node = nodeMap.get(id)!;
      for (const childId of node.children ?? []) {
        if (!nodeMap.has(childId)) continue;
        const newDeg = (inDegree.get(childId) ?? 1) - 1;
        inDegree.set(childId, newDeg);
        if (newDeg === 0) {
          nextQueue.push(childId);
        }
      }
    }
    queue = nextQueue;
  }

  return columns;
}
