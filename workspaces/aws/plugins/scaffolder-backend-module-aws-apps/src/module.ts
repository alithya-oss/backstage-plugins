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
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node';
import { createExampleAction } from './actions/example';
import { ScmIntegrations } from '@backstage/integration';
import { CatalogClient } from '@backstage/catalog-client';

import {
  createRepoAccessTokenAction,
  createSecretAction,
  createWriteFileAction,
  getComponentInfoAction,
  getEnvProvidersAction,
  getPlatformMetadataAction,
  getPlatformParametersAction,
  getSsmParametersAction,
} from './actions';

/**
 * A backend module that registers the action into the scaffolder
 *
 * @public
 */
export const scaffolderModule = createBackendModule({
  moduleId: 'aws-apps-action',
  pluginId: 'scaffolder',
  register({ registerInit }) {
    registerInit({
      deps: {
        scaffolderActions: scaffolderActionsExtensionPoint,
        config: coreServices.rootConfig,
        logger: coreServices.logger,
        discovery: coreServices.discovery,
      },
      async init({ scaffolderActions, config, logger, discovery }) {
        const integrations = ScmIntegrations.fromConfig(config);
        const catalogClient = new CatalogClient({
          discoveryApi: discovery,
        });

        scaffolderActions.addActions(createWriteFileAction());
        scaffolderActions.addActions(createSecretAction({ envConfig: config }));
        scaffolderActions.addActions(
          getEnvProvidersAction({ config, logger, catalogClient }),
        );
        scaffolderActions.addActions(getComponentInfoAction());
        scaffolderActions.addActions(getSsmParametersAction(config, logger));
        scaffolderActions.addActions(
          getPlatformMetadataAction({ envConfig: config }),
        );
        scaffolderActions.addActions(
          getPlatformParametersAction({ envConfig: config }),
        );
        scaffolderActions.addActions(
          createRepoAccessTokenAction({ integrations, envConfig: config }),
        );
        scaffolderActions.addActions(createExampleAction());
      },
    });
  },
});
