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
import { initializeBedrockEmbeddings } from '@alithya-oss/plugin-rag-ai-backend-embeddings-aws';
import { DefaultAwsCredentialsManager } from '@backstage/integration-aws-node';
import { OpenAI } from '@langchain/openai';

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

        const awsCredentialsManager =
          DefaultAwsCredentialsManager.fromConfig(config);
        const credProvider =
          await awsCredentialsManager.getCredentialProvider();
        indexer.setAugmentationIndexer(
          await initializeBedrockEmbeddings({
            logger: loggerToWinstonLogger(logger),
            auth,
            catalogApi,
            vectorStore,
            discovery,
            config,
            options: {
              region:
                config.getString('ai.embeddings.bedrock.region') ||
                config.getString('ai.embeddings.awsBedrock.region') ||
                'us-east-1',
              credentials: credProvider.sdkCredentialProvider,
            },
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
                config.getOptionalString('ai.embeddings.openapi.apiKey') ??
                config.getOptionalString('ai.embeddings.openapi.openAIApiKey'),
            },
            apiKey:
              config.getOptionalString('ai.embeddings.openapi.apiKey') ??
              config.getOptionalString('ai.embeddings.openapi.openAIApiKey'),
          }),
        );
      },
    });
  },
});
