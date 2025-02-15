## API Report File for "@alithya-oss/backstage-plugin-rag-ai-node"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts
import { BaseLLM } from '@langchain/core/language_models/llms';
import { Embeddings } from '@langchain/core/embeddings';
import { ExtensionPoint } from '@backstage/backend-plugin-api';

// @public (undocumented)
export interface AugmentationIndexer {
  // (undocumented)
  createEmbeddings(
    source: EmbeddingsSource,
    filter?: EntityFilterShape,
  ): Promise<number>;
  // (undocumented)
  deleteEmbeddings(
    source: EmbeddingsSource,
    filter: EntityFilterShape,
  ): Promise<void>;
  // (undocumented)
  vectorStore: RoadieVectorStore;
}

// @public (undocumented)
export interface AugmentationIndexerExtensionPoint {
  // (undocumented)
  setAugmentationIndexer(augmentationIndexer: AugmentationIndexer): void;
}

// @public (undocumented)
export const augmentationIndexerExtensionPoint: ExtensionPoint<AugmentationIndexerExtensionPoint>;

// @public (undocumented)
export interface AugmentationPostProcessor {
  // (undocumented)
  process(
    query: string,
    source: EmbeddingsSource,
    embeddingDocs: Map<string, EmbeddingDoc[]>,
  ): Promise<EmbeddingDoc[]>;
}

// @public (undocumented)
export interface AugmentationRetriever {
  // (undocumented)
  id: string;
  // (undocumented)
  retrieve(
    query: string,
    source: EmbeddingsSource,
    filter?: EntityFilterShape,
  ): Promise<EmbeddingDoc[]>;
}

// @public (undocumented)
export type DeletionParams = {
  ids?: string[];
  filter?: EmbeddingDocMetadata;
};

// @public
export type EmbeddingDoc = {
  metadata: EmbeddingDocMetadata;
  content: string;
};

// @public (undocumented)
export type EmbeddingDocMetadata = Partial<{
  source: EmbeddingsSource;
  [key: string]: string;
}>;

// @public
export type EmbeddingsSource = 'catalog' | 'tech-docs' | 'all';

// @public (undocumented)
export type EntityFilterShape =
  | Record<string, string | symbol | (string | symbol)[]>[]
  | Record<string, string | symbol | (string | symbol)[]>
  | undefined;

// @public (undocumented)
export interface ModelExtensionPoint {
  // (undocumented)
  setBaseLLM(baseLLM: BaseLLM): void;
}

// @public (undocumented)
export const modelExtensionPoint: ExtensionPoint<ModelExtensionPoint>;

// @public (undocumented)
export interface RetrievalPipeline {
  // (undocumented)
  retrieveAugmentationContext(
    query: string,
    source: EmbeddingsSource,
    filter?: EntityFilterShape,
  ): Promise<EmbeddingDoc[]>;
}

// @public (undocumented)
export interface RetrievalPipelineExtensionPoint {
  // (undocumented)
  setRetrievalPipeline(retrievalPipeline: RetrievalPipeline): void;
}

// @public (undocumented)
export const retrievalPipelineExtensionPoint: ExtensionPoint<RetrievalPipelineExtensionPoint>;

// @public (undocumented)
export interface RetrievalRouter {
  // (undocumented)
  determineRetriever(
    query: string,
    source: EmbeddingsSource,
  ): Promise<AugmentationRetriever[]>;
}

// @public
export type RoadieEmbedding = {
  metadata: EmbeddingDocMetadata;
  content: string;
  vector: number[];
  id: string;
};

// @public (undocumented)
export interface RoadieVectorStore {
  // (undocumented)
  addDocuments(docs: EmbeddingDoc[]): Promise<void>;
  // (undocumented)
  connectEmbeddings(embeddings: Embeddings): void;
  // (undocumented)
  deleteDocuments(deletionParams: DeletionParams): Promise<void>;
  // (undocumented)
  similaritySearch(
    query: string,
    filter?: EmbeddingDocMetadata,
    amount?: number,
  ): Promise<EmbeddingDoc[]>;
}

// (No @packageDocumentation comment for this package)
```
