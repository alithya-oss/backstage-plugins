import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './service/router';

/**
 * timesaverPlugin backend plugin
 *
 * @public
 */
export const timesaverPlugin = createBackendPlugin({
  pluginId: 'timesaver',
  register(env) {
    env.registerInit({
      deps: {
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
      },
      async init({ httpRouter, logger, config }) {
        httpRouter.use(
          await createRouter({
            logger,
            config,
          }),
        );

        if (process.env.NODE_ENV === 'development') {
          httpRouter.addAuthPolicy({
            path: '*',
            allow: 'unauthenticated',
          });
        }
      },
    });
  },
});
