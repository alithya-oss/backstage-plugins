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

import type {
  NodePhase,
  NodeStatus,
  NodeStatusSummary,
  NodeType,
  WorkflowDetail,
  WorkflowPhase,
  WorkflowSummary,
} from '@alithya-oss/backstage-plugin-argo-workflows-common';

const BOUNDARY_NODE_TYPES = new Set(['DAG', 'Steps', 'StepGroup']);

const VALID_WORKFLOW_PHASES = new Set<string>([
  'Pending',
  'Running',
  'Succeeded',
  'Failed',
  'Error',
]);

const VALID_NODE_PHASES = new Set<string>([
  'Pending',
  'Running',
  'Succeeded',
  'Skipped',
  'Failed',
  'Error',
  'Omitted',
]);

const VALID_NODE_TYPES = new Set<string>([
  'Pod',
  'DAG',
  'Steps',
  'StepGroup',
  'Retry',
  'Suspend',
  'HTTP',
  'Skipped',
  'TaskGroup',
]);

function computeDuration(
  startedAt?: string,
  finishedAt?: string,
): number | undefined {
  if (!startedAt) return undefined;
  if (!finishedAt) return undefined;
  const start = new Date(startedAt).getTime();
  const end = new Date(finishedAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return undefined;
  return Math.max(0, Math.round((end - start) / 1000));
}

function extractNodeSummaries(
  nodes: Record<string, any> | undefined,
): NodeStatusSummary[] {
  if (!nodes || typeof nodes !== 'object') return [];
  return Object.values(nodes)
    .filter(node => node && typeof node === 'object' && !BOUNDARY_NODE_TYPES.has(node.type))
    .map(node => ({
      displayName: String(node.displayName ?? ''),
      phase: VALID_NODE_PHASES.has(node.phase)
        ? (node.phase as NodePhase)
        : 'Pending',
    }));
}

/**
 * Maps a raw Argo Workflow CRD to a WorkflowSummary.
 * @public
 */
export function mapCrdToWorkflowSummary(raw: any): WorkflowSummary {
  const metadata = raw?.metadata ?? {};
  const status = raw?.status ?? {};

  const phase: WorkflowPhase = VALID_WORKFLOW_PHASES.has(status.phase)
    ? (status.phase as WorkflowPhase)
    : 'Pending';

  return {
    name: String(metadata.name ?? ''),
    namespace: String(metadata.namespace ?? ''),
    phase,
    startedAt: String(status.startedAt ?? metadata.creationTimestamp ?? ''),
    finishedAt: status.finishedAt ? String(status.finishedAt) : undefined,
    duration: computeDuration(
      status.startedAt ?? metadata.creationTimestamp,
      status.finishedAt,
    ),
    labels:
      metadata.labels && typeof metadata.labels === 'object'
        ? metadata.labels
        : undefined,
    nodes: extractNodeSummaries(status.nodes),
  };
}

/**
 * Maps a K8s WorkflowList response to an array of WorkflowSummary.
 * @public
 */
export function mapCrdListToWorkflowSummaries(rawList: any): WorkflowSummary[] {
  const items = rawList?.items;
  if (!Array.isArray(items)) return [];
  return items.map(mapCrdToWorkflowSummary);
}

function extractFullNodes(
  nodes: Record<string, any> | undefined,
): NodeStatus[] {
  if (!nodes || typeof nodes !== 'object') return [];
  return Object.entries(nodes)
    .filter(([, node]) => node && typeof node === 'object')
    .map(([id, node]) => {
      const children =
        Array.isArray(node.children) && node.children.length > 0
          ? node.children.map(String)
          : undefined;
      const outboundNodes =
        Array.isArray(node.outboundNodes) && node.outboundNodes.length > 0
          ? node.outboundNodes.map(String)
          : undefined;

      return {
        id: String(id),
        displayName: String(node.displayName ?? ''),
        type: (VALID_NODE_TYPES.has(node.type)
          ? node.type
          : 'Pod') as NodeType,
        phase: (VALID_NODE_PHASES.has(node.phase)
          ? node.phase
          : 'Pending') as NodePhase,
        startedAt: node.startedAt ? String(node.startedAt) : undefined,
        finishedAt: node.finishedAt ? String(node.finishedAt) : undefined,
        duration: computeDuration(node.startedAt, node.finishedAt),
        message: node.message ? String(node.message) : undefined,
        templateName: node.templateName
          ? String(node.templateName)
          : undefined,
        children,
        outboundNodes,
        boundaryID: node.boundaryID ? String(node.boundaryID) : undefined,
      };
    });
}

/**
 * Maps a raw Argo Workflow CRD to a WorkflowDetail with full NodeStatus array.
 * @public
 */
export function mapCrdToWorkflowDetail(raw: any): WorkflowDetail {
  const summary = mapCrdToWorkflowSummary(raw);
  const status = raw?.status ?? {};
  return {
    ...summary,
    nodes: extractFullNodes(status.nodes),
  };
}
