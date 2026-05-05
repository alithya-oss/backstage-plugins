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

import { RootConfigService } from '@backstage/backend-plugin-api';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import yaml from 'yaml';

const ID = 'aws-apps:get-platform-metadata';

const examples = [
  {
    description: 'Retrieve data about the AWS Apps on AWS platform',
    example: yaml.stringify({
      steps: [
        {
          action: ID,
          id: 'awsAppsGetPlatformMetadata',
          name: 'Get platform information',
        },
      ],
    }),
  },
];

/**
 * Creates a scaffolder action that retrieves metadata about the
 * AWS Apps platform deployment, such as the platform region.
 *
 * @public
 */
export function getPlatformMetadataAction(options: {
  envConfig: RootConfigService;
}) {
  const { envConfig } = options;

  return createTemplateAction({
    id: ID,
    description: 'Retrieve data about the AWS Apps on AWS platform',
    supportsDryRun: true,
    examples,
    schema: {
      output: {
        platformRegion: z =>
          z
            .string()
            .describe(
              'The AWS region where the AWS Apps on AWS solution is deployed',
            ),
      },
    },
    handler: async ctx => {
      // If this is a dry run, return a hardcoded object
      if (ctx.isDryRun) {
        ctx.output('platformRegion', 'us-east-1');
        ctx.logger.info(`Dry run complete`);
        return;
      }

      const platformRegion = envConfig.getString('backend.platformRegion');
      ctx.output('platformRegion', platformRegion);
    },
  });
}
