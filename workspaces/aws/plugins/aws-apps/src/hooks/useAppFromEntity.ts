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

// SPDX-License-Identifier: Apache-2.0

import { OPAAppData } from '../types';
import { Entity } from '@backstage/catalog-model';

export function useAppFromEntity(entity: Entity): OPAAppData {
  // ToDo Validate entity as AWS Entity, has proper data (i.e repo, association with env etc.)

  return (entity.metadata.annotations as OPAAppData) ?? '';
}
