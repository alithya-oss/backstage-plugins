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

import { createElement } from 'react';
import {
  createFrontendPlugin,
  ApiBlueprint,
  createApiFactory,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/frontend-plugin-api';
import { EntityContentBlueprint } from '@backstage/plugin-catalog-react/alpha';
import { argoWorkflowsApiRef } from '@alithya-oss/backstage-plugin-argo-workflows-common';
import { ArgoWorkflowsApiClient } from './api';

/**
 * Argo Workflows frontend plugin for the new Backstage frontend system.
 *
 * @alpha
 */
export default createFrontendPlugin({
  pluginId: 'argo-workflows',
  extensions: [
    EntityContentBlueprint.make({
      name: 'argo-workflows',
      params: {
        path: '/argo-workflows',
        title: 'Argo Workflows',
        loader: () =>
          import('./components/ArgoWorkflowsPage').then(m =>
            createElement(m.ArgoWorkflowsPage),
          ),
      },
    }),
    ApiBlueprint.make({
      name: 'argo-workflows-api',
      params: defineParams =>
        defineParams(
          createApiFactory({
            api: argoWorkflowsApiRef,
            deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
            factory: ({ discoveryApi, fetchApi }) =>
              new ArgoWorkflowsApiClient({ discoveryApi, fetchApi }),
          }),
        ),
    }),
  ],
});
