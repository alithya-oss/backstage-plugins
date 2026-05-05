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

import { Grid } from '@material-ui/core';
import { EntityAboutCard } from '@backstage/plugin-catalog';
import {
  EntityGeneralInfoCard,
  EntityAppStateCard,
  EntityInfrastructureInfoCard,
  EntityAppConfigCard,
  EntityAppLinksCard,
} from '../../plugin';
import { EntityCatalogGraphCard } from '@backstage/plugin-catalog-graph';

interface AwsECSAppPageProps {}

/**
 * Entity page for ECS-based AWS applications.
 *
 * @public
 */
export function AwsECSAppPage(_props: AwsECSAppPageProps) {
  // Add plugin UI cards and page
  const awsEcsAppViewContent = (
    <Grid container spacing={3} alignItems="stretch">
      <Grid item md={6}>
        <EntityAboutCard />
      </Grid>
      <Grid item md={6} xs={12}>
        <EntityCatalogGraphCard height={400} showArrowHeads />
      </Grid>
      <Grid item md={6} xs={12}>
        <EntityAppLinksCard />
      </Grid>
      <Grid item md={6} xs={12}>
        <EntityGeneralInfoCard appPending={false} />
      </Grid>
      <Grid item md={6} xs={12}>
        <EntityAppStateCard />
      </Grid>
      <Grid item md={6} xs={12}>
        <EntityAppConfigCard />
      </Grid>
      <Grid item md={12} xs={12}>
        <EntityInfrastructureInfoCard />
      </Grid>
    </Grid>
  );

  return <>{awsEcsAppViewContent}</>;
}
