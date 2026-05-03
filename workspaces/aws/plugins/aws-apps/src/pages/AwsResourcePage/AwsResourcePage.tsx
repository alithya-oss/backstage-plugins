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

import { Entity } from '@backstage/catalog-model';
import { EntityLayout, EntitySwitch } from '@backstage/plugin-catalog';
import { isGithubActionsAvailable } from '@alithya-oss/backstage-plugin-github-actions';
import { isGitlabAvailable } from '@immobiliarelabs/backstage-plugin-gitlab';
import { Grid } from '@material-ui/core';
import { ReactNode } from 'react';
import { CICDContent } from '../../components/CICDContent/CICDContent';
import { EntityDeleteAppCard } from '../../plugin';
import { AwsRDSResourcePage } from '../AwsRDSResourcePage/AwsRDSResourcePage';
import { AwsS3ResourcePage } from '../AwsS3ResourcePage/AwsS3ResourcePage';
import { AwsSecretsManagerResourcePage } from '../AwsSecretsManagerResourcePage/AwsSecretsManagerResourcePage';

interface AwsResourcePageProps {
  children: ReactNode;
}

/**
 * Condition function that checks if an entity matches a specific resource type.
 *
 * @public
 */
export function isResourceType(
  resourceType: string,
): (entity: Entity) => boolean {
  return (entity: Entity): boolean => {
    let subType = 'N/A';
    if (entity?.metadata?.resourceType)
      subType = entity?.metadata?.resourceType.toString();
    return subType === resourceType;
  };
}

const isCicdApplicable = (entity: Entity) => {
  return isGitlabAvailable(entity) || isGithubActionsAvailable(entity);
};

/**
 * Entity page for generic AWS resources.
 *
 * @public
 */
export function AwsResourcePage(_props: AwsResourcePageProps) {
  const managementContent = (
    <Grid container spacing={1} alignItems="stretch">
      <Grid item md={12} xs={12}>
        <EntityDeleteAppCard />
      </Grid>
    </Grid>
  );

  const AwsRDSResourceEntityPage = (
    <>
      {_props.children}
      <EntityLayout>
        <EntityLayout.Route path="/" title="Overview">
          <AwsRDSResourcePage />
        </EntityLayout.Route>
        <EntityLayout.Route path="/ci-cd" title="CI/CD" if={isCicdApplicable}>
          <CICDContent />
        </EntityLayout.Route>
        <EntityLayout.Route path="/management" title="Management">
          {managementContent}
        </EntityLayout.Route>
      </EntityLayout>
    </>
  );

  const AwsS3ResourceEntityPage = (
    <>
      {_props.children}
      <EntityLayout>
        <EntityLayout.Route path="/" title="Overview">
          <AwsS3ResourcePage />
        </EntityLayout.Route>
        <EntityLayout.Route path="/ci-cd" title="CI/CD" if={isCicdApplicable}>
          <CICDContent />
        </EntityLayout.Route>
        <EntityLayout.Route path="/management" title="Management">
          {managementContent}
        </EntityLayout.Route>
      </EntityLayout>
    </>
  );

  const AwsSecretsResourceEntityPage = (
    <>
      {_props.children}
      <EntityLayout>
        <EntityLayout.Route path="/" title="Overview">
          <AwsSecretsManagerResourcePage />
        </EntityLayout.Route>
        <EntityLayout.Route path="/ci-cd" title="CI/CD" if={isCicdApplicable}>
          <CICDContent />
        </EntityLayout.Route>
        <EntityLayout.Route path="/management" title="Management">
          {managementContent}
        </EntityLayout.Route>
      </EntityLayout>
    </>
  );

  return (
    <EntitySwitch>
      <EntitySwitch.Case if={isResourceType('aws-rds')}>
        {AwsRDSResourceEntityPage}
      </EntitySwitch.Case>
      <EntitySwitch.Case if={isResourceType('aws-s3')}>
        {AwsS3ResourceEntityPage}
      </EntitySwitch.Case>
      <EntitySwitch.Case if={isResourceType('aws-secretsmanager')}>
        {AwsSecretsResourceEntityPage}
      </EntitySwitch.Case>
      {/*
      <EntitySwitch.Case if={isResourceType('aws-sqs')}>
        {AwsSQSEntityPage}
      </EntitySwitch.Case> */}
    </EntitySwitch>
  );
}
