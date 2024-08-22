/*
 * Copyright 2024 Larder Software Limited
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
  LoggerService,
  AuthService,
  DiscoveryService,
} from '@backstage/backend-plugin-api';
import {
  AugmentationIndexer,
  RoadieVectorStore,
} from '@alithya-oss/plugin-rag-ai-node';
import { OpenAiConfig, RoadieOpenAiAugmenter } from './RoadieOpenAiAugmenter';
import { CatalogApi } from '@backstage/catalog-client';
import { Config } from '@backstage/config';
import { AugmentationOptions } from '@alithya-oss/plugin-rag-ai-backend-retrieval-augmenter';

export interface RoadieBedrockEmbeddingsConfig {
  logger: LoggerService;
  auth: AuthService;
  vectorStore: RoadieVectorStore;
  catalogApi: CatalogApi;
  discovery: DiscoveryService;
  config: Config;
}

export async function initializeOpenAiEmbeddings({
  logger,
  auth,
  vectorStore,
  catalogApi,
  discovery,
  config,
}: RoadieBedrockEmbeddingsConfig): Promise<AugmentationIndexer> {
  logger.info('Initializing Roadie OpenAI Embeddings');
  const openAiConfig = config.get<OpenAiConfig>('ai.embeddings.openai');

  const embeddingsOptions = config.getOptionalConfig('ai.embeddings');
  const augmentationOptions: AugmentationOptions = {};
  if (embeddingsOptions) {
    augmentationOptions.chunkSize =
      embeddingsOptions.getOptionalNumber('chunkSize');
    augmentationOptions.chunkOverlap =
      embeddingsOptions.getOptionalNumber('chunkOverlap');
    augmentationOptions.concurrencyLimit =
      embeddingsOptions.getOptionalNumber('concurrencyLimit');
  }
  return new RoadieOpenAiAugmenter({
    vectorStore,
    catalogApi,
    discovery,
    augmentationOptions,
    logger: logger.child({ label: 'roadie-openai-embeddings' }),
    auth,
    config: openAiConfig,
  });
}