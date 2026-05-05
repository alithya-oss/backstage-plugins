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

import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { createSecret } from '../../helpers/action-context';
import { Config } from '@backstage/config';
import yaml from 'yaml';

const ID = 'aws-apps:create-secret';

const examples = [
  {
    description: 'Create a new AWS Secrets Manager Secret',
    example: yaml.stringify({
      steps: [
        {
          action: ID,
          id: 'createSecretManager',
          name: 'Create a Secret',
          input: {
            secretName: 'mySecretName',
          },
        },
      ],
    }),
  },
];

/**
 * Creates a scaffolder action that provisions a new secret in AWS Secrets Manager.
 *
 * @public
 */
export function createSecretAction(options: { envConfig: Config }) {
  const { envConfig } = options;

  return createTemplateAction({
    id: ID,
    description: 'Creates secret in Secrets Manager',
    supportsDryRun: true,
    examples,
    schema: {
      input: {
        secretName: z =>
          z
            .string()
            .describe('The name of the secret to create in SecretsManager'),

        // optional params
        description: z =>
          z
            .string()
            .optional()
            .describe('An optional description of the secret'),
        region: z =>
          z
            .string()
            .optional()
            .describe('The AWS region where the new secret should be created'),
        tags: z =>
          z
            .array(
              z.object({
                Key: z.string().describe('The tag name'),
                Value: z
                  .string()
                  .or(z.number())
                  .or(z.boolean())
                  .describe('The tag value'),
              }),
            )
            .optional(),
      },
      output: {
        awsSecretArn: z => z.string().describe('The ARN of the created secret'),
      },
    },
    handler: async ctx => {
      // If this is a dry run, return a hardcoded object
      if (ctx.isDryRun) {
        ctx.output(
          'awsSecretArn',
          'arn:aws:secretsmanager:us-east-1:123456789123:secret:my-secret',
        );
        ctx.logger.info(`Dry run complete`);
        return;
      }

      const { secretName, description, tags } = ctx.input;
      let { region } = ctx.input;

      if (!region) {
        region = envConfig.getString('backend.platformRegion');
      }
      const secretDescription =
        description ?? 'Secret created from Backstage scaffolder action';

      try {
        const ARN = await createSecret(
          secretName,
          secretDescription,
          region,
          tags,
          ctx.logger,
        );
        ctx.output('awsSecretArn', ARN!);
      } catch (e) {
        throw new Error(e instanceof Error ? e.message : JSON.stringify(e));
      }
    },
  });
}
