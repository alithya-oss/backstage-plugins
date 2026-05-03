import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { techInsightsFactRetrieversExtensionPoint } from '@backstage-community/plugin-tech-insights-node';
import { apiDefinitionFactRetriever } from './fact';

/**
 * @public
 */
export const techInsightsModuleCatalogEntities = createBackendModule({
  pluginId: 'tech-insights',
  moduleId: 'catalog-entities',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        retrievers: techInsightsFactRetrieversExtensionPoint,
      },
      async init({ logger, retrievers }) {
        logger.info('Initializing catalog entities fact retriever');
        retrievers.addFactRetrievers({
          apiDefinitionFactRetriever: apiDefinitionFactRetriever,
        });
      },
    });
  },
});
