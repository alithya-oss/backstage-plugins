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

import { createDevApp } from '@backstage/dev-utils';
import '@backstage/ui/css/styles.css';
import { ApiProvider, ConfigReader } from '@backstage/core-app-api';
import { TestApiRegistry } from '@backstage/test-utils';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import {
  configApiRef,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { argoWorkflowsPlugin, EntityArgoWorkflowsContent } from '../src/plugin';
import type {
  ArgoWorkflowsApi,
  WorkflowSummary,
  WorkflowDetail,
} from '@alithya-oss/backstage-plugin-argo-workflows-common';
import { argoWorkflowsApiRef } from '@alithya-oss/backstage-plugin-argo-workflows-common';
import {
  mockWorkflowSummaries,
  mockWorkflowDetails,
  ciPipelineDetail,
  entityWithAnnotations,
  entityNamespaceOnly,
  entityWithoutAnnotations,
} from '../src/__fixtures__';

/**
 * Mock API client backed by fixture data.
 */
class MockArgoWorkflowsApiClient implements ArgoWorkflowsApi {
  async listWorkflows(
    namespace: string,
    labelSelector?: string,
  ): Promise<WorkflowSummary[]> {
    let results = mockWorkflowSummaries.filter(w => w.namespace === namespace);

    if (labelSelector) {
      const [key, value] = labelSelector.split('=');
      results = results.filter(w => w.labels?.[key] === value);
    }

    return results;
  }

  async getWorkflow(namespace: string, name: string): Promise<WorkflowDetail> {
    const detail = mockWorkflowDetails[name];
    if (detail && detail.namespace === namespace) {
      return detail;
    }
    // Fallback: wrap the summary as a detail with the same nodes
    const summary = mockWorkflowSummaries.find(
      w => w.name === name && w.namespace === namespace,
    );
    if (summary) {
      return {
        ...summary,
        nodes: summary.nodes.map((n, i) => ({
          id: `${name}-node-${i}`,
          displayName: n.displayName,
          type: 'Pod' as const,
          phase: n.phase,
        })),
      };
    }
    return ciPipelineDetail;
  }
}

const apis = TestApiRegistry.from(
  [configApiRef, new ConfigReader({
    argoWorkflows: {
      nodeStatusStyle: 'bar',
    },
  })],
  [argoWorkflowsApiRef, new MockArgoWorkflowsApiClient()],
  [discoveryApiRef, { getBaseUrl: async () => 'http://localhost:7007/api' }],
  [fetchApiRef, { fetch: globalThis.fetch.bind(globalThis) }],
);

createDevApp()
  .registerPlugin(argoWorkflowsPlugin)
  .addPage({
    path: '/argo-workflows',
    title: 'Workflows (with labels)',
    element: (
      <ApiProvider apis={apis}>
        <EntityProvider entity={entityWithAnnotations} key="with-labels">
          <EntityArgoWorkflowsContent />
        </EntityProvider>
      </ApiProvider>
    ),
  })
  .addPage({
    path: '/argo-workflows-all',
    title: 'Workflows (all)',
    element: (
      <ApiProvider apis={apis}>
        <EntityProvider entity={entityNamespaceOnly} key="all">
          <EntityArgoWorkflowsContent />
        </EntityProvider>
      </ApiProvider>
    ),
  })
  .addPage({
    path: '/argo-workflows-empty',
    title: 'Workflows (empty)',
    element: (
      <ApiProvider apis={apis}>
        <EntityProvider entity={entityWithoutAnnotations} key="empty">
          <EntityArgoWorkflowsContent />
        </EntityProvider>
      </ApiProvider>
    ),
  })
  .render();
