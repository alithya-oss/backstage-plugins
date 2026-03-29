// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { createSecret } from '../../helpers/action-context';
import { RootConfigService } from '@backstage/backend-plugin-api';

/** @public */
export function createSecretAction(options: { envConfig: RootConfigService }) {
  const { envConfig } = options;
  return createTemplateAction({
    id: 'opa:create-secret',
    description: 'Creates secret in Secret Manager',
    schema: {
      input: {
        secretName: z =>
          z
            .string()
            .describe('The name of the secret to create in SecretsManager'),
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
                Key: z.string(),
                Value: z.union([z.string(), z.number(), z.boolean()]),
              }),
            )
            .optional()
            .describe(
              'key/value pairs to apply as tags to any created AWS resources',
            ),
      },
      output: {
        secretARN: z => z.string().optional().describe('SecretARN'),
      },
    },
    async handler(ctx) {
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
        ctx.output('secretARN', ARN!);
      } catch (e) {
        throw new Error(e instanceof Error ? e.message : JSON.stringify(e));
      }
    },
  });
}
