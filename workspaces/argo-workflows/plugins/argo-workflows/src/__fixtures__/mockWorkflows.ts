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
} from '@backstage-community/plugin-argo-workflows-common';

/* ------------------------------------------------------------------ */
/*  Helper: deterministic ISO timestamps relative to a fixed anchor   */
/* ------------------------------------------------------------------ */

const ANCHOR = new Date('2026-04-19T10:00:00Z').getTime();

function iso(offsetMs: number): string {
  return new Date(ANCHOR + offsetMs).toISOString();
}

const HOUR = 3_600_000;
const MIN = 60_000;

/* ------------------------------------------------------------------ */
/*  Workflow summaries (list view)                                    */
/* ------------------------------------------------------------------ */

/** A successful CI pipeline with 4 steps. */
export const ciPipelineSucceeded: WorkflowSummary = {
  name: 'ci-pipeline-main-a1b2c',
  namespace: 'argo',
  phase: 'Succeeded',
  startedAt: iso(-2 * HOUR),
  finishedAt: iso(-2 * HOUR + 12 * MIN),
  duration: 720,
  labels: { app: 'frontend', branch: 'main', 'workflows.argoproj.io/creator': 'system' },
  nodes: [
    { displayName: 'checkout', phase: 'Succeeded' },
    { displayName: 'lint', phase: 'Succeeded' },
    { displayName: 'test', phase: 'Succeeded' },
    { displayName: 'build-image', phase: 'Succeeded' },
  ],
};

/** A running data-processing workflow. */
export const dataProcessingRunning: WorkflowSummary = {
  name: 'data-processing-daily-x9k3',
  namespace: 'argo',
  phase: 'Running',
  startedAt: iso(-25 * MIN),
  duration: 1500,
  labels: { app: 'data-pipeline', schedule: 'daily' },
  nodes: [
    { displayName: 'extract', phase: 'Succeeded' },
    { displayName: 'transform', phase: 'Running' },
    { displayName: 'load', phase: 'Pending' },
    { displayName: 'validate', phase: 'Pending' },
  ],
};

/** A failed deployment workflow. */
export const deployFailed: WorkflowSummary = {
  name: 'deploy-staging-v2.4.1-f7d8',
  namespace: 'argo',
  phase: 'Failed',
  startedAt: iso(-5 * HOUR),
  finishedAt: iso(-5 * HOUR + 4 * MIN),
  duration: 240,
  labels: { app: 'backend-api', env: 'staging' },
  nodes: [
    { displayName: 'pre-check', phase: 'Succeeded' },
    { displayName: 'db-migrate', phase: 'Succeeded' },
    { displayName: 'rolling-update', phase: 'Failed' },
    { displayName: 'smoke-test', phase: 'Skipped' },
  ],
};

/** A pending workflow waiting for resources. */
export const mlTrainingPending: WorkflowSummary = {
  name: 'ml-training-resnet-q4w2',
  namespace: 'ml-jobs',
  phase: 'Pending',
  startedAt: iso(-3 * MIN),
  duration: 180,
  labels: { app: 'ml-platform', model: 'resnet-50' },
  nodes: [
    { displayName: 'prepare-data', phase: 'Pending' },
    { displayName: 'train', phase: 'Pending' },
    { displayName: 'evaluate', phase: 'Pending' },
  ],
};

/** A workflow in error state. */
export const integrationTestError: WorkflowSummary = {
  name: 'integration-tests-pr-1234-e5r6',
  namespace: 'argo',
  phase: 'Error',
  startedAt: iso(-1 * HOUR),
  finishedAt: iso(-1 * HOUR + 2 * MIN),
  duration: 120,
  labels: { app: 'frontend', trigger: 'pull-request' },
  nodes: [
    { displayName: 'setup-env', phase: 'Succeeded' },
    { displayName: 'run-tests', phase: 'Error' },
  ],
};

/** A second succeeded workflow for variety. */
export const releasePublish: WorkflowSummary = {
  name: 'release-publish-v3.0.0-h8j1',
  namespace: 'argo',
  phase: 'Succeeded',
  startedAt: iso(-8 * HOUR),
  finishedAt: iso(-8 * HOUR + 6 * MIN),
  duration: 360,
  labels: { app: 'backend-api', release: 'v3.0.0' },
  nodes: [
    { displayName: 'build', phase: 'Succeeded' },
    { displayName: 'sign', phase: 'Succeeded' },
    { displayName: 'publish-registry', phase: 'Succeeded' },
    { displayName: 'notify-slack', phase: 'Succeeded' },
  ],
};

/** A long-running batch job still in progress. */
export const batchReportRunning: WorkflowSummary = {
  name: 'batch-report-monthly-m3n4',
  namespace: 'argo',
  phase: 'Running',
  startedAt: iso(-45 * MIN),
  duration: 2700,
  labels: { app: 'reporting', schedule: 'monthly' },
  nodes: [
    { displayName: 'fetch-metrics', phase: 'Succeeded' },
    { displayName: 'aggregate', phase: 'Succeeded' },
    { displayName: 'generate-pdf', phase: 'Running' },
    { displayName: 'upload-s3', phase: 'Pending' },
    { displayName: 'send-email', phase: 'Pending' },
  ],
};

/** All workflow summaries as a single list. */
export const mockWorkflowSummaries: WorkflowSummary[] = [
  ciPipelineSucceeded,
  dataProcessingRunning,
  deployFailed,
  mlTrainingPending,
  integrationTestError,
  releasePublish,
  batchReportRunning,
];

/* ------------------------------------------------------------------ */
/*  Workflow details (DAG view)                                       */
/* ------------------------------------------------------------------ */

const ciPipelineNodes: NodeStatus[] = [
  {
    id: 'ci-pipeline-main-a1b2c',
    displayName: 'ci-pipeline-main-a1b2c',
    type: 'DAG',
    phase: 'Succeeded',
    startedAt: iso(-2 * HOUR),
    finishedAt: iso(-2 * HOUR + 12 * MIN),
    duration: 720,
    children: ['checkout-pod', 'lint-pod', 'test-pod', 'build-image-pod'],
  },
  {
    id: 'checkout-pod',
    displayName: 'checkout',
    type: 'Pod',
    phase: 'Succeeded',
    templateName: 'git-checkout',
    startedAt: iso(-2 * HOUR),
    finishedAt: iso(-2 * HOUR + 1 * MIN),
    duration: 60,
    children: ['lint-pod'],
    boundaryID: 'ci-pipeline-main-a1b2c',
  },
  {
    id: 'lint-pod',
    displayName: 'lint',
    type: 'Pod',
    phase: 'Succeeded',
    templateName: 'eslint',
    startedAt: iso(-2 * HOUR + 1 * MIN),
    finishedAt: iso(-2 * HOUR + 4 * MIN),
    duration: 180,
    children: ['test-pod'],
    boundaryID: 'ci-pipeline-main-a1b2c',
  },
  {
    id: 'test-pod',
    displayName: 'test',
    type: 'Pod',
    phase: 'Succeeded',
    templateName: 'jest-runner',
    startedAt: iso(-2 * HOUR + 4 * MIN),
    finishedAt: iso(-2 * HOUR + 9 * MIN),
    duration: 300,
    children: ['build-image-pod'],
    boundaryID: 'ci-pipeline-main-a1b2c',
  },
  {
    id: 'build-image-pod',
    displayName: 'build-image',
    type: 'Pod',
    phase: 'Succeeded',
    templateName: 'kaniko-build',
    startedAt: iso(-2 * HOUR + 9 * MIN),
    finishedAt: iso(-2 * HOUR + 12 * MIN),
    duration: 180,
    boundaryID: 'ci-pipeline-main-a1b2c',
  },
];

const deployFailedNodes: NodeStatus[] = [
  {
    id: 'deploy-staging-v2.4.1-f7d8',
    displayName: 'deploy-staging-v2.4.1-f7d8',
    type: 'Steps',
    phase: 'Failed',
    startedAt: iso(-5 * HOUR),
    finishedAt: iso(-5 * HOUR + 4 * MIN),
    duration: 240,
    children: ['pre-check-pod', 'db-migrate-pod', 'rolling-update-pod', 'smoke-test-pod'],
  },
  {
    id: 'pre-check-pod',
    displayName: 'pre-check',
    type: 'Pod',
    phase: 'Succeeded',
    templateName: 'health-check',
    startedAt: iso(-5 * HOUR),
    finishedAt: iso(-5 * HOUR + 30_000),
    duration: 30,
    children: ['db-migrate-pod'],
    boundaryID: 'deploy-staging-v2.4.1-f7d8',
  },
  {
    id: 'db-migrate-pod',
    displayName: 'db-migrate',
    type: 'Pod',
    phase: 'Succeeded',
    templateName: 'flyway-migrate',
    startedAt: iso(-5 * HOUR + 30_000),
    finishedAt: iso(-5 * HOUR + 90_000),
    duration: 60,
    children: ['rolling-update-pod'],
    boundaryID: 'deploy-staging-v2.4.1-f7d8',
  },
  {
    id: 'rolling-update-pod',
    displayName: 'rolling-update',
    type: 'Pod',
    phase: 'Failed',
    templateName: 'kubectl-rollout',
    startedAt: iso(-5 * HOUR + 90_000),
    finishedAt: iso(-5 * HOUR + 4 * MIN),
    duration: 150,
    message: 'Error: ImagePullBackOff - registry.example.com/backend-api:v2.4.1 not found',
    children: ['smoke-test-pod'],
    boundaryID: 'deploy-staging-v2.4.1-f7d8',
  },
  {
    id: 'smoke-test-pod',
    displayName: 'smoke-test',
    type: 'Pod',
    phase: 'Skipped',
    templateName: 'curl-smoke',
    message: 'Skipped: previous step failed',
    boundaryID: 'deploy-staging-v2.4.1-f7d8',
  },
];

/** CI pipeline detail with full DAG nodes. */
export const ciPipelineDetail: WorkflowDetail = {
  ...ciPipelineSucceeded,
  nodes: ciPipelineNodes,
};

/** Failed deployment detail with error messages. */
export const deployFailedDetail: WorkflowDetail = {
  ...deployFailed,
  nodes: deployFailedNodes,
};

/** Map of workflow name → detail for mock API lookups. */
export const mockWorkflowDetails: Record<string, WorkflowDetail> = {
  [ciPipelineDetail.name]: ciPipelineDetail,
  [deployFailedDetail.name]: deployFailedDetail,
};
