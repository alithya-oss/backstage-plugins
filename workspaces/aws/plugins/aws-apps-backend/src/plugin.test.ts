// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { startTestBackend } from '@backstage/backend-test-utils';
import { awsAppsPlugin } from './plugin';
import { mockServices } from '@backstage/backend-test-utils';

describe('plugin', () => {
  it('should start with required config', async () => {
    const { server } = await startTestBackend({
      features: [
        awsAppsPlugin,
        mockServices.rootConfig.factory({
          data: {
            backend: {
              platformRegion: 'us-east-1',
            },
          },
        }),
      ],
    });

    expect(server).toBeDefined();
  });
});
