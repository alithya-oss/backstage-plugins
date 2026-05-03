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
import {
  EntityAboutCard,
  EntityLayout,
  EntityLinksCard,
} from '@backstage/plugin-catalog';
import { EntityCatalogGraphCard } from '@backstage/plugin-catalog-graph';
import { useEntity } from '@backstage/plugin-catalog-react';
import { isGithubActionsAvailable } from '@alithya-oss/backstage-plugin-github-actions';
import { isGitlabAvailable } from '@immobiliarelabs/backstage-plugin-gitlab';
import { Grid } from '@material-ui/core';
import { CICDContent } from '../../components/CICDContent/CICDContent';
import { EntityGeneralInfoCard } from '../../plugin';

interface AwsPendingPageProps {}

const isCicdApplicable = (entity: Entity) => {
  return isGitlabAvailable(entity) || isGithubActionsAvailable(entity);
};

/**
 * Entity page for AWS applications in pending state.
 *
 * @public
 */
export function AwsPendingPage(_props: AwsPendingPageProps) {
  const { entity } = useEntity();
  let isResource: boolean = false;
  if (entity.spec) {
    isResource = entity.spec.type === 'aws-resource';
  }

  return (
    <>
      <EntityLayout>
        <EntityLayout.Route path="/" title="Overview">
          <Grid container spacing={3} alignItems="stretch">
            <Grid item md={6}>
              <EntityAboutCard />
            </Grid>
            <Grid item md={6} xs={12}>
              <EntityCatalogGraphCard height={400} showArrowHeads />
            </Grid>
            <Grid item md={6} xs={12}>
              <EntityLinksCard />
            </Grid>
            <Grid item md={6} xs={12}>
              {!isResource ? <EntityGeneralInfoCard appPending /> : <></>}
            </Grid>
          </Grid>
        </EntityLayout.Route>
        <EntityLayout.Route path="/ci-cd" title="CI/CD" if={isCicdApplicable}>
          <CICDContent />
        </EntityLayout.Route>
      </EntityLayout>
    </>
  );
}
