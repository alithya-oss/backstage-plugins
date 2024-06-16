import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const awsAppsPlugin = createPlugin({
  id: 'aws-apps',
  routes: {
    root: rootRouteRef,
  },
});

export const AwsAppsPage = awsAppsPlugin.provide(
  createRoutableExtension({
    name: 'AwsAppsPage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);
