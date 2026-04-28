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
