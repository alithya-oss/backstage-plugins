import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './service/router';

/**
 * @public
 */
export const bulletinBoardPlugin = createBackendPlugin({
  pluginId: 'bulletin-board-backend',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        database: coreServices.database,
        httpRouter: coreServices.httpRouter,
      },
      async init({ logger, config, database, httpRouter }) {
        httpRouter.use(
          await createRouter({
            logger,
            config,
            database,
          }),
        );
        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });
      },
    });
  },
});