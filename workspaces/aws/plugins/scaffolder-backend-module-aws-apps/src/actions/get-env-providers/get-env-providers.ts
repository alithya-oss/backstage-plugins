// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CatalogApi } from '@backstage/catalog-client';
import {
  Entity,
  EntityRelation,
  RELATION_DEPENDS_ON,
} from '@backstage/catalog-model';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import yaml from 'yaml';
import { getAWScreds } from '@alithya-oss/backstage-plugin-aws-apps-backend';
import { getSSMParameterValue } from '../../helpers/action-context';
import { EnvironmentProvider } from '../../types';

import {
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';

const ID = 'aws-apps:get-env-providers';

const examples = [
  {
    description:
      'Retreive AWS environment providers so that their configurations can be used by other template actions',
    example: yaml.stringify({
      steps: [
        {
          action: ID,
          id: 'awsAppsGetAwsEnvProviders',
          name: 'Get AWS Environment Providers',
          input: {
            environmentRef: 'awsenvironment:Test-Environment',
          },
        },
      ],
    }),
  },
];

interface DeploymentParameters {
  envName: string;
  envRef: string;
  envProviderName: string;
  envProviderType: string;
  envProviderPrefix: string;
  accountId: string;
  region: string;
  ssmAssumeRoleArn: string;
  ssmPathVpc: string;
  ssmPublicSubnets: string;
  ssmPrivateSubnets: string;
  ssmPathCluster: string;
  kubectlLambdaArn?: string;
  kubectlLambdaRoleArn?: string;
}

/**
 * Creates a scaffolder action that retrieves AWS environment provider
 * configurations from the Backstage catalog for use in deployment workflows.
 *
 * @public
 */
export function getEnvProvidersAction(options: {
  config: RootConfigService;
  logger: LoggerService;
  catalogClient: CatalogApi;
}) {
  const { config, logger, catalogClient } = options;

  return createTemplateAction({
    id: ID,
    description: 'Retrieves AWS Environment Provider data',
    supportsDryRun: true,
    examples,
    schema: {
      input: {
        environmentRef: z =>
          z
            .string()
            .describe('The entity reference identifier for an AWS Environment'),
      },
      output: {
        envName: z => z.string().describe('The AWS environment name'),
        envShortName: z =>
          z
            .string()
            .describe('The short AWS environment name e.g. dev, qa, prod'),
        envRef: z =>
          z.string().describe('The entity reference ID of the environment'),
        envDeployManualApproval: z =>
          z
            .boolean()
            .describe(
              'Whether manual approval is required for deploying to the environment',
            ),
        envProviders: z =>
          z
            .array(
              z.object({
                envProviderName: z
                  .string()
                  .describe('The AWS environment provider name'),
                envProviderType: z
                  .string()
                  .describe('The AWS environment provider type'),
                envProviderPrefix: z
                  .string()
                  .describe('The AWS environment provider prefix'),
                accountId: z
                  .string()
                  .describe(
                    'The AWS account where infrastructure will be deployed',
                  ),
                region: z
                  .string()
                  .describe(
                    'The AWS region where infrastructure will be deployed',
                  ),
                vpcId: z
                  .string()
                  .describe(
                    'The VPC identifier where infrastructure will be deployed',
                  ),
                publicSubnets: z.string().describe('The VPC public subnet ids'),
                privateSubnets: z
                  .string()
                  .describe('The VPC private subnet ids'),
                assumedRoleArn: z
                  .string()
                  .describe(
                    'The ARN of AWS IAM role that can be assumed to deploy resources to the environment provider',
                  ),

                // optional output attributes that are only returned for providers that have compute clusters
                clusterArn: z
                  .string()
                  .optional()
                  .describe(
                    'The ARN of the cluster where the service and task are deployed, if needed. A cluster could be ECS or EKS',
                  ),
                kubectlLambdaArn: z
                  .string()
                  .optional()
                  .describe(
                    "EKS Only - The ARN of the lambda function that that can execute kubectl commands against the provider's EKS cluster",
                  ),
                kubectlLambdaRoleArn: z
                  .string()
                  .optional()
                  .describe(
                    "The ARN of the IAM role for the lambda function that that can execute kubectl commands against the provider's EKS cluster",
                  ),
              }),
            )
            .describe('The AWS environment providers'),
      },
    },
    handler: async ctx => {
      const { environmentRef } = ctx.input;
      const token = ctx.secrets?.backstageToken;

      ctx.logger.info(`environmentRef: ${environmentRef}`);

      // If this is a dry run, return a hardcoded object
      if (ctx.isDryRun) {
        ctx.output('envName', 'envName');
        ctx.output('envRef', environmentRef);
        ctx.output('envDeployManualApproval', false);
        ctx.output('envShortName', 'envShortName');
        ctx.output('envProviders', [
          {
            envProviderName: 'envProviderName',
            envProviderType: 'eks',
            envProviderPrefix: 'pre',
            accountId: '123456789123',
            region: 'us-east-1',
            vpcId: 'vpc-123123123abc',
            publicSubnets: 'subnet-123,subnet-456,subnet-789',
            privateSubnets: 'subnet-023,subnet-056,subnet-089',
            clusterArn: 'arn:aws:eks:us-east-1:123456789123:cluster/my-cluster',
            assumedRoleArn: 'arn:aws:iam::123456789123:role/some-role',
            kubectlLambdaArn:
              'arn:aws:lambda:us-east-1:123456789123:function:my-function',
            kubectlLambdaRoleArn: 'arn:aws:iam::123456789123:role/kubectl-role',
          },
        ]);

        ctx.logger.info(`Dry run complete`);
        return;
      }

      // If there is no user, then look for a context initiator to create a user entity
      // This can occur when using automation keys
      if (ctx.user?.entity === undefined) {
        ctx.logger.debug(
          `No user context provided for ${ID} action.  Setting user based on initiator credentials`,
        );
        const initiatorCredentials = await ctx.getInitiatorCredentials();
        const principal = initiatorCredentials.principal;
        ctx.logger.debug(
          `Initiator credentials principal: ${JSON.stringify(principal)}`,
        );
        // convert the unknown type 'principal'
        const typedPrincipal: { type: string; subject: string } =
          principal as any;

        // Verify the automationKey value.  If it matches, set an automation user in the context
        const automationUserName = typedPrincipal.subject || 'Automation User';
        const automationUserType = typedPrincipal.type || 'automation';
        ctx.user = {
          entity: {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'User',
            metadata: { name: automationUserType },
            spec: { profile: { displayName: automationUserName } },
          },
        };
      }

      const awsEnvEntity = await catalogClient.getEntityByRef(environmentRef, {
        token,
      });
      if (awsEnvEntity === undefined) {
        throw new Error(
          `The environment entity "${environmentRef}" could not be located in the catalog.`,
        );
      }

      const envShortName = awsEnvEntity.metadata.shortName?.toString() ?? '';
      ctx.output('envName', awsEnvEntity.metadata.name);
      ctx.output('envRef', environmentRef);
      ctx.output(
        'envDeployManualApproval',
        awsEnvEntity.metadata.deploymentRequiresApproval?.toString() ===
          'true' || '',
      );
      ctx.output('envShortName', envShortName);

      const deploymentParametersArray = await getEnvDeploymentParameters(
        awsEnvEntity,
      );

      ctx.logger.debug(
        `envProviders info: ${JSON.stringify(
          deploymentParametersArray,
          null,
          2,
        )}`,
      );

      const envProviderOutputArray: EnvironmentProvider[] = [];

      // looping over all providers of the selected environment
      for (const params of deploymentParametersArray) {
        const {
          accountId,
          region,
          ssmAssumeRoleArn,
          ssmPathVpc,
          ssmPublicSubnets,
          ssmPrivateSubnets,
          ssmPathCluster,
          envProviderName,
          envProviderType,
          envProviderPrefix,
          kubectlLambdaArn,
          kubectlLambdaRoleArn,
        } = params;

        if (!accountId) {
          throw new Error(
            `accountId not configured for environment provider: ${envProviderName}. The provider IaC deployment may have failed.`,
          );
        }
        if (!region) {
          throw new Error(
            `region not configured for environment provider: ${envProviderName}. The provider IaC deployment may have failed.`,
          );
        }
        if (!ssmAssumeRoleArn) {
          throw new Error(
            `ssmAssumeRoleArn not configured for environment provider: ${envProviderName}. The provider IaC deployment may have failed.`,
          );
        }
        if (!ssmPathVpc) {
          if (envProviderType === 'ecs' || envProviderType === 'eks') {
            throw new Error(
              `ssmPathVpc not configured for environment provider: ${envProviderName}. The provider IaC deployment may have failed.`,
            );
          } else {
            ctx.logger.info('No VPC configured for the environment provider');
          }
        }

        // Get AWS credentials for the specific provider
        ctx.logger.info(
          `Getting credentials for AWS deployment to account ${accountId} in ${region}`,
        );
        const response = await getAWScreds(
          config,
          logger,
          accountId,
          region,
          envProviderPrefix,
          envProviderName,
          ctx.user!.entity!,
        );
        const { credentials } = response;

        try {
          const vpcId = !!ssmPathVpc
            ? await getSSMParameterValue(
                region,
                credentials,
                ssmPathVpc,
                ctx.logger,
              )
            : '';
          const publicSubnets = !!ssmPathVpc
            ? await getSSMParameterValue(
                region,
                credentials,
                ssmPublicSubnets,
                ctx.logger,
              )
            : '';
          const privateSubnets = !!ssmPathVpc
            ? await getSSMParameterValue(
                region,
                credentials,
                ssmPrivateSubnets,
                ctx.logger,
              )
            : '';
          const clusterArn =
            envProviderType === 'ecs' || envProviderType === 'eks'
              ? await getSSMParameterValue(
                  region,
                  credentials,
                  ssmPathCluster,
                  ctx.logger,
                )
              : '';
          const assumedRoleArn = await getSSMParameterValue(
            region,
            credentials,
            ssmAssumeRoleArn,
            ctx.logger,
          );

          const envProvider: EnvironmentProvider = {
            envProviderName,
            envProviderType,
            envProviderPrefix,
            accountId,
            region,
            vpcId,
            publicSubnets,
            privateSubnets,
            clusterArn,
            assumedRoleArn,
          };

          if (kubectlLambdaArn) {
            envProvider.kubectlLambdaArn = kubectlLambdaArn;
          }
          if (kubectlLambdaRoleArn) {
            envProvider.kubectlLambdaRoleArn = kubectlLambdaRoleArn;
          }

          envProviderOutputArray.push(envProvider);
        } catch (err: any) {
          throw new Error(
            `Failed to populate environment provider ${envProviderName}. ${err.toString()}`,
          );
        }
      }

      ctx.logger.info(
        `Resolved environment providers: ${JSON.stringify(
          envProviderOutputArray,
          null,
          2,
        )}`,
      );

      ctx.output('envProviders', envProviderOutputArray);

      // For a given AWS Environment entity, get the defined attributes required for a deployment to AWS
      async function getEnvDeploymentParameters(
        envEntity: Entity,
      ): Promise<DeploymentParameters[]> {
        const entityRelations: EntityRelation[] = envEntity?.relations ?? [];
        const envProvRefs: string[] = entityRelations
          .filter(
            envProvRel =>
              envProvRel.type === RELATION_DEPENDS_ON &&
              envProvRel.targetRef.startsWith('awsenvironmentprovider'),
          )
          .map(envProvRel => envProvRel.targetRef);

        const envProviderEntities = await catalogClient.getEntitiesByRefs(
          { entityRefs: envProvRefs },
          { token },
        );

        return envProviderEntities.items
          .filter(
            entity =>
              entity &&
              ['name', 'envType', 'awsAccount', 'awsRegion', 'vpc'].every(
                key => key in entity.metadata,
              ),
          )
          .map(entity => {
            const { metadata } = entity!;
            const vpc = metadata.vpc?.toString() ?? '';

            const deployParams: DeploymentParameters = {
              envProviderPrefix: metadata.prefix?.toString() ?? '',
              envName: envEntity.metadata.name,
              envProviderName: metadata.name,
              envRef: environmentRef,
              envProviderType: metadata.envType?.toString().toLowerCase() ?? '',
              accountId: metadata.awsAccount?.toString() ?? '',
              region: metadata.awsRegion?.toString() ?? '',
              ssmAssumeRoleArn: metadata.provisioningRole?.toString() ?? '',
              ssmPathVpc: vpc,
              ssmPrivateSubnets: `${vpc}/private-subnets`,
              ssmPublicSubnets: `${vpc}/public-subnets`,
              ssmPathCluster: metadata.clusterName?.toString() ?? '',
            };

            if (metadata.kubectlLambdaArn) {
              deployParams.kubectlLambdaArn =
                metadata.kubectlLambdaArn.toString();
            }
            if (metadata.clusterAdminRole) {
              deployParams.kubectlLambdaRoleArn =
                metadata.clusterAdminRole.toString();
            }

            return deployParams;
          });
      }
    },
  });
}
