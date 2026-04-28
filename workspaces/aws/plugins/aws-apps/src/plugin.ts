// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
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

/** @public */
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

/** @public */
export const EntityLabelTable = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'EntityLabelTable',
    component: {
      lazy: () =>
        import('./components/LabelTable/LabelTable').then(m => m.LabelWidget),
    },
  }),
);

/** @public */
export const EntityAuditTable = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'EntityAuditTable',
    component: {
      lazy: () =>
        import('./components/AuditTable/AuditTable').then(m => m.AuditWidget),
    },
  }),
);

/** @public */
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

/** @public */
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

/** @public */
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

/** @public */
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

/** @public */
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

/** @public */
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

/** @public */
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

/** @public */
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

/** @public */
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

/** @public */
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

/** @public */
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

/** @public */
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

/** @public */
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

/** @public */
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

/** @public */
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

/** @public */
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

/** @public */
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

/** @public */
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

/** @public */
export const AwsAppPage = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'AwsAppPage',
    component: {
      lazy: () =>
        import('./pages/AwsAppPage/AwsAppPage').then(m => m.AwsAppPage),
    },
  }),
);

/** @public */
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

/** @public */
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

/** @public */
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

/** @public */
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

/** @public */
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

/** @public */
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

/** @public */
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

/** @public */
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

/** @public */
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

/** @public */
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

/** @public */
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

/** @public */
export const AWSLogoFull = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'AWSLogoFull',
    component: {
      lazy: () =>
        import('../../aws-apps/src/demo/AWSLogoFull').then(m => m.AWSLogoFull),
    },
  }),
);

/** @public */
export const AWSLogoIcon = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'AWSLogoIcon',
    component: {
      lazy: () =>
        import('../../aws-apps/src/demo/AWSLogoIcon').then(m => m.AWSLogoIcon),
    },
  }),
);

/** @public */
export const OPALogoFull = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'OPALogoFull',
    component: {
      lazy: () =>
        import('../../aws-apps/src/demo/OPALogoFull').then(m => m.OPALogoFull),
    },
  }),
);

/** @public */
export const OPALogoIcon = awsAppsPlugin.provide(
  createComponentExtension({
    name: 'OPALogoIcon',
    component: {
      lazy: () =>
        import('../../aws-apps/src/demo/OPALogoIcon').then(m => m.OPALogoIcon),
    },
  }),
);

/** @public */
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

/** @public */
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

/** @public */
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

/** @public */
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

/** @public */
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
