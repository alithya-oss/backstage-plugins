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

import { createApp } from '@backstage/app-defaults';
import { FlatRoutes } from '@backstage/core-app-api';
import {
  CatalogEntityPage,
  CatalogIndexPage,
  catalogPlugin,
} from '@backstage/plugin-catalog';
import { EntityLayout } from '@backstage/plugin-catalog-react';
import { EntityArgoWorkflowsContent } from '@backstage-community/plugin-argo-workflows';
import { Route } from 'react-router-dom';

const app = createApp({
  bindRoutes({ bind }) {
    bind(catalogPlugin.externalRoutes, {
      createComponent: undefined as any,
    });
  },
});

const entityPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      <div>Entity Overview</div>
    </EntityLayout.Route>
    <EntityLayout.Route path="/argo-workflows" title="Argo Workflows">
      <EntityArgoWorkflowsContent />
    </EntityLayout.Route>
  </EntityLayout>
);

const routes = (
  <FlatRoutes>
    <Route path="/" element={<div>Argo Workflows Dev App</div>} />
    <Route path="/catalog" element={<CatalogIndexPage />} />
    <Route
      path="/catalog/:namespace/:kind/:name"
      element={<CatalogEntityPage />}
    >
      {entityPage}
    </Route>
  </FlatRoutes>
);

export default app.createRoot(routes);
