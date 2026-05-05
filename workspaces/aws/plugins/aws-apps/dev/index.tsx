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
import { createDevApp } from '@backstage/dev-utils';
import { AppCatalogPage, awsAppsPlugin } from '../src/plugin';
import { CatalogIndexPage } from '@backstage/plugin-catalog';

createDevApp()
  .registerPlugin(awsAppsPlugin)
  // .addPage({
  //   element: <AwsAppsHomePage />,
  //   title: 'AWS Apps Home',
  //   path: '/'
  // })
  // .addPage({
  //   element: <AwsAppsHomePage />,
  //   title: 'AWS Apps Home',
  //   path: '/home'
  // })
  .addPage({
    element: <CatalogIndexPage />,
    title: 'Root Page',
    path: '/aws-apps-search-page',
  })
  .addPage({
    element: <AppCatalogPage kind="awsenvironment" />,
    title: 'AWS Environments',
    path: '/aws-apps-search-page/environments',
  })
  .addPage({
    element: <AppCatalogPage kind="awsenvironmentprovider" />,
    title: 'AWS Environment Providers',
    path: '/aws-apps-search-page/providers',
  })
  .addPage({
    element: <AppCatalogPage kind="component" />,
    title: 'AWS Apps',
    path: '/aws-apps-search-page/apps',
  })
  .addPage({
    element: <AppCatalogPage kind="resource" />,
    title: 'AWS Resources',
    path: '/aws-apps-search-page/resources',
  })
  .render();
