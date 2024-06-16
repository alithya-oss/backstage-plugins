import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { awsAppsPlugin, AwsAppsPage } from '../src/plugin';

createDevApp()
  .registerPlugin(awsAppsPlugin)
  .addPage({
    element: <AwsAppsPage />,
    title: 'Root Page',
    path: '/aws-apps',
  })
  .render();
