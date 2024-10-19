import { coreServices } from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { createBackendModule } from '@backstage/backend-plugin-api';
import { AnnotateScmSlugEntityProcessor } from '@backstage/plugin-catalog-backend';

export default createBackendModule({
  pluginId: 'catalog',
  moduleId: 'annotate-scm-slug-entity-processor',
  register(env) {
    env.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        config: coreServices.rootConfig,
      },
      async init({ catalog, config }) {
        catalog.addProcessor(AnnotateScmSlugEntityProcessor.fromConfig(config));
      },
    });
  },
});
