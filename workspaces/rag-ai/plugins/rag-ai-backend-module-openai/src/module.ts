import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { CatalogClient } from '@backstage/catalog-client';
import { loggerToWinstonLogger } from '@backstage/backend-common';
import {
  augmentationIndexerExtensionPoint,
  retrievalPipelineExtensionPoint,
  modelExtensionPoint,
} from '@alithya-oss/plugin-rag-ai-node';
import { createRoadiePgVectorStore } from '@alithya-oss/plugin-rag-ai-storage-pgvector';
import { createDefaultRetrievalPipeline } from '@alithya-oss/plugin-rag-ai-backend-retrieval-augmenter';
import { initializeOpenAiEmbeddings } from '@alithya-oss/plugin-rag-ai-backend-embeddings-openai';
import { OpenAI } from '@langchain/openai';

/** OpenAI module for Rag AI backend plugin
 * @public
 *
 */
export const ragAiModuleOpenAI = createBackendModule({
  pluginId: 'rag-ai',
  moduleId: 'openai',
  register(reg) {
    reg.registerInit({
      deps: {
        auth: coreServices.auth,
        logger: coreServices.logger,
        database: coreServices.database,
        discovery: coreServices.discovery,
        config: coreServices.rootConfig,
        indexer: augmentationIndexerExtensionPoint,
        pipeline: retrievalPipelineExtensionPoint,
        model: modelExtensionPoint,
      },
      async init({
        auth,
        logger,
        database,
        discovery,
        config,
        indexer,
        pipeline,
        model,
      }) {
        const catalogApi = new CatalogClient({ discoveryApi: discovery });
        const vectorStore = await createRoadiePgVectorStore({
          logger: loggerToWinstonLogger(logger),
          database,
          config,
        });

        indexer.setAugmentationIndexer(
          await initializeOpenAiEmbeddings({
            logger: loggerToWinstonLogger(logger),
            auth,
            catalogApi,
            vectorStore,
            discovery,
            config,
          }),
        );

        pipeline.setRetrievalPipeline(
          createDefaultRetrievalPipeline({
            auth,
            logger: loggerToWinstonLogger(logger),
            discovery,
            vectorStore,
          }),
        );

        model.setBaseLLM(
          new OpenAI({
            configuration: {
              apiKey:
                config.getOptionalString('ai.query.openapi.apiKey') ??
                config.getOptionalString('ai.query.openapi.openAIApiKey'),
            },
            apiKey:
              config.getOptionalString('ai.query.openapi.apiKey') ??
              config.getOptionalString('ai.query.openapi.openAIApiKey'),
            modelName:
              config.getOptionalString('ai.query.openai.modelName') ??
              'gpt-4o-mini',
          }),
        );
      },
    });
  },
});
