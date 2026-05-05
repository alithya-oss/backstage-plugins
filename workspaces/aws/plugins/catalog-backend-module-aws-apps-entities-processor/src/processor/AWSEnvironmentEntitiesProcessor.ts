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

import {
  Entity,
  getCompoundEntityRef,
  parseEntityRef,
  RELATION_OWNED_BY,
  RELATION_OWNER_OF,
  RELATION_DEPENDS_ON,
  RELATION_DEPENDENCY_OF,
} from '@backstage/catalog-model';
import { LocationSpec } from '@backstage/plugin-catalog-common';
import {
  CatalogProcessor,
  CatalogProcessorEmit,
  processingResult,
} from '@backstage/plugin-catalog-node';
import {
  AWSEnvironmentEntityV1,
  awsEnvironmentEntityV1Validator,
} from '@alithya-oss/backstage-plugin-aws-apps-common';

/**
 * Catalog processor that handles AWS Environment entities and establishes
 * relationships between environments and their providers.
 *
 * @public
 */
export class AWSEnvironmentEntitiesProcessor implements CatalogProcessor {
  getProcessorName(): string {
    return 'AWSEnvironmentEntitiesProcessor';
  }

  private readonly validators = [awsEnvironmentEntityV1Validator];

  async validateEntityKind(entity: Entity): Promise<boolean> {
    for (const validator of this.validators) {
      if (entity.kind === 'AWSEnvironment')
        if (await validator.check(entity)) {
          return true;
        }
    }

    return false;
  }

  async postProcessEntity(
    entity: Entity,
    _location: LocationSpec,
    emit: CatalogProcessorEmit,
  ): Promise<Entity> {
    const selfRef = getCompoundEntityRef(entity);

    if (
      entity.apiVersion === 'aws.backstage.io/v1alpha' &&
      entity.kind === 'AWSEnvironment'
    ) {
      const template = entity as AWSEnvironmentEntityV1;

      const target = template.spec.owner;
      if (target) {
        const targetRef = parseEntityRef(target, {
          defaultKind: 'Group',
          defaultNamespace: selfRef.namespace,
        });
        emit(
          processingResult.relation({
            source: selfRef,
            type: RELATION_OWNED_BY,
            target: {
              kind: targetRef.kind,
              namespace: targetRef.namespace,
              name: targetRef.name,
            },
          }),
        );
        emit(
          processingResult.relation({
            source: {
              kind: targetRef.kind,
              namespace: targetRef.namespace,
              name: targetRef.name,
            },
            type: RELATION_OWNER_OF,
            target: selfRef,
          }),
        );
      }
      if (template.spec.dependsOn) {
        template.spec.dependsOn.forEach(awsEnv => {
          const targetRef = parseEntityRef(awsEnv, {
            defaultKind: 'awsenvironmentprovider',
            defaultNamespace: selfRef.namespace,
          });
          if (targetRef.kind === 'awsenvironmentprovider') {
            emit(
              processingResult.relation({
                source: selfRef,
                type: RELATION_DEPENDS_ON,
                target: {
                  kind: targetRef.kind,
                  namespace: targetRef.namespace,
                  name: targetRef.name,
                },
              }),
            );
            emit(
              processingResult.relation({
                source: {
                  kind: targetRef.kind,
                  namespace: targetRef.namespace,
                  name: targetRef.name,
                },
                type: RELATION_DEPENDENCY_OF,
                target: selfRef,
              }),
            );
          }
        });
      }
    }

    return entity;
  }
}
