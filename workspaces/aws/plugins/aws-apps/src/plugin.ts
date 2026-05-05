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
  createPlugin,
  createApiFactory,
  configApiRef,
  createComponentExtension,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { Entity } from '@backstage/catalog-model';
import { rootRouteRef } from './routes';
import { OPAApiClient, opaApiRef } from './api';

export const isOPAAppAvailable = (entity: Entity) =>
  entity?.spec?.type === 'aws-app';
export const isAnnotationsAvailable = (entity: Entity) =>
  entity?.metadata?.annotations;
export const isLabelsAvailable = (entity: Entity) => entity?.metadata?.labels;

/**
 * The AWS Apps frontend plugin for Backstage.
 *
 * @public
 */
export const awsAppsPlugin = createPlugin({
  id: 'aws-apps',
  apis: [
    createApiFactory({
      api: opaApiRef,
      deps: { configApi: configApiRef, fetchApi: fetchApiRef },
      factory: ({ configApi, fetchApi }) =>
        new OPAApiClient({ configApi, fetchApi }),
    }),
  ],
  routes: {
    root: rootRouteRef,
  },
});

/**
 * Displays Kubernetes labels for an AWS application entity.
 *
 * @public
 */
export const EntityLabelTable = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'EntityLabelTable',
    component: {
      lazy: () =>
        import('./components/LabelTable/LabelTable').then(m => m.LabelWidget),
    },
  }),
);

/**
 * Displays audit records for an AWS application entity.
 *
 * @public
 */
export const EntityAuditTable = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'EntityAuditTable',
    component: {
      lazy: () =>
        import('./components/AuditTable/AuditTable').then(m => m.AuditWidget),
    },
  }),
);

/**
 * Dropdown selector for choosing an AWS environment and provider.
 *
 * @public
 */
export const EntityEnvironmentSelector = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'EnvironmentSelector',
    component: {
      lazy: () =>
        import('./components/EnvironmentSelector/EnvironmentSelector').then(
          m => m.EnvironmentSelectorWidget,
        ),
    },
  }),
);

/**
 * Displays entity annotations filtered by type.
 *
 * @public
 */
export const EntityAnnotationTypeTable = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'EntityAnnotationTypeTable',
    component: {
      lazy: () =>
        import('./components/AnnotationTypeTable/AnnotationTypeTable').then(
          m => m.AnnotationWidget,
        ),
    },
  }),
);

/**
 * Displays the current runtime state of an ECS application.
 *
 * @public
 */
export const EntityAppStateCard = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'AppStateCard',
    component: {
      lazy: () =>
        import('./components/AppStateCard/AppStateCard').then(
          m => m.AppStateCard,
        ),
    },
  }),
);

/**
 * Displays the current runtime state of an EKS application.
 *
 * @public
 */
export const EntityK8sAppStateCard = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'K8sAppStateCard',
    component: {
      lazy: () =>
        import('./components/K8sAppStateCard/K8sAppStateCard').then(
          m => m.K8sAppStateCard,
        ),
    },
  }),
);

/**
 * Displays the CloudFormation stack state of an application.
 *
 * @public
 */
export const EntityAppStateCardCloudFormation = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'AppStateCardCloudFormation',
    component: {
      lazy: () =>
        import(
          './components/AppStateCardCloudFormation/AppStateCardCloudFormation'
        ).then(m => m.AppStateCard),
    },
  }),
);

/**
 * Displays general information about an AWS application entity.
 *
 * @public
 */
export const EntityGeneralInfoCard = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'GeneralInfoCard',
    component: {
      lazy: () =>
        import('./components/GeneralInfoCard/GeneralInfoCard').then(
          m => m.GeneralInfoCard,
        ),
    },
  }),
);

/**
 * Provides application promotion controls across environments.
 *
 * @public
 */
export const EntityAppPromoCard = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'AppPromoCard',
    component: {
      lazy: () =>
        import('./components/AppPromoCard/AppPromoCard').then(
          m => m.AppPromoWidget,
        ),
    },
  }),
);

/** @public */
export const EntityAppLinksCard = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'AppLinksCard',
    component: {
      lazy: () =>
        import('./components/AppLinksCard/AppLinksCard').then(
          m => m.AppLinksCard,
        ),
    },
  }),
);

/**
 * Custom catalog page for AWS applications.
 *
 * @public
 */
export const AppCatalogPage = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'AppCatalogPage',
    component: {
      lazy: () =>
        import('./components/AppCatalogPage/AppCatalogPage').then(
          m => m.AppCatalogPage,
        ),
    },
  }),
);

/**
 * Displays CloudWatch log streams for an application.
 *
 * @public
 */
export const EntityCloudwatchLogsTable = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'EntityCloudwatchLogsTable',
    component: {
      lazy: () =>
        import('./components/CloudwatchLogsTable/CloudwatchLogsTable').then(
          m => m.CloudwatchLogsWidget,
        ),
    },
  }),
);

/**
 * Displays infrastructure details for an AWS application.
 *
 * @public
 */
export const EntityInfrastructureInfoCard = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'InfrastructureInfoCard',
    component: {
      lazy: () =>
        import('./components/InfrastructureCard/InfrastructureCard').then(
          m => m.InfrastructureCard,
        ),
    },
  }),
);

/**
 * Displays information about an AWS environment provider.
 *
 * @public
 */
export const EntityProviderInfoCard = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'ProviderInfoCard',
    component: {
      lazy: () =>
        import('./components/ProviderInfoCard/ProviderInfoCard').then(
          m => m.ProviderInfoCard,
        ),
    },
  }),
);

/**
 * Displays information about an AWS environment.
 *
 * @public
 */
export const EntityEnvironmentInfoCard = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'EnvironmentInfoCard',
    component: {
      lazy: () =>
        import('./components/EnvironmentInfoCard/EnvironmentInfoCard').then(
          m => m.EnvironmentInfoCard,
        ),
    },
  }),
);

/**
 * Displays application configuration details.
 *
 * @public
 */
export const EntityAppConfigCard = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'AppConfigCard',
    component: {
      lazy: () =>
        import('./components/AppConfigCard/AppConfigCard').then(
          m => m.AppConfigCard,
        ),
    },
  }),
);

/**
 * Provides controls to delete an AWS application.
 *
 * @public
 */
export const EntityDeleteAppCard = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'DeleteAppCard',
    component: {
      lazy: () =>
        import('./components/DeleteComponentCard/DeleteComponentCard').then(
          m => m.DeleteComponentCard,
        ),
    },
  }),
);

/**
 * Provides controls to delete an AWS environment provider.
 *
 * @public
 */
export const EntityDeleteProviderCard = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'DeleteProviderCard',
    component: {
      lazy: () =>
        import('./components/DeleteProviderCard/DeleteProviderCard').then(
          m => m.DeleteProviderCard,
        ),
    },
  }),
);

/**
 * Provides controls to delete an AWS environment.
 *
 * @public
 */
export const EntityDeleteEnvironmentCard = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'DeleteEnvironmentCard',
    component: {
      lazy: () =>
        import('./components/DeleteEnvironmentCard/DeleteEnvironmentCard').then(
          m => m.DeleteEnvironmentCard,
        ),
    },
  }),
);

/**
 * Displays and manages resource bindings for an application.
 *
 * @public
 */
export const EntityResourceBindingCard = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'ResourceBindingCard',
    component: {
      lazy: () =>
        import('./components/ResourceBindingCard/ResourceBinding').then(
          m => m.ResourceBindingCardWidget,
        ),
    },
  }),
);

/**
 * Card for selecting AWS environment providers.
 *
 * @public
 */
export const EntityAwsEnvironmentProviderSelectorCard = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'AwsEnvironmentProviderSelectorCard',
    component: {
      lazy: () =>
        import(
          './components/AwsEnvironmentProviderCard/AwsEnvironmentProviderCard'
        ).then(m => m.AwsEnvironmentProviderCardWidget),
    },
  }),
);

/**
 * Entity page layout for AWS applications.
 *
 * @public
 */
export const AwsAppPage = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'AwsAppPage',
    component: {
      lazy: () =>
        import('./pages/AwsAppPage/AwsAppPage').then(m => m.AwsAppPage),
    },
  }),
);

/**
 * Entity page layout for AWS components.
 *
 * @public
 */
export const AwsComponentPage = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'AwsComponentPage',
    component: {
      lazy: () =>
        import('./pages/AwsComponentPage/AwsComponentPage').then(
          m => m.AwsComponentPage,
        ),
    },
  }),
);

/**
 * Entity page for AWS environments.
 *
 * @public
 */
export const AwsEnvironmentPage = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'AwsEnvironmentPage',
    component: {
      lazy: () =>
        import('./pages/AwsEnvironmentPage/AwsEnvironmentPage').then(
          m => m.AwsEnvironmentPage,
        ),
    },
  }),
);

/**
 * Entity page for AWS environment providers.
 *
 * @public
 */
export const AwsEnvironmentProviderPage = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'AwsEnvironmentProviderPage',
    component: {
      lazy: () =>
        import(
          './pages/AwsEnvironmentProviderPage/AwsEnvironmentProviderPage'
        ).then(m => m.AwsEnvironmentProviderPage),
    },
  }),
);

/**
 * Entity page for ECS-based AWS applications.
 *
 * @public
 */
export const AwsECSAppPage = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'AwsECSAppPage',
    component: {
      lazy: () =>
        import('./pages/AwsECSAppPage/AwsECSAppPage').then(
          m => m.AwsECSAppPage,
        ),
    },
  }),
);

/** @public */
export const AwsECSEnvironmentProviderPage = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'AwsECSEnvironmentProviderPage',
    component: {
      lazy: () =>
        import(
          './pages/AwsECSEnvironmentProviderPage/AwsECSEnvironmentProviderPage'
        ).then(m => m.AwsECSEnvironmentProviderPage),
    },
  }),
);

/**
 * Entity page for EKS-based AWS applications.
 *
 * @public
 */
export const AwsEKSAppPage = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'AwsEKSAppPage',
    component: {
      lazy: () =>
        import('./pages/AwsEKSAppPage/AwsEKSAppPage').then(
          m => m.AwsEKSAppPage,
        ),
    },
  }),
);

/** @public */
export const AwsEKSEnvironmentProviderPage = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'AwsEKSEnvironmentProviderPage',
    component: {
      lazy: () =>
        import(
          './pages/AwsEKSEnvironmentProviderPage/AwsEKSEnvironmentProviderPage'
        ).then(m => m.AwsEKSEnvironmentProviderPage),
    },
  }),
);

/**
 * Entity page for AWS applications in pending state.
 *
 * @public
 */
export const AwsPendingPage = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'AwsPendingPage',
    component: {
      lazy: () =>
        import('./pages/AwsPendingPage/AwsPendingPage').then(
          m => m.AwsPendingPage,
        ),
    },
  }),
);

/**
 * Entity page for AWS RDS resources.
 *
 * @public
 */
export const AwsRDSResourcePage = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'AwsRDSResourcePage',
    component: {
      lazy: () =>
        import('./pages/AwsRDSResourcePage/AwsRDSResourcePage').then(
          m => m.AwsRDSResourcePage,
        ),
    },
  }),
);

/**
 * Entity page for generic AWS resources.
 *
 * @public
 */
export const AwsResourcePage = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'AwsResourcePage',
    component: {
      lazy: () =>
        import('./pages/AwsResourcePage/AwsResourcePage').then(
          m => m.AwsResourcePage,
        ),
    },
  }),
);

/**
 * Entity page for AWS S3 resources.
 *
 * @public
 */
export const AwsS3ResourcePage = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'AwsS3ResourcePage',
    component: {
      lazy: () =>
        import('./pages/AwsS3ResourcePage/AwsS3ResourcePage').then(
          m => m.AwsS3ResourcePage,
        ),
    },
  }),
);

/**
 * Entity page for AWS Secrets Manager resources.
 *
 * @public
 */
export const AwsSecretsManagerResourcePage = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'AwsSecretsManagerResourcePage',
    component: {
      lazy: () =>
        import(
          './pages/AwsSecretsManagerResourcePage/AwsSecretsManagerResourcePage'
        ).then(m => m.AwsSecretsManagerResourcePage),
    },
  }),
);

/**
 * Entity page for serverless AWS applications.
 *
 * @public
 */
export const AwsServerlessAppPage = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'AwsServerlessAppPage',
    component: {
      lazy: () =>
        import('./pages/AwsServerlessAppPage/AwsServerlessAppPage').then(
          m => m.AwsServerlessAppPage,
        ),
    },
  }),
);

/** @public */
export const AwsServerlessEnvironmentProviderPage = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'AwsServerlessEnvironmentProviderPage',
    component: {
      lazy: () =>
        import(
          './pages/AwsServerlessEnvironmentProviderPage/AwsServerlessEnvironmentProviderPage'
        ).then(m => m.AwsServerlessEnvironmentProviderPage),
    },
  }),
);

/**
 * Full-width AWS logo component.
 *
 * @public
 */
export const AWSLogoFull = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'AWSLogoFull',
    component: {
      lazy: () =>
        import('../../aws-apps/src/demo/AWSLogoFull').then(m => m.AWSLogoFull),
    },
  }),
);

/**
 * Icon-sized AWS logo component.
 *
 * @public
 */
export const AWSLogoIcon = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'AWSLogoIcon',
    component: {
      lazy: () =>
        import('../../aws-apps/src/demo/AWSLogoIcon').then(m => m.AWSLogoIcon),
    },
  }),
);

/**
 * Full-width OPA logo component.
 *
 * @public
 */
export const OPALogoFull = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'OPALogoFull',
    component: {
      lazy: () =>
        import('../../aws-apps/src/demo/OPALogoFull').then(m => m.OPALogoFull),
    },
  }),
);

/**
 * Icon-sized OPA logo component.
 *
 * @public
 */
export const OPALogoIcon = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'OPALogoIcon',
    component: {
      lazy: () =>
        import('../../aws-apps/src/demo/OPALogoIcon').then(m => m.OPALogoIcon),
    },
  }),
);

/**
 * Icon-sized customer logo component.
 *
 * @public
 */
export const CustomerLogoIcon = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'CustomerLogoIcon',
    component: {
      lazy: () =>
        import('../../aws-apps/src/demo/CustomerLogoIcon').then(
          m => m.CustomerLogoIcon,
        ),
    },
  }),
);

/**
 * Full-width customer logo with title for light theme.
 *
 * @public
 */
export const CustomerLogoFullTitleLight = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'CustomerLogoFullTitleLight',
    component: {
      lazy: () =>
        import('../../aws-apps/src/demo/CustomerLogoFullTitleLight').then(
          m => m.CustomerLogoFullTitleLight,
        ),
    },
  }),
);

/**
 * Full-width customer logo component for light theme.
 *
 * @public
 */
export const CustomerLogoFullLight = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'CustomerLogoFullLight',
    component: {
      lazy: () =>
        import('../../aws-apps/src/demo/CustomerLogoFullLight').then(
          m => m.CustomerLogoFullLight,
        ),
    },
  }),
);

/**
 * Home page for the AWS Apps plugin.
 *
 * @public
 */
export const AWSAppsHomePage = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'AwsAppsHomePage',
    component: {
      lazy: () =>
        import('../../aws-apps/src/demo/AwsAppsHomePage/AwsAppsHomePage').then(
          m => m.AwsAppsHomePage,
        ),
    },
  }),
);

/**
 * Home page component for OPA on AWS.
 *
 * @public
 */
export const OPAHomePage = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'AWSAppsHomePage',
    component: {
      lazy: () =>
        import('../../aws-apps/src/demo/OPAHomePage/OPAHomePage').then(
          m => m.OPAHomePage,
        ),
    },
  }),
);
