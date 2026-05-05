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
import { ReactNode } from 'react';
import { EntityAboutCard, EntityLinksCard } from '@backstage/plugin-catalog';
import { EntityCatalogGraphCard } from '@backstage/plugin-catalog-graph';
import { EntityInfrastructureInfoCard } from '../../plugin';

interface AwsRDSResourcePageProps {
  children?: ReactNode;
}

/**
 * Entity page for AWS RDS resources.
 *
 * @public
 */
export function AwsRDSResourcePage(_props: AwsRDSResourcePageProps) {
  const rdsContent = (
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
      <Grid item md={12} xs={12}>
        <EntityInfrastructureInfoCard />
      </Grid>
    </Grid>
  );
  return <>{rdsContent}</>;
}
