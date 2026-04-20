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

/**
 * Argo Workflow top-level phase.
 * @public
 */
export type WorkflowPhase =
  | 'Pending'
  | 'Running'
  | 'Succeeded'
  | 'Failed'
  | 'Error';

/**
 * Argo Workflow node-level phase.
 * @public
 */
export type NodePhase =
  | 'Pending'
  | 'Running'
  | 'Succeeded'
  | 'Skipped'
  | 'Failed'
  | 'Error'
  | 'Omitted';

/**
 * Argo Workflow node type.
 * @public
 */
export type NodeType =
  | 'Pod'
  | 'DAG'
  | 'Steps'
  | 'StepGroup'
  | 'Retry'
  | 'Suspend'
  | 'HTTP'
  | 'Skipped'
  | 'TaskGroup';

/**
 * Lightweight node status summary for table row display (NodeStatusDots).
 * @public
 */
export interface NodeStatusSummary {
  /** Node display name */
  displayName: string;
  /** Node execution phase */
  phase: NodePhase;
}

/**
 * Full node status for DAG rendering.
 * @public
 */
export interface NodeStatus {
  /** Unique node identifier */
  id: string;
  /** Human-readable name */
  displayName: string;
  /** Node type */
  type: NodeType;
  /** Lifecycle phase */
  phase: NodePhase;
  /** Node start time (ISO 8601) */
  startedAt?: string;
  /** Node completion time (ISO 8601) */
  finishedAt?: string;
  /** Duration in seconds */
  duration?: number;
  /** Human-readable status message (e.g., error messages) */
  message?: string;
  /** Template name this node corresponds to */
  templateName?: string;
  /** Child node IDs */
  children?: string[];
  /** Last nodes in execution sequence before template completion */
  outboundNodes?: string[];
  /** Node ID of the associated template root node */
  boundaryID?: string;
}

/**
 * Workflow list item (lightweight, no full status.nodes).
 * @public
 */
export interface WorkflowSummary {
  /** Workflow name */
  name: string;
  /** Kubernetes namespace */
  namespace: string;
  /** Workflow execution phase */
  phase: WorkflowPhase;
  /** Start time (ISO 8601) */
  startedAt: string;
  /** Completion time (ISO 8601) */
  finishedAt?: string;
  /** Duration in seconds */
  duration?: number;
  /** Kubernetes labels */
  labels?: Record<string, string>;
  /** Lightweight node status summaries for NodeStatusDots */
  nodes: NodeStatusSummary[];
}

/**
 * Workflow detail with full status.nodes for DAG rendering.
 * @public
 */
export interface WorkflowDetail extends WorkflowSummary {
  /** Full node statuses for DAG rendering (overrides WorkflowSummary.nodes) */
  nodes: NodeStatus[];
}

/**
 * A column in the DAG layout representing nodes at the same topological level.
 * @public
 */
export interface DAGColumn {
  /** Nodes at this execution stage (parallel if more than one) */
  nodes: NodeStatus[];
  /** True if this column contains more than one node (parallel execution) */
  isParallel: boolean;
}

/**
 * A node with computed x/y position from dagre layout.
 * Coordinates are top-left (converted from dagre's center coordinates).
 * @public
 */
export interface PositionedNode {
  /** Node ID */
  id: string;
  /** Top-left x coordinate */
  x: number;
  /** Top-left y coordinate */
  y: number;
  /** Node width in pixels */
  width: number;
  /** Node height in pixels */
  height: number;
  /** Original node data */
  data: NodeStatus;
}

/**
 * An edge between two nodes with routing points from dagre layout.
 * @public
 */
export interface LayoutEdge {
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Routing points for the edge path */
  points: Array<{ x: number; y: number }>;
}

/**
 * Complete DAG layout with positioned nodes and routed edges.
 * @public
 */
export interface DAGLayout {
  /** Nodes with computed positions */
  nodes: PositionedNode[];
  /** Edges with routing points */
  edges: LayoutEdge[];
}

/**
 * A group representing a boundary template node (DAG, Steps, StepGroup)
 * with its child execution nodes resolved from boundaryID references.
 * @public
 */
export interface DAGGroup {
  /** Boundary node ID */
  id: string;
  /** Human-readable name */
  displayName: string;
  /** Boundary node type */
  type: 'DAG' | 'Steps' | 'StepGroup';
  /** Parent group ID (for nested templates) */
  parentId?: string;
  /** IDs of child execution nodes in this group */
  childNodeIds: string[];
  /** Aggregate phase derived from child nodes */
  phase: NodePhase;
}

/**
 * Result of decompressing a flat NodeStatus array into groups and execution nodes.
 * @public
 */
export interface DecompressedNodes {
  /** Boundary template groups with hierarchy */
  groups: DAGGroup[];
  /** Execution nodes (boundary nodes filtered out) */
  executionNodes: NodeStatus[];
}
