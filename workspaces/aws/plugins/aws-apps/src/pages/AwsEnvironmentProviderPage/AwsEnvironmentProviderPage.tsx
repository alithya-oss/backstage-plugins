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

import { ReactNode } from 'react';
import { EntitySwitch } from '@backstage/plugin-catalog';
import { AwsECSEnvironmentProviderPage } from '../AwsECSEnvironmentProviderPage/AwsECSEnvironmentProviderPage';
import { AwsServerlessEnvironmentProviderPage } from '../AwsServerlessEnvironmentProviderPage/AwsServerlessEnvironmentProviderPage';
import { useEntity } from '@backstage/plugin-catalog-react';
import { Entity } from '@backstage/catalog-model';
import { ProviderType } from '../../helpers/constants';
import { AwsEKSEnvironmentProviderPage } from '../AwsEKSEnvironmentProviderPage/AwsEKSEnvironmentProviderPage';

/**
 * Props for the AWS environment provider page.
 *
 * @public
 */
export interface AwsEnvironmentProviderPageProps {
  /** Optional child content to render. */
  children?: ReactNode;
}

/**
 * Condition function that checks if an entity matches a specific provider type.
 *
 * @public
 */
export function isProviderType(
  providerType: string,
  entity: Entity,
): (entity: Entity) => boolean {
  return (): boolean => {
    return entity.metadata.envType?.toString().toLowerCase() === providerType;
  };
}

/**
 * Entity page for AWS environment providers.
 *
 * @public
 */
export function AwsEnvironmentProviderPage(/* {children}: AwsEnvironmentProviderPageProps */) {
  const { entity } = useEntity();

  return (
    <EntitySwitch>
      <EntitySwitch.Case if={isProviderType(ProviderType.ECS, entity)}>
        <AwsECSEnvironmentProviderPage />
      </EntitySwitch.Case>
      <EntitySwitch.Case if={isProviderType(ProviderType.EKS, entity)}>
        <AwsEKSEnvironmentProviderPage />
      </EntitySwitch.Case>
      <EntitySwitch.Case if={isProviderType(ProviderType.SERVERLESS, entity)}>
        <AwsServerlessEnvironmentProviderPage />
      </EntitySwitch.Case>
      <EntitySwitch.Case
        if={isProviderType(ProviderType.GENAI_SERVERLESS, entity)}
      >
        <AwsServerlessEnvironmentProviderPage />
      </EntitySwitch.Case>
      <EntitySwitch.Case>
        <h1>
          Environment Provider Type "{entity.metadata.envType?.toString()}" Is
          Not Supported At This Time
        </h1>
      </EntitySwitch.Case>
    </EntitySwitch>
  );
}
