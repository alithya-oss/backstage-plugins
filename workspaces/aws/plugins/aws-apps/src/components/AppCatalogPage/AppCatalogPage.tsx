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
  Content,
  ContentHeader,
  CreateButton,
  PageWithHeader,
  SupportButton,
  TableColumn,
} from '@backstage/core-components';
import {
  CatalogTable,
  CatalogTableRow,
  DefaultCatalogPageProps,
} from '@backstage/plugin-catalog';
import {
  CatalogFilterLayout,
  EntityKindPicker,
  EntityListProvider,
  EntityOwnerPicker,
  EntityTagPicker,
  UserListPicker,
} from '@backstage/plugin-catalog-react';
import { AdvancedEntityTypePicker } from './AdvancedEntityTypePicker';
import { columnFactories } from './awsColumns';

/**
 * Props for root catalog pages.
 *
 * @public
 */
export interface AppCatalogPageProps extends DefaultCatalogPageProps {
  initialType?: string;
  kind: string;
}

/**
 * Custom catalog page for AWS applications.
 *
 * @public
 */
export function AppCatalogPage(props: AppCatalogPageProps) {
  const { actions, tableOptions = {}, emptyContent, kind } = props;

  let {
    columns,
    initiallySelectedFilter = 'owned',
    initialKind = 'component',
    initialType = 'aws-app',
  } = props;

  let allowedTypesComponent = ['aws-app'];
  let allowedTypesResource = ['aws-rds', 'aws-s3'];
  let allowedTypesEnvironment = ['environment-provider', 'environment'];
  let allowedKinds = [
    'Component',
    'Resource',
    'AWSEnvironment',
    'AWSEnvironmentProvider',
  ];

  if (kind === 'all') {
    allowedTypesComponent = ['aws-app'];
    allowedTypesResource = ['aws-rds', 'aws-s3'];
    allowedTypesEnvironment = ['environment-provider', 'environment'];
    allowedKinds = [
      'Component',
      'Resource',
      'AWSEnvironment',
      'AWSEnvironmentProvider',
    ];
    initialKind = 'component';
    initialType = 'aws-app';
  } else if (kind === 'awsenvironment') {
    const awsEnvironmentColumns: TableColumn<CatalogTableRow>[] = [
      columnFactories.createTitleColumn({ hidden: true }),
      columnFactories.createNameColumn({ defaultKind: initialKind }),
      columnFactories.createOwnerColumn(),
      columnFactories.createSpecLifecycleColumn(),
      columnFactories.createMetadataDescriptionColumn(),
      columnFactories.createEnvironmentTypeColumn(),
      columnFactories.createEnvironmentSystemColumn(),
      columnFactories.createEnvironmentCategoryColumn(),
      columnFactories.createEnvironmentClassificationColumn(),
      columnFactories.createEnvironmentAccountTypeColumn(),
      columnFactories.createEnvironmentRegionTypeColumn(),
      columnFactories.createEnvironmentLevelColumn(),
      columnFactories.createTagsColumn(),
    ];
    columns = awsEnvironmentColumns;
    allowedTypesResource = [];
    allowedTypesEnvironment = ['environment'];
    initialType = 'environment';
    allowedKinds = ['AWSEnvironment'];
    initialKind = 'awsenvironment';
    allowedTypesComponent = [];
    initiallySelectedFilter = 'all';
  } else if (kind === 'awsenvironmentprovider') {
    const awsProviderColumns: TableColumn<CatalogTableRow>[] = [
      columnFactories.createTitleColumn({ hidden: true }),
      columnFactories.createNameColumn({ defaultKind: initialKind }),
      columnFactories.createOwnerColumn(),
      columnFactories.createSpecLifecycleColumn(),
      columnFactories.createMetadataDescriptionColumn(),
      columnFactories.createProviderPrefixColumn(),
      columnFactories.createProviderTypeColumn(),
      columnFactories.createProviderAccountColumn(),
      columnFactories.createProviderRegionColumn(),
      columnFactories.createTagsColumn(),
    ];
    columns = awsProviderColumns;
    allowedKinds = ['AWSEnvironmentProvider'];
    allowedTypesResource = [];
    allowedTypesEnvironment = ['environment-provider'];
    initialType = 'environment-provider';
    initialKind = 'awsenvironmentprovider';
    allowedTypesComponent = [];
    initiallySelectedFilter = 'all';
  } else if (kind === 'component' && initialType === 'aws-app') {
    const awsAppsColumns: TableColumn<CatalogTableRow>[] = [
      columnFactories.createTitleColumn({ hidden: true }),
      columnFactories.createNameColumn({ defaultKind: initialKind }),
      columnFactories.createMetadataDescriptionColumn(),
      columnFactories.createComponentSubTypeColumn(),
      columnFactories.createOwnerColumn(),
      columnFactories.createSpecLifecycleColumn(),
      columnFactories.createMetadataDescriptionColumn(),
      columnFactories.createTagsColumn(),
    ];
    columns = awsAppsColumns;
    allowedKinds = ['Component'];
    initiallySelectedFilter = 'all';
  } else if (kind === 'resource') {
    const awsResourcesColumns: TableColumn<CatalogTableRow>[] = [
      columnFactories.createTitleColumn({ hidden: true }),
      columnFactories.createNameColumn({ defaultKind: initialKind }),
      columnFactories.createOwnerColumn(),
      columnFactories.createAWSResourceTypeColumn(),
      columnFactories.createSpecLifecycleColumn(),
      columnFactories.createMetadataDescriptionColumn(),
      columnFactories.createIACColumn(),
      columnFactories.createTagsColumn(),
    ];
    columns = awsResourcesColumns;
    allowedKinds = ['Resource'];
    allowedTypesResource = ['aws-resource'];
    allowedTypesEnvironment = [];
    initialType = 'aws-resource';
    initialKind = 'resource';
    allowedTypesComponent = [];
    initiallySelectedFilter = 'all';
  } else {
    // console.error(`catalog not yet implemented for kind ${kind}`);
    columns = [];
  }

  return (
    <PageWithHeader title="AWS Software Catalog" themeId="home">
      <Content>
        <ContentHeader title="">
          <CreateButton
            title="Create AWS Component"
            to="/create?filters%5Bkind%5D=template&filters%5Buser%5D=all&filters%5Btags%5D=aws"
          />
          <SupportButton>All your AWS software catalog</SupportButton>
        </ContentHeader>
        <EntityListProvider>
          <CatalogFilterLayout>
            <CatalogFilterLayout.Filters>
              <EntityKindPicker
                initialFilter={initialKind}
                allowedKinds={allowedKinds}
              />
              <AdvancedEntityTypePicker
                initialFilter={initialType}
                allowedTypes={[
                  ...allowedTypesComponent,
                  ...allowedTypesEnvironment,
                  ...allowedTypesResource,
                ]}
              />
              <UserListPicker initialFilter={initiallySelectedFilter} />
              <EntityOwnerPicker />
              <EntityTagPicker />
            </CatalogFilterLayout.Filters>
            <CatalogFilterLayout.Content>
              <CatalogTable
                columns={columns}
                actions={actions}
                tableOptions={tableOptions}
                emptyContent={emptyContent}
              />
            </CatalogFilterLayout.Content>
          </CatalogFilterLayout>
        </EntityListProvider>
      </Content>
    </PageWithHeader>
  );
}
