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

import { useEntity } from '@backstage/plugin-catalog-react';
import LanguageIcon from '@material-ui/icons/Language';
import { ColumnBreakpoints } from '@backstage/plugin-catalog';
import { AppLinksEmptyState } from './AppLinksEmptyState';
import { AppLinksGridList } from './AppLinksGridList';
import { IconComponent, useApp } from '@backstage/core-plugin-api';
import {
  EmptyState,
  InfoCard,
  InfoCardVariants,
} from '@backstage/core-components';
import { LinearProgress } from '@material-ui/core';
import { useAsyncAwsApp } from '../../hooks/useAwsApp';
import { AWSComponent } from '@alithya-oss/backstage-plugin-aws-apps-common';

/** @public */
export interface AppLinksProps {
  awsComponent: AWSComponent;
  cols?: ColumnBreakpoints | number;
  variant?: InfoCardVariants;
}

const AppLinks = (props: AppLinksProps) => {
  const { awsComponent, cols = undefined, variant } = props;
  const { entity } = useEntity();
  const app = useApp();

  const iconResolver = (key?: string): IconComponent =>
    key ? app.getSystemIcon(key) ?? LanguageIcon : LanguageIcon;

  let links = entity?.metadata?.links || [];
  if (awsComponent.currentEnvironment.app.links) {
    links = links.concat(awsComponent.currentEnvironment.app.links);
  }

  return (
    <InfoCard title="Links" variant={variant}>
      {!links || links.length === 0 ? (
        <AppLinksEmptyState />
      ) : (
        <AppLinksGridList
          cols={cols}
          items={links.map(({ url, title, icon }) => ({
            text: title ?? url,
            href: url,
            Icon: iconResolver(icon),
          }))}
        />
      )}
    </InfoCard>
  );
};

export const AppLinksCard = () => {
  const awsAppLoadingStatus = useAsyncAwsApp();

  if (awsAppLoadingStatus.loading) {
    return <LinearProgress />;
  } else if (awsAppLoadingStatus.component) {
    return <AppLinks awsComponent={awsAppLoadingStatus.component} />;
  }
  return (
    <EmptyState
      missing="data"
      title="Failed to load App Links"
      description="Can't fetch data"
    />
  );
};
