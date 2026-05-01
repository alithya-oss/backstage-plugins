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

import type { Workflow } from '@backstage-community/plugin-argo-workflows-common';

/**
 * A succeeded workflow with a complete DAG of 4 nodes.
 */
export const succeededWorkflow: Workflow = {
  metadata: {
    name: 'build-and-deploy-v42',
    namespace: 'default',
    uid: 'wf-uid-001',
    labels: { app: 'my-service', env: 'production' },
    creationTimestamp: '2026-04-28T10:00:00Z',
  },
  status: {
    phase: 'Succeeded',
    startedAt: '2026-04-28T10:00:05Z',
    finishedAt: '2026-04-28T10:04:32Z',
    nodes: {
      'build-and-deploy-v42': {
        id: 'build-and-deploy-v42',
        name: 'build-and-deploy-v42',
        displayName: 'build-and-deploy-v42',
        type: 'DAG',
        phase: 'Succeeded',
        startedAt: '2026-04-28T10:00:05Z',
        finishedAt: '2026-04-28T10:04:32Z',
        children: ['checkout-step', 'lint-step'],
      },
      'checkout-step': {
        id: 'checkout-step',
        name: 'build-and-deploy-v42.checkout',
        displayName: 'Checkout',
        type: 'Pod',
        phase: 'Succeeded',
        startedAt: '2026-04-28T10:00:10Z',
        finishedAt: '2026-04-28T10:00:45Z',
        children: ['build-step'],
        templateName: 'git-checkout',
      },
      'lint-step': {
        id: 'lint-step',
        name: 'build-and-deploy-v42.lint',
        displayName: 'Lint',
        type: 'Pod',
        phase: 'Succeeded',
        startedAt: '2026-04-28T10:00:10Z',
        finishedAt: '2026-04-28T10:01:20Z',
        children: ['build-step'],
        templateName: 'eslint',
      },
      'build-step': {
        id: 'build-step',
        name: 'build-and-deploy-v42.build',
        displayName: 'Build & Push',
        type: 'Pod',
        phase: 'Succeeded',
        startedAt: '2026-04-28T10:01:25Z',
        finishedAt: '2026-04-28T10:03:10Z',
        children: ['deploy-step'],
        templateName: 'docker-build',
      },
      'deploy-step': {
        id: 'deploy-step',
        name: 'build-and-deploy-v42.deploy',
        displayName: 'Deploy to K8s',
        type: 'Pod',
        phase: 'Succeeded',
        startedAt: '2026-04-28T10:03:15Z',
        finishedAt: '2026-04-28T10:04:32Z',
        templateName: 'kubectl-apply',
      },
    },
  },
};

/**
 * A currently running workflow with some nodes completed and one in progress.
 */
export const runningWorkflow: Workflow = {
  metadata: {
    name: 'integration-tests-v43',
    namespace: 'default',
    uid: 'wf-uid-002',
    labels: { app: 'my-service', env: 'staging' },
    creationTimestamp: '2026-04-29T14:30:00Z',
  },
  status: {
    phase: 'Running',
    startedAt: '2026-04-29T14:30:05Z',
    nodes: {
      'integration-tests-v43': {
        id: 'integration-tests-v43',
        name: 'integration-tests-v43',
        displayName: 'integration-tests-v43',
        type: 'Steps',
        phase: 'Running',
        startedAt: '2026-04-29T14:30:05Z',
        children: ['setup-step', 'test-api-step'],
      },
      'setup-step': {
        id: 'setup-step',
        name: 'integration-tests-v43.setup',
        displayName: 'Setup Environment',
        type: 'Pod',
        phase: 'Succeeded',
        startedAt: '2026-04-29T14:30:10Z',
        finishedAt: '2026-04-29T14:31:00Z',
        children: ['test-api-step', 'test-ui-step'],
        templateName: 'setup-env',
      },
      'test-api-step': {
        id: 'test-api-step',
        name: 'integration-tests-v43.test-api',
        displayName: 'API Tests',
        type: 'Pod',
        phase: 'Running',
        startedAt: '2026-04-29T14:31:05Z',
        templateName: 'run-api-tests',
        message: 'Running test suite...',
      },
      'test-ui-step': {
        id: 'test-ui-step',
        name: 'integration-tests-v43.test-ui',
        displayName: 'UI Tests',
        type: 'Pod',
        phase: 'Pending',
        templateName: 'run-ui-tests',
      },
    },
  },
};

/**
 * A failed workflow where the deploy step encountered an error.
 */
export const failedWorkflow: Workflow = {
  metadata: {
    name: 'deploy-canary-v41',
    namespace: 'production',
    uid: 'wf-uid-003',
    labels: { app: 'my-service', env: 'production' },
    creationTimestamp: '2026-04-27T08:15:00Z',
  },
  status: {
    phase: 'Failed',
    startedAt: '2026-04-27T08:15:05Z',
    finishedAt: '2026-04-27T08:18:42Z',
    message: 'Step deploy-canary failed: ImagePullBackOff',
    nodes: {
      'deploy-canary-v41': {
        id: 'deploy-canary-v41',
        name: 'deploy-canary-v41',
        displayName: 'deploy-canary-v41',
        type: 'DAG',
        phase: 'Failed',
        startedAt: '2026-04-27T08:15:05Z',
        finishedAt: '2026-04-27T08:18:42Z',
        children: ['validate-step'],
      },
      'validate-step': {
        id: 'validate-step',
        name: 'deploy-canary-v41.validate',
        displayName: 'Validate Config',
        type: 'Pod',
        phase: 'Succeeded',
        startedAt: '2026-04-27T08:15:10Z',
        finishedAt: '2026-04-27T08:15:55Z',
        children: ['deploy-canary-step'],
        templateName: 'validate-k8s',
      },
      'deploy-canary-step': {
        id: 'deploy-canary-step',
        name: 'deploy-canary-v41.deploy-canary',
        displayName: 'Deploy Canary',
        type: 'Pod',
        phase: 'Failed',
        startedAt: '2026-04-27T08:16:00Z',
        finishedAt: '2026-04-27T08:18:42Z',
        message: 'ImagePullBackOff: registry.example.com/my-service:v41',
        templateName: 'canary-deploy',
      },
    },
  },
};

/**
 * A workflow in error state (infrastructure issue).
 */
export const errorWorkflow: Workflow = {
  metadata: {
    name: 'nightly-backup-20260429',
    namespace: 'ops',
    uid: 'wf-uid-004',
    labels: { app: 'my-service', type: 'backup' },
    creationTimestamp: '2026-04-29T02:00:00Z',
  },
  status: {
    phase: 'Error',
    startedAt: '2026-04-29T02:00:05Z',
    finishedAt: '2026-04-29T02:00:12Z',
    message: 'Failed to create pod: insufficient resources',
    nodes: {
      'nightly-backup-20260429': {
        id: 'nightly-backup-20260429',
        name: 'nightly-backup-20260429',
        displayName: 'nightly-backup',
        type: 'Pod',
        phase: 'Error',
        startedAt: '2026-04-29T02:00:05Z',
        finishedAt: '2026-04-29T02:00:12Z',
        message: 'Failed to create pod: insufficient resources',
        templateName: 'pg-backup',
      },
    },
  },
};

/**
 * A pending workflow that hasn't started yet.
 */
export const pendingWorkflow: Workflow = {
  metadata: {
    name: 'scheduled-scan-v5',
    namespace: 'default',
    uid: 'wf-uid-005',
    labels: { app: 'my-service', type: 'security' },
    creationTimestamp: '2026-04-30T06:00:00Z',
  },
  status: {
    phase: 'Pending',
    nodes: {
      'scheduled-scan-v5': {
        id: 'scheduled-scan-v5',
        name: 'scheduled-scan-v5',
        displayName: 'Security Scan',
        type: 'Pod',
        phase: 'Pending',
        templateName: 'trivy-scan',
      },
    },
  },
};

/**
 * All fixture workflows as a list, useful for the list view.
 */
export const allWorkflows: Workflow[] = [
  succeededWorkflow,
  runningWorkflow,
  failedWorkflow,
  errorWorkflow,
  pendingWorkflow,
];
