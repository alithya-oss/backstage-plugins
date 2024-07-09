import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const timesaverPlugin = createPlugin({
  id: 'timesaver',
  routes: {
    root: rootRouteRef,
  },
});

export const TimesaverPage = timesaverPlugin.provide(
  createRoutableExtension({
    name: 'TimesaverPage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);
