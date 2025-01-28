import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';

/**
 * @public
 */
export const bulletinBoardPlugin = createBackendPlugin({
  pluginId: 'bulletin-board',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        database: coreServices.database,
        httpRouter: coreServices.httpRouter,
        httpAuth: coreServices.httpAuth,
        userInfo: coreServices.userInfo,
      },
      async init({ logger, config, database, httpRouter, httpAuth, userInfo }) {
        httpRouter.use(
          await createRouter({
            logger,
            config,
            database,
            httpAuth,
            userInfo,
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
