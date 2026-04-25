// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  AsyncAwsAppProvider,
  useAwsComponentFromContext,
} from '../../hooks/useAwsApp';
import { AwsAppPage } from '../AwsAppPage/AwsAppPage';
import { AwsResourcePage } from '../AwsResourcePage/AwsResourcePage';
import { AwsPendingPage } from '../AwsPendingPage/AwsPendingPage';
import { EntityEnvironmentSelector } from '../../plugin';
import { useEntity } from '@backstage/plugin-catalog-react';

/** @public */
export interface AwsComponentPageProps {
  componentType: string;
}

/** @public */
export function AwsComponentPage({ componentType }: AwsComponentPageProps) {
  const { entity } = useEntity();

  const isApp = componentType === 'aws-app';
  const isResource = componentType === 'aws-resource';
  const isComponentReady = entity.metadata.appData !== undefined;

  const renderContent = () => {
    if (!isComponentReady) {
      return <AwsPendingPage />;
    }
    if (isApp) {
      return (
        <AwsAppPage>
          <EntityEnvironmentSelector />
        </AwsAppPage>
      );
    }
    if (isResource) {
      return (
        <AwsResourcePage>
          <EntityEnvironmentSelector />
        </AwsResourcePage>
      );
    }
    return <div>No AWS matching page to render: {componentType}</div>;
  };

  return (
    <AsyncAwsAppProvider {...useAwsComponentFromContext()}>
      {renderContent()}
    </AsyncAwsAppProvider>
  );
}
