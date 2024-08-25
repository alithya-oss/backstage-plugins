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
import { Embeddings } from '@langchain/core/embeddings';

/**
 * Supported embeddings source
 *
 * @public
 */
export type EmbeddingsSource = 'catalog' | 'tech-docs' | 'all';

/** @public */
export type EmbeddingDocMetadata = Partial<{
  source: EmbeddingsSource;
  [key: string]: string;
}>;

/** @public */
export type EntityFilterShape =
  | Record<string, string | symbol | (string | symbol)[]>[]
  | Record<string, string | symbol | (string | symbol)[]>
  | undefined;

/**
 * Embedding output format
 *
 * @public
 */
export type RoadieEmbedding = {
  metadata: EmbeddingDocMetadata;
  content: string;
  vector: number[];
  id: string;
};

/**
 * Embedding input format
 *
 * @public
 */
export type EmbeddingDoc = {
  metadata: EmbeddingDocMetadata;
  content: string;
};

/** @public */
export interface AugmentationIndexer {
  vectorStore: RoadieVectorStore;
  createEmbeddings(
    source: EmbeddingsSource,
    filter?: EntityFilterShape,
  ): Promise<number>;
  deleteEmbeddings(
    source: EmbeddingsSource,
    filter: EntityFilterShape,
  ): Promise<void>;
}

/** @public */
export interface RetrievalRouter {
  determineRetriever(
    query: string,
    source: EmbeddingsSource,
  ): Promise<AugmentationRetriever[]>;
}

/** @public */
export interface AugmentationRetriever {
  id: string;
  retrieve(
    query: string,
    source: EmbeddingsSource,
    filter?: EntityFilterShape,
  ): Promise<EmbeddingDoc[]>;
}

/** @public */
export interface AugmentationPostProcessor {
  process(
    query: string,
    source: EmbeddingsSource,
    embeddingDocs: Map<string, EmbeddingDoc[]>,
  ): Promise<EmbeddingDoc[]>;
}

/** @public */
export interface RetrievalPipeline {
  retrieveAugmentationContext(
    query: string,
    source: EmbeddingsSource,
    filter?: EntityFilterShape,
  ): Promise<EmbeddingDoc[]>;
}

/** @public */
export type DeletionParams = {
  ids?: string[];
  filter?: EmbeddingDocMetadata;
};

/** @public */
export interface RoadieVectorStore {
  connectEmbeddings(embeddings: Embeddings): void;
  addDocuments(docs: EmbeddingDoc[]): Promise<void>;
  deleteDocuments(deletionParams: DeletionParams): Promise<void>;
  similaritySearch(
    query: string,
    filter?: EmbeddingDocMetadata,
    amount?: number,
  ): Promise<EmbeddingDoc[]>;
}
