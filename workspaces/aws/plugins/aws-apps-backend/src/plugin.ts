import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';

import { createAwsSDKService } from './services/AWSSDKService';
import { createGitProviderService } from './services/GitProviderService';
import { createAppsPlatformService } from './services/PlatformService';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import { readOpaAppAuditPermission } from '@alithya-oss/backstage-plugin-aws-apps-common';

/**
 * awsAppsPlugin backend plugin
 *
 * @public
 */
export const awsAppsPlugin = createBackendPlugin({
  pluginId: 'aws-apps-backend',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        userInfo: coreServices.userInfo,
        config: coreServices.rootConfig,
        auth: coreServices.auth,
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
        catalogApi: catalogServiceRef,
        permissionsRegistry: coreServices.permissionsRegistry,
        permissions: coreServices.permissions,
      },
      async init({
        logger,
        userInfo,
        config,
        auth,
        httpAuth,
        httpRouter,
        catalogApi,
        permissionsRegistry,
        permissions,
      }) {
        const awsSDKService = await createAwsSDKService({ config, logger });
        const gitService = await createGitProviderService({ logger });
        const platformService = await createAppsPlatformService({
          config,
          logger,
        });
        platformService.setPlatformRegion(
          config.getString('backend.platformRegion'),
        );
        platformService.setGitProviderService(gitService);

        permissionsRegistry.addPermissions([readOpaAppAuditPermission]);

        httpRouter.use(
          await createRouter({
            config,
            logger,
            userInfo,
            catalogApi,
            permissions,
            auth,
            httpAuth,
            awsSDKService,
            gitService,
            platformService,
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
