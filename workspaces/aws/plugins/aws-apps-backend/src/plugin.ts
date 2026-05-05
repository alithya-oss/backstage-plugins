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
