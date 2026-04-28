// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  createTemplateAction,
  type TemplateAction,
} from '@backstage/plugin-scaffolder-node';
import yaml from 'yaml';
import {
  EnvProviderConnectMap,
  getEnvironmentProviderConnectInfo,
  getSSMParameterValue,
} from '../../helpers/action-context';
import {
  EnvironmentProvider,
  EnvironmentProviderConnection,
} from '../../types';

import {
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';

const ID = 'aws-apps:get-ssm-parameters';

const examples = [
  {
    description:
      'Retreive AWS SSM parameter values for each environment provider so that their configurations can be used by other template actions',
    example: yaml.stringify({
      steps: [
        {
          action: ID,
          id: 'awsAppsGetSsmParams',
          name: 'Get parameter values',
          input: {
            envProviders:
              "${{ steps['opaGetAwsEnvProviders'].output.envProviders }}",
            paramKeys: -'/my/ssm/parameter',
          },
        },
      ],
    }),
  },
];

/**
 * @public
 */
export function getSsmParametersAction(
  config: RootConfigService,
  logger: LoggerService,
): TemplateAction<any, any> {
  return createTemplateAction({
    id: ID,
    description:
      'Retreive AWS SSM parameter values for each environment provider so that their configurations can be used by other template actions',
    supportsDryRun: true,
    examples,
    schema: {
      input: {
        paramKeys: z =>
          z.array(z.string()).describe('The SSM parameter keys to look up'),
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
      output: {
        params: z => z.object({}).passthrough(),
      },
    },
    handler: async ctx => {
      // If this is a dry run, return a hardcoded object
      if (ctx.isDryRun) {
        ctx.output('params', {
          myProviderName: {
            '/my/ssm/parameter': 'some value',
          },
        });

        ctx.logger.info(`Dry run complete`);
        return;
      }

      const { paramKeys, envProviders } = ctx.input;

      ctx.logger.info(`paramKeys: ${JSON.stringify(paramKeys)}`);

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

      const providerConnect: EnvProviderConnectMap =
        await getEnvironmentProviderConnectInfo(
          config,
          logger,
          envProviders as EnvironmentProvider[],
          ctx.user!.entity!,
        );

      // Get a key/value map of SSM parameters for the supplied environment provider connection
      const getEnvProviderSsmParams = async (
        connection: EnvironmentProviderConnection,
      ): Promise<{ [key: string]: string }> => {
        return (
          await Promise.all(
            paramKeys.map(
              async (paramKey): Promise<{ [key: string]: string }> => {
                const val = await getSSMParameterValue(
                  connection.region,
                  connection.awsAuthResponse.credentials,
                  paramKey,
                  ctx.logger,
                );
                return {
                  [paramKey]: val,
                };
              },
            ),
          )
        ).reduce((acc, paramKeyValMap) => {
          const typedAcc: { [key: string]: string } = acc;
          const key = Object.keys(paramKeyValMap)[0];
          return {
            ...typedAcc,
            [key]: paramKeyValMap[key],
          };
        }, {});
      };

      const paramsPerEnvProvider = (
        await Promise.all(
          envProviders.map(
            async (
              envProvider: EnvironmentProvider,
            ): Promise<{ [key: string]: { [key: string]: string } }> => {
              const { envProviderName } = envProvider;
              const envProviderConnection = providerConnect[envProviderName];
              const envParams = await getEnvProviderSsmParams(
                envProviderConnection,
              );
              return {
                [envProviderName]: envParams,
              };
            },
          ),
        )
      ).reduce((acc, envProviderNameToSsmParamsMap) => {
        const typedAcc: { [key: string]: { [key: string]: string } } = acc;
        const key = Object.keys(envProviderNameToSsmParamsMap)[0];
        return {
          ...typedAcc,
          [key]: envProviderNameToSsmParamsMap[key],
        };
      }, {});

      const maskedValues = JSON.parse(JSON.stringify(paramsPerEnvProvider)); // deep clone
      Object.keys(maskedValues).forEach(providerName => {
        const envProviderParamsMap = maskedValues[providerName];
        Object.keys(envProviderParamsMap).forEach(ssmKey => {
          if (envProviderParamsMap[ssmKey]) {
            envProviderParamsMap[ssmKey] = 'masked';
          } else {
            envProviderParamsMap[ssmKey] = 'blank or missing value';
          }
        });
      });

      ctx.logger.info(
        `masked params: ${JSON.stringify(maskedValues, null, 2)}`,
      );

      ctx.output('params', paramsPerEnvProvider);
    },
  });
}
