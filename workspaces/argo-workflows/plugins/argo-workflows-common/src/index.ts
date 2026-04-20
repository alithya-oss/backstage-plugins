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
 * Common types and utilities for the Argo Workflows Backstage plugin.
 *
 * @packageDocumentation
 */

export type {
  WorkflowPhase,
  NodePhase,
  NodeType,
  NodeStatusSummary,
  NodeStatus,
  WorkflowSummary,
  WorkflowDetail,
  DAGColumn,
  PositionedNode,
  LayoutEdge,
  DAGLayout,
  DAGGroup,
  DecompressedNodes,
} from './types';

export type { ArgoWorkflowsApi } from './api';
export { argoWorkflowsApiRef } from './api';

export {
  ARGO_WORKFLOWS_NAMESPACE_ANNOTATION,
  ARGO_WORKFLOWS_LABEL_SELECTOR_ANNOTATION,
  ARGO_WORKFLOWS_CLUSTER_ANNOTATION,
} from './annotations';

export type { BUIStatus } from './statusMapping';
export { PHASE_STATUS_MAP, PHASE_ICON_MAP } from './statusMapping';

export { formatDuration } from './duration';

export { computeDAGColumns } from './computeDAGColumns';

export { decompressNodes } from './decompressNodes';
