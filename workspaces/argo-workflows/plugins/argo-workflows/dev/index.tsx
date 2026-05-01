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

import { Entity } from '@backstage/catalog-model';
import { Page, Header, TabbedLayout } from '@backstage/core-components';
import { discoveryApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import { createDevApp } from '@backstage/dev-utils';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import { TestApiProvider } from '@backstage/test-utils';

import { argoWorkflowsPlugin, ArgoWorkflowsCI } from '../src/plugin';
import { allWorkflows } from '../src/__fixtures__';

// ─── Mock Entity ────────────────────────────────────────────────────────────

const mockEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'my-service',
    description: 'A demo service with Argo Workflows CI/CD',
    annotations: {
      'argoworkflows.argoproj.io/workflow-selector': 'app=my-service',
      'argoworkflows.argoproj.io/instance-name': 'main',
    },
  },
  spec: {
    lifecycle: 'production',
    type: 'service',
    owner: 'user:guest',
  },
};

// ─── Mock APIs ──────────────────────────────────────────────────────────────

/**
 * Mock discovery API that returns a base URL for the argo-workflows plugin.
 */
const mockDiscoveryApi = {
  getBaseUrl: async (_pluginId: string) => '/api/argo-workflows',
};

/**
 * Mock fetch API that intercepts calls to the argo-workflows backend
 * and returns fixture data.
 */
const mockFetchApi = {
  fetch: async (
    input: RequestInfo | URL,
    _init?: RequestInit,
  ): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();
    // GET /api/argo-workflows/workflows — list workflows
    if (url.includes('/workflows') && !url.match(/\/workflows\/[^?]/)) {
      return new Response(JSON.stringify({ workflows: allWorkflows }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // GET /api/argo-workflows/workflows/:namespace/:name — workflow detail
    const detailMatch = url.match(/\/workflows\/([^/?]+)\/([^/?]+)/);
    if (detailMatch) {
      const [, namespace, name] = detailMatch;
      const workflow = allWorkflows.find(
        w => w.metadata.namespace === namespace && w.metadata.name === name,
      );

      if (workflow) {
        return new Response(JSON.stringify(workflow), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({ error: `Workflow ${namespace}/${name} not found` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};

// ─── Dev App ────────────────────────────────────────────────────────────────

createDevApp()
  .registerPlugin(argoWorkflowsPlugin)
  .addPage({
    element: (
      <TestApiProvider
        apis={[
          [discoveryApiRef, mockDiscoveryApi],
          [fetchApiRef, mockFetchApi],
        ]}
      >
        <EntityProvider entity={mockEntity}>
          <Page themeId="service">
            <Header
              type="component — service"
              title="my-service"
              subtitle="Argo Workflows CI/CD"
            />
            <TabbedLayout>
              <TabbedLayout.Route path="/" title="CI/CD">
                <ArgoWorkflowsCI />
              </TabbedLayout.Route>
            </TabbedLayout>
          </Page>
        </EntityProvider>
      </TestApiProvider>
    ),
    title: 'Workflow Runs',
    path: '/argo-workflows',
  })
  .render();
