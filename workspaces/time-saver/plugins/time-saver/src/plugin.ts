/*
 * Copyright 2024 The Backstage Authors
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
  identityApiRef,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { TimeSaverClient } from './api';
import { timeSaverApiRef } from '@alithya-oss/backstage-plugin-time-saver-react';

/**
 * @public
 */
export const TimeSaverPlugin = createPlugin({
  id: 'time-saver',
  apis: [
    createApiFactory({
      api: timeSaverApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        identityApi: identityApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ discoveryApi, identityApi, fetchApi }) =>
        new TimeSaverClient({
          fetchApi,
          identityApi,
          discoveryApi,
        }),
    }),
  ],
  routes: {
    root: rootRouteRef,
  },
});

/**
 * @public
 */
export const TimeSaverPage = TimeSaverPlugin.provide(
  createRoutableExtension({
    name: 'TimeSaverPage',
    component: () =>
      import('./components/TimeSaverPageComponent').then(
        m => m.TimeSaverPageComponent,
      ),
    mountPoint: rootRouteRef,
  }),
);

/**
 * @public
 */
export const TimeSaverSamplesPage = TimeSaverPlugin.provide(
  createRoutableExtension({
    name: 'TimeSaverSamplesPage',
    component: () =>
      import('./components/TimeSaverSamplesPageComponent').then(
        m => m.TimeSaverSamplesPageComponent,
      ),
    mountPoint: rootRouteRef,
  }),
);
