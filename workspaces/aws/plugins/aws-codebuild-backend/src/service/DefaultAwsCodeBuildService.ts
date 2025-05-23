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

import { parse } from '@aws-sdk/util-arn-parser';
import { CatalogApi } from '@backstage/catalog-client';
import {
  AwsResourceLocator,
  AwsResourceLocatorFactory,
} from '@alithya-oss/backstage-plugin-aws-core-node';
import {
  AWS_SDK_CUSTOM_USER_AGENT,
  getOneOfEntityAnnotations,
} from '@alithya-oss/backstage-plugin-aws-core-common';
import {
  AwsCredentialsManager,
  DefaultAwsCredentialsManager,
} from '@backstage/integration-aws-node';
import {
  CompoundEntityRef,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import { AwsCodeBuildService } from './types';
import { Config } from '@backstage/config';
import {
  BatchGetBuildsCommand,
  BatchGetProjectsCommand,
  Build,
  CodeBuildClient,
  ListBuildsForProjectCommand,
} from '@aws-sdk/client-codebuild';
import {
  AWS_CODEBUILD_ARN_ANNOTATION,
  AWS_CODEBUILD_ARN_ANNOTATION_LEGACY,
  AWS_CODEBUILD_TAGS_ANNOTATION,
  ProjectsResponse,
} from '@alithya-oss/backstage-plugin-aws-codebuild-common';
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
import { catalogServiceRef } from '@backstage/plugin-catalog-node/alpha';

/** @public */
export class DefaultAwsCodeBuildService implements AwsCodeBuildService {
  public constructor(
    private readonly logger: LoggerService,
    private readonly auth: AuthService,
    private readonly catalogApi: CatalogApi,
    private readonly resourceLocator: AwsResourceLocator,
    private readonly credsManager: AwsCredentialsManager,
  ) {}

  static async fromConfig(
    config: Config,
    options: {
      catalogApi: CatalogApi;
      discovery: DiscoveryService;
      auth?: AuthService;
      httpAuth?: HttpAuthService;
      logger: LoggerService;
      resourceLocator?: AwsResourceLocator;
    },
  ) {
    const credsManager = DefaultAwsCredentialsManager.fromConfig(config);

    const { auth } = createLegacyAuthAdapters(options);

    const resourceLocator =
      options?.resourceLocator ??
      (await AwsResourceLocatorFactory.fromConfig(config, options.logger));

    return new DefaultAwsCodeBuildService(
      options.logger,
      auth,
      options.catalogApi,
      resourceLocator,
      credsManager,
    );
  }

  public async getProjectsByEntity(options: {
    entityRef: CompoundEntityRef;
    credentials?: BackstageCredentials;
  }): Promise<ProjectsResponse> {
    this.logger?.debug(`Fetch CodeBuild projects for ${options.entityRef}`);

    const arns = await this.getCodeBuildArnsForEntity(options);

    const projects = await Promise.all(
      arns.map(async arn => {
        const { region, accountId, resource } = parse(arn);

        const projectName = resource.split('/')[1];

        const client = await this.getClient(region, arn);
        const projectResponse = await client.send(
          new BatchGetProjectsCommand({
            names: [projectName],
          }),
        );

        const project = projectResponse.projects![0];

        const buildIds = await client.send(
          new ListBuildsForProjectCommand({
            projectName,
          }),
        );

        let builds: Build[] = [];

        if (buildIds.ids && buildIds.ids.length > 0) {
          const output = await client.send(
            new BatchGetBuildsCommand({
              ids: buildIds.ids.slice(0, 5),
            }),
          );
          builds = output.builds ?? [];
        }

        return {
          project,
          projectName,
          projectRegion: region,
          projectAccountId: accountId,
          builds,
        };
      }),
    );

    return {
      projects,
    };
  }

  private async getCodeBuildArnsForEntity(options: {
    entityRef: CompoundEntityRef;
    credentials?: BackstageCredentials;
  }): Promise<string[]> {
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
      AWS_CODEBUILD_ARN_ANNOTATION,
      AWS_CODEBUILD_TAGS_ANNOTATION,
      AWS_CODEBUILD_ARN_ANNOTATION_LEGACY,
    ]);

    if (!annotation) {
      throw new Error('Annotation not found on entity');
    }

    let arns: string[];

    if (annotation.name === AWS_CODEBUILD_TAGS_ANNOTATION) {
      arns = await this.resourceLocator.getResourceArns({
        resourceType: 'AWS::CodeBuild::Project',
        tagString: annotation.value,
      });
    } else {
      arns = [annotation.value];
    }

    return Promise.resolve(arns);
  }

  private async getClient(
    region: string,
    arn: string,
  ): Promise<CodeBuildClient> {
    const credentialProvider = await this.credsManager.getCredentialProvider({
      arn,
    });

    return new CodeBuildClient({
      region: region,
      customUserAgent: AWS_SDK_CUSTOM_USER_AGENT,
      credentialDefaultProvider: () => credentialProvider.sdkCredentialProvider,
    });
  }
}

/** @public */
export const awsCodeBuildServiceRef = createServiceRef<AwsCodeBuildService>({
  id: 'aws-codebuild.api',
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
      async factory({ logger, config, catalogApi, auth, httpAuth, discovery }) {
        return DefaultAwsCodeBuildService.fromConfig(config, {
          catalogApi,
          auth,
          httpAuth,
          discovery,
          logger,
        });
      },
    }),
});
