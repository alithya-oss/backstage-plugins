/*
 * Copyright 2026 The Alithya Authors
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
import { Entity } from '@backstage/catalog-model';
import { ARGO_WORKFLOWS_LABEL_SELECTOR_ANNOTATION } from './annotations';

/**
 * Returns true if the given entity has the Argo Workflows label selector
 * annotation with a non-empty value (after trimming whitespace).
 *
 * @public
 */
export function isArgoWorkflowsAvailable(entity: Entity): boolean {
  const annotation =
    entity.metadata.annotations?.[ARGO_WORKFLOWS_LABEL_SELECTOR_ANNOTATION];
  return typeof annotation === 'string' && annotation.trim().length > 0;
}
