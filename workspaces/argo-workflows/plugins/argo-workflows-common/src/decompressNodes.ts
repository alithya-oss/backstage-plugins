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

import type { DAGGroup, DecompressedNodes, NodePhase, NodeStatus } from './types';

const BOUNDARY_TYPES = new Set(['DAG', 'Steps', 'StepGroup']);

function aggregatePhase(childNodes: NodeStatus[]): NodePhase {
  if (childNodes.length === 0) return 'Pending';
  if (childNodes.some(n => n.phase === 'Failed' || n.phase === 'Error')) return 'Failed';
  if (childNodes.some(n => n.phase === 'Running')) return 'Running';
  if (childNodes.every(n => n.phase === 'Succeeded')) return 'Succeeded';
  if (childNodes.some(n => n.phase === 'Pending')) return 'Pending';
  return 'Pending';
}

/**
 * Decompresses a flat NodeStatus array into boundary groups and execution nodes.
 *
 * Uses `boundaryID` to reconstruct the parent-child hierarchy of template scopes.
 * Boundary nodes (DAG, Steps, StepGroup) become groups; execution nodes are separated.
 *
 * @public
 */
export function decompressNodes(nodes: NodeStatus[]): DecompressedNodes {
  const empty: DecompressedNodes = { groups: [], executionNodes: [] };
  if (!nodes || nodes.length === 0) return empty;

  const boundaryNodes: NodeStatus[] = [];
  const execNodes: NodeStatus[] = [];

  for (const node of nodes) {
    if (BOUNDARY_TYPES.has(node.type)) {
      boundaryNodes.push(node);
    } else {
      execNodes.push(node);
    }
  }

  // Build a set of boundary IDs for quick lookup
  const boundaryIds = new Set(boundaryNodes.map(n => n.id));

  // Build groups from boundary nodes
  const groups: DAGGroup[] = boundaryNodes.map(bn => {
    // Find execution nodes whose boundaryID matches this group
    const childNodeIds = execNodes
      .filter(en => en.boundaryID === bn.id)
      .map(en => en.id);

    // Determine parent: if this boundary node's own boundaryID points to another boundary
    const parentId =
      bn.boundaryID && boundaryIds.has(bn.boundaryID)
        ? bn.boundaryID
        : undefined;

    // Aggregate phase from direct child execution nodes
    const childNodes = execNodes.filter(en => en.boundaryID === bn.id);
    const phase = aggregatePhase(childNodes);

    return {
      id: bn.id,
      displayName: bn.displayName,
      type: bn.type as 'DAG' | 'Steps' | 'StepGroup',
      parentId,
      childNodeIds,
      phase,
    };
  });

  return { groups, executionNodes: execNodes };
}
