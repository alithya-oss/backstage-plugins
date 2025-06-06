/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *   http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Entity } from '@backstage/catalog-model';
import { Route, Routes } from 'react-router-dom';
import {
  useEntity,
  MissingAnnotationEmptyState,
} from '@backstage/plugin-catalog-react';
import {
  AWS_ECS_SERVICE_ARN_ANNOTATION,
  AWS_ECS_SERVICE_TAGS_ANNOTATION,
} from '@alithya-oss/backstage-plugin-amazon-ecs-common';
import { getOneOfEntityAnnotations } from '@alithya-oss/backstage-plugin-aws-core-common';
import { EcsServices } from './EcsServices';

/** @public */
export const isAmazonEcsServiceAvailable = (entity: Entity) =>
  getOneOfEntityAnnotations(entity, [
    AWS_ECS_SERVICE_ARN_ANNOTATION,
    AWS_ECS_SERVICE_TAGS_ANNOTATION,
  ]) !== undefined;

export const Router = () => {
  const { entity } = useEntity();

  if (!isAmazonEcsServiceAvailable(entity)) {
    return (
      <MissingAnnotationEmptyState
        annotation={[
          AWS_ECS_SERVICE_ARN_ANNOTATION,
          AWS_ECS_SERVICE_TAGS_ANNOTATION,
        ]}
      />
    );
  }

  return (
    <Routes>
      <Route path="/" element={<EcsServices entity={entity} />} />
    </Routes>
  );
};
