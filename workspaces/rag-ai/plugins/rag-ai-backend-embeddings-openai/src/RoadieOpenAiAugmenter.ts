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
import { OpenAIEmbeddings } from '@langchain/openai';
import {
  DefaultVectorAugmentationIndexer,
  RoadieEmbeddingsConfig,
} from '@alithya-oss/plugin-rag-ai-backend-retrieval-augmenter';

/**
 * OpenAI configuration to generate embeddings
 * @public
 */
export type OpenAiConfig = {
  baseUrl?: string;
  apiKey?: string;
  openAiApiKey?: string;
  modelName?: string;
  batchSize?: number;
  embeddingsDimensions?: number;
};

export class RoadieOpenAiAugmenter extends DefaultVectorAugmentationIndexer {
  constructor(
    config: RoadieEmbeddingsConfig & {
      config: OpenAiConfig;
    },
  ) {
    const embeddings = new OpenAIEmbeddings({
      configuration: {
        baseURL: config.config.baseUrl,
        apiKey: config.config.openAiApiKey ?? config.config.apiKey, // In Node.js defaults to process.env.OPENAI_API_KEY
      },
      openAIApiKey: config.config.openAiApiKey ?? config.config.apiKey, // In Node.js defaults to process.env.OPENAI_API_KEY
      batchSize: config.config.batchSize, // Default value if omitted is 512. Max is 2048
      modelName: config.config.modelName
        ? config.config.modelName
        : 'text-embedding-3-small',
      dimensions: config.config.embeddingsDimensions,
    });
    super({ ...config, embeddings });
  }
}
