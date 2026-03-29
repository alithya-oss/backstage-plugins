// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
// import { getAWScreds, AwsAppsApi, createAuditRecord } from '@alithya-oss/backstage-plugin-aws-apps-backend';
import { EnvironmentProvider } from '../../types';

/** @public */
export function createS3BucketAction() {
  return createTemplateAction({
    id: 'opa:create-s3-bucket',
    description: 'Creates an S3 bucket',
    schema: {
      input: {
        bucketName: z =>
          z.string().describe('The name of the S3 bucket to create'),
        envProviders: z =>
          z
            .array(z.custom<EnvironmentProvider>())
            .describe(
              'The AWS environment providers containing account and region info',
            ),
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
        awsBucketName: z => z.string().describe('S3 Bucket Name'),
      },
    },
    async handler() {
      // We plan to remove/depricate this scaffolder action...
      // const { bucketName, tags, envProviders } = ctx.input;
      // // TODO add support for multiaccount/multiregion
      // const { accountId, region } = envProviders[0];
      // const creds = await getAWScreds(accountId, region, ctx.user!.entity!);
      // const apiClient = new AwsAppsApi(ctx.logger, creds.credentials, region, accountId);
      // ctx.logger.info(`Creating bucket with name: ${bucketName}-${accountId}-${region}`);
      // try {
      //   const response = await apiClient.createS3Bucket(bucketName, tags);
      //   ctx.output('awsBucketName', response.Location!.slice(1));
      //   const auditResponse = await createAuditRecord({
      //     actionType: 'Create S3 Bucket',
      //     actionName: response.Location!.slice(1),
      //     apiClient: apiClient,
      //     roleArn: creds.roleArn,
      //     awsAccount: accountId,
      //     awsRegion: region,
      //     logger: ctx.logger,
      //     requester: ctx.user!.entity!.metadata.name,
      //     status: response.$metadata.httpStatusCode === 200 ? 'SUCCESS' : 'FAILED',
      //     owner: creds.owner || '',
      //     envProviderName: "FIXME", // FIXME createS3BucketAction pass envProviderName
      //     envProviderPrefix: "FIXME", // FIXME createS3BucketAction pass envProviderPrefix
      //   });
      //   if (auditResponse.status === 'FAILED') {
      //     throw Error;
      //   }
      // } catch (e) {
      //   throw new Error(e instanceof Error ? e.message : JSON.stringify(e));
      // }
    },
  });
}
