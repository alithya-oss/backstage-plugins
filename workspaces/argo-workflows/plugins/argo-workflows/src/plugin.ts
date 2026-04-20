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

import {
  createApiFactory,
  createPlugin,
  createRoutableExtension,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { argoWorkflowsApiRef } from '@backstage-community/plugin-argo-workflows-common';
import { ArgoWorkflowsApiClient } from './api';
import { rootRouteRef, dagViewRouteRef } from './routes';

/** @public */
export const argoWorkflowsPlugin = createPlugin({
  id: 'argo-workflows',
  routes: {
    root: rootRouteRef,
    dagView: dagViewRouteRef,
  },
  apis: [
    createApiFactory({
      api: argoWorkflowsApiRef,
      deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
      factory: ({ discoveryApi, fetchApi }) =>
        new ArgoWorkflowsApiClient({ discoveryApi, fetchApi }),
    }),
  ],
});

/** @public */
export const EntityArgoWorkflowsContent = argoWorkflowsPlugin.provide(
  createRoutableExtension({
    name: 'EntityArgoWorkflowsContent',
    component: () =>
      import('./components/ArgoWorkflowsPage').then(
        m => m.ArgoWorkflowsPage,
      ),
    mountPoint: rootRouteRef,
  }),
);
