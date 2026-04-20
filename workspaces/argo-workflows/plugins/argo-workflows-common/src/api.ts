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

import { createApiRef } from '@backstage/core-plugin-api';
import { WorkflowDetail, WorkflowSummary } from './types';

/**
 * API interface for the Argo Workflows plugin.
 * @public
 */
export interface ArgoWorkflowsApi {
  /** List workflows in a namespace, optionally filtered by label selector. */
  listWorkflows(
    namespace: string,
    labelSelector?: string,
  ): Promise<WorkflowSummary[]>;

  /** Get a single workflow with full status.nodes for DAG rendering. */
  getWorkflow(namespace: string, name: string): Promise<WorkflowDetail>;
}

/**
 * API ref for the Argo Workflows plugin.
 * @public
 */
export const argoWorkflowsApiRef = createApiRef<ArgoWorkflowsApi>({
  id: 'plugin.argo-workflows.api',
});
