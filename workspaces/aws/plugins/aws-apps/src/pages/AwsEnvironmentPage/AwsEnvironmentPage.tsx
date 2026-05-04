// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  EntityAboutCard,
  EntityLinksCard,
  EntityLayout,
} from '@backstage/plugin-catalog';
import { Grid } from '@material-ui/core';
import { ReactNode } from 'react';
import { EntityCatalogGraphCard } from '@backstage/plugin-catalog-graph';
import { EntityTechdocsContent } from '@backstage/plugin-techdocs';
import { TechDocsAddons } from '@backstage/plugin-techdocs-react';
import { ReportIssue } from '@backstage/plugin-techdocs-module-addons-contrib';
import {
  EntityAwsEnvironmentProviderSelectorCard,
  EntityDeleteEnvironmentCard,
  EntityEnvironmentInfoCard,
} from '../../plugin';

/**
 * Props for the AWS environment page.
 *
 * @public
 */
export interface AwsEnvironmentPageProps {
  /** Optional child content to render. */
  children?: ReactNode;
}

/**
 * Entity page for AWS environments.
 *
 * @public
 */
export function AwsEnvironmentPage(/* {children}: AwsEnvironmentPageProps */) {
  const managementContent = (
    <Grid container spacing={1} alignItems="stretch">
      <Grid item md={6} xs={6}>
        <EntityDeleteEnvironmentCard />
      </Grid>
    </Grid>
  );

  return (
    <EntityLayout>
      <EntityLayout.Route path="/" title="Overview">
        <Grid container spacing={3} alignItems="stretch">
          <Grid item md={6}>
            <EntityAboutCard />
          </Grid>
          <Grid item md={6} xs={12}>
            <EntityCatalogGraphCard height={400} showArrowHeads />
          </Grid>
          <Grid item md={6}>
            <EntityEnvironmentInfoCard />
          </Grid>
          <Grid item md={6} xs={12}>
            <EntityLinksCard />
          </Grid>
          <Grid item md={12}>
            <EntityAwsEnvironmentProviderSelectorCard />
          </Grid>
        </Grid>
      </EntityLayout.Route>
      <EntityLayout.Route path="/docs" title="Docs">
        <EntityTechdocsContent>
          <TechDocsAddons>
            <ReportIssue />
          </TechDocsAddons>
        </EntityTechdocsContent>
      </EntityLayout.Route>
      <EntityLayout.Route path="/management" title="Management">
        {managementContent}
      </EntityLayout.Route>
    </EntityLayout>
  );
}
