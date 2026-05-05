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

export {
  AwsEnvironmentPage,
  AwsEnvironmentProviderPage,
  AwsComponentPage,
  AwsAppPage,
  awsAppsPlugin,
  EntityAnnotationTypeTable,
  EntityAppStateCard,
  EntityK8sAppStateCard,
  EntityAppPromoCard,
  EntityAppStateCardCloudFormation,
  EntityLabelTable,
  EntityGeneralInfoCard,
  EntityDeleteAppCard,
  EntityDeleteProviderCard,
  EntityDeleteEnvironmentCard,
  EntityResourceBindingCard,
  AppCatalogPage,
  EntityCloudwatchLogsTable,
  EntityInfrastructureInfoCard,
  EntityProviderInfoCard,
  EntityEnvironmentInfoCard,
  EntityAppConfigCard,
  EntityAuditTable,
  EntityEnvironmentSelector,
  EntityAwsEnvironmentProviderSelectorCard,
} from './plugin';

export * from './pages/AwsAppPage/AwsAppPage';
export * from './pages/AwsEnvironmentPage/AwsEnvironmentPage';
export * from './pages/AwsEnvironmentProviderPage/AwsEnvironmentProviderPage';
export * from './pages/AwsComponentPage/AwsComponentPage';
export * from './pages/AwsAppPage/AwsAppPage';
export * from './pages/AwsPendingPage/AwsPendingPage';
export * from './pages/AwsECSAppPage/AwsECSAppPage';
export * from './pages/AwsEKSAppPage/AwsEKSAppPage';
export * from './pages/AwsRDSResourcePage/AwsRDSResourcePage';
export * from './pages/AwsResourcePage/AwsResourcePage';
export * from './pages/AwsS3ResourcePage/AwsS3ResourcePage';
export * from './pages/AwsSecretsManagerResourcePage/AwsSecretsManagerResourcePage';
export * from './pages/AwsServerlessAppPage/AwsServerlessAppPage';
export * from './pages/AwsEnvironmentProviderPage/AwsEnvironmentProviderPage';
export * from './demo';
