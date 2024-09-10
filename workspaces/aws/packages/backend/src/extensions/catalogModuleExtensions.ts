import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { createBackendModule, coreServices } from '@backstage/backend-plugin-api';
import { AwsOrganizationCloudAccountProcessor } from '@backstage/plugin-catalog-backend-module-aws';
import { AWSEnvironmentEntitiesProcessor, AWSEnvironmentProviderEntitiesProcessor} from '@alithya-oss/plugin-catalog-backend-module-aws-apps-entities-processor';



export default createBackendModule({
  pluginId: 'catalog', // name of the plugin that the module is targeting
  moduleId: 'custom-extensions',
  register(env) {
    env.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        config: coreServices.rootConfig,
        logger: coreServices.logger,
      },
      async init({ catalog, config, logger}) {
        // Here you have the opportunity to interact with the extension
        // point before the plugin itself gets instantiated
        catalog.addProcessor(await AwsOrganizationCloudAccountProcessor.fromConfig(config, {logger: logger}));
        catalog.addProcessor(new AWSEnvironmentProviderEntitiesProcessor());
        catalog.addProcessor(new AWSEnvironmentEntitiesProcessor());
      },
    });
  },
});