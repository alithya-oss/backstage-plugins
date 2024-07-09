import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { timesaverPlugin, TimesaverPage } from '../src/plugin';

createDevApp()
  .registerPlugin(timesaverPlugin)
  .addPage({
    element: <TimesaverPage />,
    title: 'Root Page',
    path: '/timesaver',
  })
  .render();
