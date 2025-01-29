import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';

export const searchModuleBulletinBoard = createBackendModule({
  pluginId: 'search',
  moduleId: 'bulletin-board',
  register(reg) {
    reg.registerInit({
      deps: { logger: coreServices.logger },
      async init({ logger }) {
        logger.info('Hello World!');
      },
    });
  },
});
