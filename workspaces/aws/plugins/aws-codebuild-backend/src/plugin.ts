/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *   http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  createBackendPlugin,
  coreServices,
} from '@backstage/backend-plugin-api';
import { createRouter } from './service/router';
import { catalogServiceRef } from '@backstage/plugin-catalog-node/alpha';
import { awsCodeBuildServiceRef } from './service/DefaultAwsCodeBuildService';

/** @public */
export const awsCodebuildPlugin = createBackendPlugin({
  pluginId: 'aws-codebuild',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        httpRouter: coreServices.httpRouter,
        config: coreServices.rootConfig,
        catalogApi: catalogServiceRef,
        auth: coreServices.auth,
        discovery: coreServices.discovery,
        httpAuth: coreServices.httpAuth,
        awsCodeBuildApi: awsCodeBuildServiceRef,
      },
      async init({
        logger,
        httpRouter,
        auth,
        httpAuth,
        discovery,
        awsCodeBuildApi,
      }) {
        httpRouter.use(
          await createRouter({
            logger,
            awsCodeBuildApi,
            discovery,
            auth,
            httpAuth,
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
