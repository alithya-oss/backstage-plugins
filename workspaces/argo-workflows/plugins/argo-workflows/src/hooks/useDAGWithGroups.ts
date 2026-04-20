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

import { useState, useMemo, useCallback } from 'react';
import type { Node as RFNode, Edge as RFEdge } from '@xyflow/react';
import type { NodeStatus } from '@backstage-community/plugin-argo-workflows-common';
import { decompressNodes } from '@backstage-community/plugin-argo-workflows-common';
import { computeDAGLayout } from '../utils/computeDAGLayout';

/**
 * Hook that computes a DAG layout with collapsible groups.
 *
 * Uses `decompressNodes` to identify groups, then builds a dagre layout
 * where collapsed groups are replaced by a single compact node.
 *
 * @public
 */
export function useDAGWithGroups(
  nodes: NodeStatus[],
  options?: {
    selectedNodeId?: string;
    onNodeClick?: (nodeId: string) => void;
  },
) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const toggleGroup = useCallback((groupId: string) => {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  const decomposed = useMemo(() => decompressNodes(nodes), [nodes]);

  const { rfNodes, rfEdges } = useMemo(() => {
    // Build the set of nodes to layout:
    // - Execution nodes NOT in a collapsed group
    // - Collapsed group nodes (as single compact nodes)
    // - Expanded group nodes are not rendered as layout nodes (their children are)
    const collapsedGroupIds = new Set<string>();
    const collapsedChildIds = new Set<string>();

    for (const group of decomposed.groups) {
      if (collapsedIds.has(group.id)) {
        collapsedGroupIds.add(group.id);
        for (const childId of group.childNodeIds) {
          collapsedChildIds.add(childId);
        }
      }
    }

    // Build layout nodes: execution nodes (minus collapsed children) + collapsed group placeholders
    const layoutNodes: NodeStatus[] = [];

    // Add execution nodes that are NOT hidden by a collapsed group
    for (const en of decomposed.executionNodes) {
      if (!collapsedChildIds.has(en.id)) {
        layoutNodes.push(en);
      }
    }

    // Add collapsed groups as synthetic execution nodes for layout
    for (const group of decomposed.groups) {
      if (collapsedGroupIds.has(group.id)) {
        layoutNodes.push({
          id: group.id,
          displayName: group.displayName,
          type: 'DAG', // boundary type, but we include it for layout
          phase: group.phase,
          children: [], // edges handled separately
        });
      }
    }

    // Compute layout (computeDAGLayout filters boundary types, so we need to
    // temporarily treat collapsed groups as non-boundary for layout)
    // Instead, compute layout manually for this mixed set
    const layout = computeDAGLayout(
      // Pass all nodes including collapsed group placeholders
      // But computeDAGLayout filters boundary types... so we override type
      layoutNodes.map(n =>
        collapsedGroupIds.has(n.id)
          ? { ...n, type: 'Pod' as const } // trick: make it look like execution node
          : n,
      ),
    );

    // Build React Flow nodes
    const resultNodes: RFNode[] = layout.nodes.map(pn => {
      if (collapsedGroupIds.has(pn.id)) {
        const group = decomposed.groups.find(g => g.id === pn.id)!;
        return {
          id: pn.id,
          position: { x: pn.x, y: pn.y },
          type: 'dagGroup' as const,
          data: {
            group,
            isCollapsed: true,
            onToggle: toggleGroup,
          },
        };
      }
      return {
        id: pn.id,
        position: { x: pn.x, y: pn.y },
        type: 'dagNode' as const,
        data: {
          node: pn.data,
          isSelected: pn.id === options?.selectedNodeId,
          onNodeClick: options?.onNodeClick,
        },
      };
    });

    // Add expanded group nodes (not positioned by dagre, rendered as React Flow group nodes)
    for (const group of decomposed.groups) {
      if (!collapsedGroupIds.has(group.id) && group.childNodeIds.length > 0) {
        // Find bounding box of children
        const childPositions = layout.nodes.filter(n =>
          group.childNodeIds.includes(n.id),
        );
        if (childPositions.length > 0) {
          const minX = Math.min(...childPositions.map(n => n.x)) - 20;
          const minY = Math.min(...childPositions.map(n => n.y)) - 30;
          const maxX = Math.max(...childPositions.map(n => n.x + n.width)) + 20;
          const maxY = Math.max(...childPositions.map(n => n.y + n.height)) + 20;
          resultNodes.push({
            id: `group-${group.id}`,
            position: { x: minX, y: minY },
            type: 'dagGroup' as const,
            style: { width: maxX - minX, height: maxY - minY },
            data: {
              group,
              isCollapsed: false,
              onToggle: toggleGroup,
            },
          });
        }
      }
    }

    // Build React Flow edges
    const resultEdges: RFEdge[] = layout.edges.map(e => ({
      id: `${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      type: 'dagEdge' as const,
      data: {
        phase:
          decomposed.executionNodes.find(n => n.id === e.source)?.phase ??
          decomposed.groups.find(g => g.id === e.source)?.phase ??
          'Pending',
      },
    }));

    return { rfNodes: resultNodes, rfEdges: resultEdges };
  }, [decomposed, collapsedIds, toggleGroup, options?.selectedNodeId, options?.onNodeClick]);

  return { rfNodes, rfEdges, toggleGroup, groups: decomposed.groups };
}
