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
  GetResourcesCommand,
  ResourceGroupsTaggingAPIClient,
} from '@aws-sdk/client-resource-groups-tagging-api';
import { AwsCredentialIdentityProvider } from '@aws-sdk/types';
import { DefaultAwsCredentialsManager } from '@backstage/integration-aws-node';
import { convertResourceTypeString, parseResourceLocatorTags } from './utils';
import { AWS_SDK_CUSTOM_USER_AGENT } from '@alithya-oss/backstage-plugin-aws-core-common';
import { LoggerService } from '@backstage/backend-plugin-api';

/** @public */
export class AwsResourceTaggingApiLocatorInstance {
  public constructor(
    private readonly logger: LoggerService,
    private readonly client: ResourceGroupsTaggingAPIClient,
  ) {}

  static async create(options: {
    credsManager: DefaultAwsCredentialsManager;
    accountId: string | undefined;
    region: string | undefined;
    logger: LoggerService;
  }): Promise<AwsResourceTaggingApiLocatorInstance> {
    let credentialProvider: AwsCredentialIdentityProvider;

    const { accountId, region, credsManager } = options;

    if (accountId) {
      credentialProvider = (
        await credsManager.getCredentialProvider({
          accountId: accountId,
        })
      ).sdkCredentialProvider;
    } else {
      credentialProvider = (await credsManager.getCredentialProvider())
        .sdkCredentialProvider;
    }

    const client = new ResourceGroupsTaggingAPIClient({
      region: region,
      customUserAgent: AWS_SDK_CUSTOM_USER_AGENT,
      credentialDefaultProvider: () => credentialProvider,
    });

    return new AwsResourceTaggingApiLocatorInstance(options.logger, client);
  }

  async getResourceArns({
    resourceType,
    tagString,
  }: {
    resourceType: string;
    tagString: string;
  }): Promise<string[]> {
    const TagFilters = parseResourceLocatorTags(tagString).map(e => {
      return {
        Key: e.key,
        Values: [e.value],
      };
    });

    const convertedResourceType = convertResourceTypeString(resourceType);

    this.logger.debug(`Retrieving resource ARNs for ${convertedResourceType}`);

    const response = await this.client.send(
      new GetResourcesCommand({
        ResourceTypeFilters: [convertedResourceType],
        TagFilters,
      }),
    );

    return response.ResourceTagMappingList!.map(e => e.ResourceARN!);
  }
}
