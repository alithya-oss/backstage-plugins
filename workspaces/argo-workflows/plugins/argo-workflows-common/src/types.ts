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
