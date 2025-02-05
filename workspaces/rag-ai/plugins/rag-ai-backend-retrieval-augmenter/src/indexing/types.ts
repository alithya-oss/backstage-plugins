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
  AuthService,
  LoggerService,
  DiscoveryService,
} from '@backstage/backend-plugin-api';
import { CatalogApi } from '@backstage/catalog-client';
import { RoadieVectorStore } from '@alithya-oss/backstage-plugin-rag-ai-node';
import { Entity } from '@backstage/catalog-model';

/** @public */
export type AugmentationOptions = {
  chunkSize?: number;
  chunkOverlap?: number;
  concurrencyLimit?: number;
};

/** @public */
export interface RoadieEmbeddingsConfig {
  logger: LoggerService;
  auth: AuthService;
  vectorStore: RoadieVectorStore;
  catalogApi: CatalogApi;
  discovery: DiscoveryService;
  augmentationOptions?: AugmentationOptions;
}

/** @public */
export type SearchIndex = {
  config: {
    indexing: string;
    lang: string[];
    min_search_length: number;
    prebuild_index: boolean;
    separator: string;
  };
  docs: {
    location: string;
    text: string;
    title: string;
  }[];
};

/**
 * @public */
export type TechDocsDocument = {
  text: string;
  entity: Entity;
  title: string;
  location: string;
};
