import {
  createPlugin,
  createRoutableExtension,
  createApiFactory,
  identityApiRef,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { bulletinBoardApiRef } from '@alithya-oss/backstage-plugin-bulletin-board-react';
import { BulletinBoardClient } from '@alithya-oss/backstage-plugin-bulletin-board-common';
import { rootRouteRef } from './routes';

/**
 * @public
 */
export const bulletinBoardPlugin = createPlugin({
  id: 'bulletin-board',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: bulletinBoardApiRef,
      deps: {
        identityApi: identityApiRef,
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ identityApi, discoveryApi, fetchApi }) =>
        new BulletinBoardClient({ identityApi, discoveryApi, fetchApi }),
    }),
  ],
});

/**
 * @public
 */
export const BulletinBoardPage = bulletinBoardPlugin.provide(
  createRoutableExtension({
    name: 'BulletinBoardPage',
    component: () =>
      import('./components/BulletinBoardPage').then(m => m.BulletinBoardPage),
    mountPoint: rootRouteRef,
  }),
);
