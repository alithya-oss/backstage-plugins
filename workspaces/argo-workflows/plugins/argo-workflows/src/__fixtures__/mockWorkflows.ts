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
  WorkflowSummary,
  WorkflowDetail,
  NodeStatus,
} from '@alithya-oss/backstage-plugin-argo-workflows-common';

/* ------------------------------------------------------------------ */
/*  Workflow summaries (list view)                                    */
/*  Adapted from alithya-oss/backstage-plugins feature branch         */
/* ------------------------------------------------------------------ */

/**
 * A succeeded build-and-deploy workflow with a DAG of 4 nodes.
 * Checkout and Lint run in parallel, then Build, then Deploy.
 */
export const succeededWorkflow: WorkflowSummary = {
  name: 'build-and-deploy-v42',
  namespace: 'default',
  kind: 'Workflow',
  phase: 'Succeeded',
  startedAt: '2026-04-28T10:00:05Z',
  finishedAt: '2026-04-28T10:04:32Z',
  duration: 267,
  labels: { app: 'my-service', env: 'production' },
  nodes: [
    { displayName: 'Checkout', phase: 'Succeeded' },
    { displayName: 'Lint', phase: 'Succeeded' },
    { displayName: 'Build & Push', phase: 'Succeeded' },
    { displayName: 'Deploy to K8s', phase: 'Succeeded' },
  ],
};

/**
 * A currently running integration-test workflow.
 * Setup done, API tests running, UI tests pending.
 */
export const runningWorkflow: WorkflowSummary = {
  name: 'integration-tests-v43',
  namespace: 'default',
  kind: 'Workflow',
  phase: 'Running',
  startedAt: '2026-04-29T14:30:05Z',
  labels: { app: 'my-service', env: 'staging' },
  nodes: [
    { displayName: 'Setup Environment', phase: 'Succeeded' },
    { displayName: 'API Tests', phase: 'Running' },
    { displayName: 'UI Tests', phase: 'Pending' },
  ],
};

/**
 * A failed canary deployment — image pull error on the deploy step.
 */
export const failedWorkflow: WorkflowSummary = {
  name: 'deploy-canary-v41',
  namespace: 'production',
  kind: 'Workflow',
  phase: 'Failed',
  startedAt: '2026-04-27T08:15:05Z',
  finishedAt: '2026-04-27T08:18:42Z',
  duration: 217,
  labels: { app: 'my-service', env: 'production' },
  nodes: [
    { displayName: 'Validate Config', phase: 'Succeeded' },
    { displayName: 'Deploy Canary', phase: 'Failed' },
  ],
};

/**
 * A workflow in error state — infrastructure issue prevented pod creation.
 */
export const errorWorkflow: WorkflowSummary = {
  name: 'nightly-backup-20260429',
  namespace: 'ops',
  kind: 'CronWorkflow',
  phase: 'Error',
  startedAt: '2026-04-29T02:00:05Z',
  finishedAt: '2026-04-29T02:00:12Z',
  duration: 7,
  labels: { app: 'my-service', type: 'backup' },
  nodes: [{ displayName: 'nightly-backup', phase: 'Error' }],
};

/**
 * A pending workflow that hasn't started executing yet.
 */
export const pendingWorkflow: WorkflowSummary = {
  name: 'scheduled-scan-v5',
  namespace: 'default',
  kind: 'Workflow',
  phase: 'Pending',
  startedAt: '2026-04-30T06:00:00Z',
  labels: { app: 'my-service', type: 'security' },
  nodes: [{ displayName: 'Security Scan', phase: 'Pending' }],
};

/** All workflow summaries as a single list. */
export const mockWorkflowSummaries: WorkflowSummary[] = [
  succeededWorkflow,
  runningWorkflow,
  failedWorkflow,
  errorWorkflow,
  pendingWorkflow,
];

/* ---- Legacy aliases for backward compatibility ---- */
export const ciPipelineSucceeded = succeededWorkflow;
export const dataProcessingRunning = runningWorkflow;
export const deployFailed = failedWorkflow;
export const integrationTestError = errorWorkflow;
export const mlTrainingPending = pendingWorkflow;
export const releasePublish = succeededWorkflow;
export const batchReportRunning = runningWorkflow;

/* ------------------------------------------------------------------ */
/*  Workflow details (DAG view)                                       */
/* ------------------------------------------------------------------ */

/**
 * Succeeded build-and-deploy detail with full DAG nodes.
 * DAG root → Checkout + Lint (parallel) → Build → Deploy.
 */
const succeededNodes: NodeStatus[] = [
  {
    id: 'build-and-deploy-v42',
    displayName: 'build-and-deploy-v42',
    type: 'DAG',
    phase: 'Succeeded',
    startedAt: '2026-04-28T10:00:05Z',
    finishedAt: '2026-04-28T10:04:32Z',
    duration: 267,
    children: ['checkout-step', 'lint-step'],
  },
  {
    id: 'checkout-step',
    displayName: 'Checkout',
    type: 'Pod',
    phase: 'Succeeded',
    templateName: 'git-checkout',
    startedAt: '2026-04-28T10:00:10Z',
    finishedAt: '2026-04-28T10:00:45Z',
    duration: 35,
    children: ['build-step'],
    boundaryID: 'build-and-deploy-v42',
  },
  {
    id: 'lint-step',
    displayName: 'Lint',
    type: 'Pod',
    phase: 'Succeeded',
    templateName: 'eslint',
    startedAt: '2026-04-28T10:00:10Z',
    finishedAt: '2026-04-28T10:01:20Z',
    duration: 70,
    children: ['build-step'],
    boundaryID: 'build-and-deploy-v42',
  },
  {
    id: 'build-step',
    displayName: 'Build & Push',
    type: 'Pod',
    phase: 'Succeeded',
    templateName: 'docker-build',
    startedAt: '2026-04-28T10:01:25Z',
    finishedAt: '2026-04-28T10:03:10Z',
    duration: 105,
    children: ['deploy-step'],
    boundaryID: 'build-and-deploy-v42',
  },
  {
    id: 'deploy-step',
    displayName: 'Deploy to K8s',
    type: 'Pod',
    phase: 'Succeeded',
    templateName: 'kubectl-apply',
    startedAt: '2026-04-28T10:03:15Z',
    finishedAt: '2026-04-28T10:04:32Z',
    duration: 77,
    boundaryID: 'build-and-deploy-v42',
  },
];

/**
 * Failed canary deployment detail with error messages.
 * DAG root → Validate → Deploy Canary (failed with ImagePullBackOff).
 */
const failedNodes: NodeStatus[] = [
  {
    id: 'deploy-canary-v41',
    displayName: 'deploy-canary-v41',
    type: 'DAG',
    phase: 'Failed',
    startedAt: '2026-04-27T08:15:05Z',
    finishedAt: '2026-04-27T08:18:42Z',
    duration: 217,
    children: ['validate-step'],
  },
  {
    id: 'validate-step',
    displayName: 'Validate Config',
    type: 'Pod',
    phase: 'Succeeded',
    templateName: 'validate-k8s',
    startedAt: '2026-04-27T08:15:10Z',
    finishedAt: '2026-04-27T08:15:55Z',
    duration: 45,
    children: ['deploy-canary-step'],
    boundaryID: 'deploy-canary-v41',
  },
  {
    id: 'deploy-canary-step',
    displayName: 'Deploy Canary',
    type: 'Pod',
    phase: 'Failed',
    templateName: 'canary-deploy',
    startedAt: '2026-04-27T08:16:00Z',
    finishedAt: '2026-04-27T08:18:42Z',
    duration: 162,
    message: 'ImagePullBackOff: registry.example.com/my-service:v41',
    boundaryID: 'deploy-canary-v41',
  },
];

/** Succeeded build-and-deploy detail. */
export const succeededDetail: WorkflowDetail = {
  ...succeededWorkflow,
  nodes: succeededNodes,
};

/** Failed canary deployment detail. */
export const failedDetail: WorkflowDetail = {
  ...failedWorkflow,
  nodes: failedNodes,
};

/* ---- Legacy aliases ---- */
export const ciPipelineDetail = succeededDetail;
export const deployFailedDetail = failedDetail;

/** Map of workflow name → detail for mock API lookups. */
export const mockWorkflowDetails: Record<string, WorkflowDetail> = {
  [succeededDetail.name]: succeededDetail,
  [failedDetail.name]: failedDetail,
};
