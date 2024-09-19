import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';

import {
  createBackendModule,
  coreServices,
} from '@backstage/backend-plugin-api';
import { CatalogClient } from '@backstage/catalog-client';
import { ScmIntegrations } from '@backstage/integration';
import {
  createZipAction,
  createSleepAction,
  createWriteFileAction,
  createAppendFileAction,
  createMergeJSONAction,
  createMergeAction,
  createParseFileAction,
  createSerializeYamlAction,
  createSerializeJsonAction,
  createJSONataAction,
  createYamlJSONataTransformAction,
  createJsonJSONataTransformAction,
} from '@roadiehq/scaffolder-backend-module-utils';
import {
  createRepoAccessTokenAction,
  createSecretAction,
  createS3BucketAction,
  getEnvProvidersAction,
  getComponentInfoAction,
  getSsmParametersAction,
  getPlatformParametersAction,
  getPlatformMetadataAction,
} from '@aws/plugin-scaffolder-backend-aws-apps-for-backstage';

export default createBackendModule({
  pluginId: 'scaffolder', // name of the plugin that the module is targeting
  moduleId: 'custom-extensions',
  register(reg) {
    reg.registerInit({
      deps: {
        scaffolder: scaffolderActionsExtensionPoint,
        config: coreServices.rootConfig,
        discovery: coreServices.discovery,
        // config: ConfigApi,
        // ... and other dependencies as needed
      },
      async init({
        scaffolder,
        config,
        discovery /* ..., other dependencies */,
      }) {
        // Here you have the opportunity to interact with the extension
        // point before the plugin itself gets instantiated
        // const catalogClient = new CatalogClient({
        //   discoveryApi: catalog.getEnvironment(),
        // });
        const catalogClient = new CatalogClient({
          discoveryApi: discovery,
        });
        const integrations = ScmIntegrations.fromConfig(config);
        scaffolder.addActions(createZipAction());
        scaffolder.addActions(createSleepAction());
        scaffolder.addActions(createWriteFileAction());
        scaffolder.addActions(createAppendFileAction());
        scaffolder.addActions(createMergeJSONAction({}));
        scaffolder.addActions(createMergeAction());
        scaffolder.addActions(createParseFileAction());
        scaffolder.addActions(createSerializeYamlAction());
        scaffolder.addActions(createSerializeJsonAction());
        scaffolder.addActions(createJSONataAction());
        scaffolder.addActions(createYamlJSONataTransformAction());
        scaffolder.addActions(createJsonJSONataTransformAction());
        scaffolder.addActions(getSsmParametersAction());
        scaffolder.addActions(getPlatformMetadataAction({ envConfig: config }));
        scaffolder.addActions(
          getPlatformParametersAction({ envConfig: config }),
        );
        scaffolder.addActions(
          createRepoAccessTokenAction({ integrations, envConfig: config }),
        );
        scaffolder.addActions(createSecretAction({ envConfig: config }));
        scaffolder.addActions(createS3BucketAction());
        scaffolder.addActions(getEnvProvidersAction({ catalogClient }));
        scaffolder.addActions(getComponentInfoAction());
      },
    });
  },
});
