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

import { EmptyState } from '@backstage/core-components';
import { GenericTable } from '../GenericTable/GenericTable';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useAnnotationsFromEntity } from '../../hooks/custom-hooks';
import { isAnnotationsAvailable } from '../../plugin';
import { Entity } from '@backstage/catalog-model';

const AnnotationTypeTable = ({
  entity,
  type,
}: {
  entity: Entity;
  type: string;
}) => {
  const initAnnotations = { ...useAnnotationsFromEntity(entity) };

  Object.keys(initAnnotations).forEach(key => {
    // If the annotation is of the correct type, keep it
    if (key.includes(type)) {
      // console.log(key);
      // Separate out Annotation
      let newKey = key.replace(`${type}/`, '').replace(/-/g, ' ');
      // Capital case the annotation
      newKey = newKey
        .split(' ')
        .map(s => s.charAt(0).toUpperCase() + s.substring(1))
        .join(' ');
      initAnnotations[newKey] = initAnnotations[key];
    }
    delete initAnnotations[key];
  });

  return (
    <GenericTable
      title={`Annotations Table (${type})`}
      object={initAnnotations}
    />
  );
};

export const AnnotationWidget = ({ type }: { type: string }) => {
  const { entity } = useEntity();
  return !isAnnotationsAvailable(entity) ? (
    <EmptyState
      missing="data"
      title="No Annotations to show"
      description="Annotations would show here"
    />
  ) : (
    <AnnotationTypeTable type={type} entity={entity} />
  );
};
