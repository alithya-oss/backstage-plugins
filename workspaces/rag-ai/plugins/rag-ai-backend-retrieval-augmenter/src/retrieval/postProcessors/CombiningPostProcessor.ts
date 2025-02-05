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
  AugmentationPostProcessor,
  EmbeddingDoc,
  EmbeddingsSource,
} from '@alithya-oss/backstage-plugin-rag-ai-node';

/** @public */
export class CombiningPostProcessor implements AugmentationPostProcessor {
  async process(
    _query: string,
    _source: EmbeddingsSource,
    embeddingDocs: Map<string, EmbeddingDoc[]>,
  ): Promise<EmbeddingDoc[]> {
    return Array.from(embeddingDocs.values()).flat();
  }
}
