/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  CostExplorerClient,
  Expression,
  GetCostAndUsageCommand,
  GetCostAndUsageCommandOutput,
  Granularity,
  GroupDefinition,
  GroupDefinitionType,
} from '@aws-sdk/client-cost-explorer';
import {
  COST_INSIGHTS_AWS_COST_CATEGORY_ANNOTATION,
  COST_INSIGHTS_AWS_TAGS_ANNOTATION,
} from '@alithya-oss/backstage-plugin-cost-insights-aws-common';
import {
  ChangeStatistic,
  Cost,
  DateAggregation,
  Trendline,
} from '@backstage-community/plugin-cost-insights-common';
import { CatalogApi } from '@backstage/catalog-client';
import {
  AWS_SDK_CUSTOM_USER_AGENT,
  getOneOfEntityAnnotations,
} from '@alithya-oss/backstage-plugin-aws-core-common';
import {
  CompoundEntityRef,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import { CostInsightsAwsService } from './types';
import {
  AwsCredentialsManager,
  DefaultAwsCredentialsManager,
} from '@backstage/integration-aws-node';
import {
  AuthService,
  BackstageCredentials,
  coreServices,
  createServiceFactory,
  createServiceRef,
  DiscoveryService,
  HttpAuthService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { createLegacyAuthAdapters } from '@backstage/backend-common';
import { AwsCredentialIdentityProvider } from '@aws-sdk/types';
import regression, { DataPoint } from 'regression';
import { CostInsightsAwsConfig, readCostInsightsAwsConfig } from '../config';
import { DateTime, Duration as LuxonDuration } from 'luxon';
import { catalogServiceRef } from '@backstage/plugin-catalog-node/alpha';

/** @public */
export class CostExplorerCostInsightsAwsService
  implements CostInsightsAwsService
{
  public constructor(
    private readonly logger: LoggerService,
    private readonly auth: AuthService,
    private readonly catalogApi: CatalogApi,
    private readonly costExplorerClient: CostExplorerClient,
    private readonly config: CostInsightsAwsConfig,
  ) {}

  static async fromConfig(
    config: CostInsightsAwsConfig,
    options: {
      catalogApi: CatalogApi;
      discovery: DiscoveryService;
      auth?: AuthService;
      httpAuth?: HttpAuthService;
      logger: LoggerService;
      credentialsManager: AwsCredentialsManager;
    },
  ) {
    const { auth } = createLegacyAuthAdapters(options);

    const { region, accountId } = config.costExplorer;

    const { credentialsManager } = options;

    let credentialProvider: AwsCredentialIdentityProvider;

    if (accountId) {
      credentialProvider = (
        await credentialsManager.getCredentialProvider({ accountId })
      ).sdkCredentialProvider;
    } else {
      credentialProvider = (await credentialsManager.getCredentialProvider())
        .sdkCredentialProvider;
    }

    const costExplorerClient = new CostExplorerClient({
      region: region,
      customUserAgent: AWS_SDK_CUSTOM_USER_AGENT,
      credentialDefaultProvider: () => credentialProvider,
    });

    return new CostExplorerCostInsightsAwsService(
      options.logger,
      auth,
      options.catalogApi,
      costExplorerClient,
      config,
    );
  }

  public async getCatalogEntityDailyCost(options: {
    entityRef: CompoundEntityRef;
    intervals: string;
    credentials?: BackstageCredentials;
  }): Promise<Cost> {
    this.logger.debug(`Fetch daily costs for ${options.entityRef.name}`);

    const entity = await this.catalogApi.getEntityByRef(
      options.entityRef,
      options.credentials &&
        (await this.auth.getPluginRequestToken({
          onBehalfOf: options.credentials,
          targetPluginId: 'catalog',
        })),
    );

    if (!entity) {
      throw new Error(
        `Couldn't find entity with name: ${stringifyEntityRef(
          options.entityRef,
        )}`,
      );
    }

    const annotation = getOneOfEntityAnnotations(entity, [
      COST_INSIGHTS_AWS_COST_CATEGORY_ANNOTATION,
      COST_INSIGHTS_AWS_TAGS_ANNOTATION,
    ]);

    if (!annotation) {
      throw new Error('Annotation not found on entity');
    }

    let filter: Expression;

    if (annotation.name === COST_INSIGHTS_AWS_TAGS_ANNOTATION) {
      const tagFilters = annotation.value.split(',').map(e => {
        const parts: string[] = e.split('=');

        return {
          Tags: {
            Key: parts[0],
            Values: [parts[1]],
          },
        };
      });

      if (tagFilters.length > 1) {
        filter = {
          And: tagFilters,
        };
      } else {
        filter = tagFilters[0];
      }
    } else {
      filter = {
        CostCategories: {
          Key: 'TAG',
          Values: annotation.value.split(','),
        },
      };
    }

    const { startDate, endDate } = this.parseInterval(options.intervals);

    const root = await this.getAggregations(
      entity.metadata.name,
      filter,
      startDate,
      endDate,
    );

    const promises = [];

    const groupedCosts: Record<string, Cost[]> | undefined = {};

    for (const entityGroup of this.config.entityGroups) {
      if (entityGroup.kind === entity.kind) {
        for (const group of entityGroup.groups) {
          promises.push(
            this.getGroupedAggregations(
              filter,
              [
                {
                  Type: group.type as GroupDefinitionType,
                  Key: group.key as GroupDefinition['Key'],
                },
              ],
              startDate,
              endDate,
            ).then(e => {
              return {
                name: group.name,
                costs: e,
              };
            }),
          );
        }
      }
    }

    await Promise.all(promises).then(values => {
      for (const result of values) {
        groupedCosts[result.name] = result.costs;
      }
    });

    root.groupedCosts = groupedCosts;

    return root;
  }

  private async getAggregations(
    id: string,
    filter: Expression | undefined,
    startDate: Date,
    endDate: Date,
  ): Promise<Cost> {
    const response: GetCostAndUsageCommandOutput =
      await this.costExplorerClient.send(
        new GetCostAndUsageCommand({
          TimePeriod: {
            Start: this.formatDate(endDate),
            End: this.formatDate(startDate),
          },
          Granularity: Granularity.DAILY,
          Metrics: ['UnblendedCost'],
          Filter: filter,
        }),
      );

    const aggregation = response.ResultsByTime!.map(result => {
      return {
        date: result.TimePeriod!.Start!.replaceAll('-', '/'),
        amount: parseFloat(result.Total!.UnblendedCost.Amount!),
      };
    });

    return {
      id,
      aggregation,
      change: this.changeOf(aggregation),
      trendline: this.trendlineOf(aggregation),
    } as Cost;
  }

  private async getGroupedAggregations(
    filter: Expression | undefined,
    groupBy: GroupDefinition[] | undefined,
    startDate: Date,
    endDate: Date,
  ): Promise<Cost[]> {
    const response: GetCostAndUsageCommandOutput =
      await this.costExplorerClient.send(
        new GetCostAndUsageCommand({
          TimePeriod: {
            Start: this.formatDate(endDate),
            End: this.formatDate(startDate),
          },
          Granularity: Granularity.DAILY,
          Metrics: ['UnblendedCost'],
          Filter: filter,
          GroupBy: groupBy,
        }),
      );

    const aggregations: Record<string, DateAggregation[]> = {};

    if (response.ResultsByTime) {
      for (const result of response.ResultsByTime) {
        const resultDate = result.TimePeriod!.Start!.replaceAll('-', '/');

        if (result.Groups) {
          for (const groupResult of result.Groups) {
            const key = groupResult.Keys![0];

            if (!aggregations[key]) {
              aggregations[key] = [];
            }

            aggregations[key].push({
              date: resultDate,
              amount: parseFloat(groupResult.Metrics!.UnblendedCost.Amount!),
            });
          }
        }
      }
    }

    return Promise.resolve(
      Object.entries(aggregations).map(([k, v]) => {
        return {
          id: k,
          aggregation: v,
          change: undefined,
          trendline: undefined,
        } as Cost;
      }),
    );
  }

  private formatDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private parseInterval(intervals: string) {
    const parts = intervals.split('/');

    if (parts.length !== 3) {
      throw new Error(`Incorrect interval for ${intervals}`);
    }

    const regex = /R(\d+)/;
    const match = RegExp(regex).exec(parts[0]);

    if (!match?.[1]) {
      throw new Error(`Failed to parse repeating interval ${parts[0]}`);
    }

    const repeat = parseInt(match[1], 10);

    const duration = LuxonDuration.fromISO(parts[1]).mapUnits(x => x * repeat);

    const endDate = DateTime.fromISO(parts[2]);
    const startDate = endDate.minus(duration);

    return {
      endDate: startDate.toUTC().toJSDate(),
      startDate: endDate.toUTC().toJSDate(),
    };
  }

  private changeOf(aggregation: DateAggregation[]): ChangeStatistic {
    const firstAmount = aggregation.length ? aggregation[0].amount : 0;
    const lastAmount = aggregation.length
      ? aggregation[aggregation.length - 1].amount
      : 0;

    if (!firstAmount || !lastAmount) {
      return {
        amount: lastAmount - firstAmount,
      };
    }

    return {
      ratio: (lastAmount - firstAmount) / firstAmount,
      amount: lastAmount - firstAmount,
    };
  }

  private trendlineOf(aggregation: DateAggregation[]): Trendline {
    const data: ReadonlyArray<DataPoint> = aggregation.map(a => [
      Date.parse(a.date) / 1000,
      a.amount,
    ]);
    const result = regression.linear(data, { precision: 5 });
    return {
      slope: result.equation[0],
      intercept: result.equation[1],
    };
  }
}

/** @public */
export const costInsightsAwsServiceRef =
  createServiceRef<CostInsightsAwsService>({
    id: 'cost-insights-aws.api',
    defaultFactory: async service =>
      createServiceFactory({
        service,
        deps: {
          logger: coreServices.logger,
          config: coreServices.rootConfig,
          catalogApi: catalogServiceRef,
          auth: coreServices.auth,
          discovery: coreServices.discovery,
          httpAuth: coreServices.httpAuth,
        },
        async factory({
          logger,
          config,
          catalogApi,
          auth,
          httpAuth,
          discovery,
        }) {
          const pluginConfig = readCostInsightsAwsConfig(config);

          return CostExplorerCostInsightsAwsService.fromConfig(pluginConfig, {
            catalogApi,
            auth,
            httpAuth,
            discovery,
            logger,
            credentialsManager: DefaultAwsCredentialsManager.fromConfig(config),
          });
        },
      }),
  });
