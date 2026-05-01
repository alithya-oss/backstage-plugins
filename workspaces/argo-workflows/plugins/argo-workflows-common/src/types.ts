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

/** Statut d'exécution d'un workflow ou d'un nœud */
export type WorkflowStatus =
  | 'Pending'
  | 'Running'
  | 'Succeeded'
  | 'Failed'
  | 'Error';

/** Métadonnées Kubernetes d'un workflow */
export interface WorkflowMetadata {
  name: string;
  namespace: string;
  uid: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  creationTimestamp: string;
}

/** Nœud individuel dans le DAG d'un workflow */
export interface WorkflowNode {
  id: string;
  name: string;
  displayName: string;
  type: 'Pod' | 'Steps' | 'StepGroup' | 'DAG' | 'Retry' | 'Skipped' | 'Suspend';
  phase: WorkflowStatus;
  startedAt?: string;
  finishedAt?: string;
  children?: string[];
  message?: string;
  templateName?: string;
}

/** Statut global d'un workflow */
export interface WorkflowStatusDetail {
  phase: WorkflowStatus;
  startedAt?: string;
  finishedAt?: string;
  nodes?: Record<string, WorkflowNode>;
  message?: string;
}

/** Modèle principal d'un workflow Argo */
export interface Workflow {
  metadata: WorkflowMetadata;
  status: WorkflowStatusDetail;
}

/** Réponse de la liste des workflows */
export interface WorkflowListResponse {
  workflows: Workflow[];
}
