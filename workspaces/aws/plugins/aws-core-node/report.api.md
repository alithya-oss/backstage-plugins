## API Report File for "@alithya-oss/backstage-plugin-aws-core-node"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts
import { Config } from '@backstage/config';
import { ConfigServiceClient } from '@aws-sdk/client-config-service';
import { DefaultAwsCredentialsManager } from '@backstage/integration-aws-node';
import { LoggerService } from '@backstage/backend-plugin-api';
import { ResourceExplorer2Client } from '@aws-sdk/client-resource-explorer-2';
import { ResourceGroupsTaggingAPIClient } from '@aws-sdk/client-resource-groups-tagging-api';

// @public (undocumented)
export class AwsConfigResourceLocator implements AwsResourceLocator {
  constructor(
    logger: LoggerService,
    client: ConfigServiceClient,
    aggregatorName: string | undefined,
  );
  // (undocumented)
  static readonly AWS_CONFIG_QUERY_TEMPLATE = 'SELECT arn';
  // (undocumented)
  static fromConfig(
    config: Config,
    options: {
      logger: LoggerService;
    },
  ): Promise<AwsConfigResourceLocator>;
  // (undocumented)
  getResourceArns({
    resourceType,
    tagString,
  }: {
    resourceType: string;
    tagString: string;
  }): Promise<string[]>;
}

// @public (undocumented)
export class AwsResourceExplorerLocator implements AwsResourceLocator {
  constructor(
    logger: LoggerService,
    client: ResourceExplorer2Client,
    viewArn: string | undefined,
  );
  // (undocumented)
  static fromConfig(
    config: Config,
    options: {
      logger: LoggerService;
    },
  ): Promise<AwsResourceExplorerLocator>;
  // (undocumented)
  getResourceArns({
    resourceType,
    tagString,
  }: {
    resourceType: string;
    tagString: string;
  }): Promise<string[]>;
}

// @public (undocumented)
export interface AwsResourceLocator {
  // (undocumented)
  getResourceArns({
    resourceType,
    tagString,
  }: {
    resourceType: string;
    tagString: string;
  }): Promise<string[]>;
}

// @public (undocumented)
export class AwsResourceLocatorFactory {
  // (undocumented)
  static fromConfig(
    config: Config,
    logger: LoggerService,
  ): Promise<AwsResourceLocator>;
}

// @public (undocumented)
export class AwsResourceTaggingApiLocator implements AwsResourceLocator {
  constructor(instances: AwsResourceTaggingApiLocatorInstance[]);
  // (undocumented)
  static fromConfig(
    config: Config,
    options: {
      logger: LoggerService;
    },
  ): Promise<AwsResourceTaggingApiLocator>;
  // (undocumented)
  getResourceArns({
    resourceType,
    tagString,
  }: {
    resourceType: string;
    tagString: string;
  }): Promise<string[]>;
}

// @public (undocumented)
export class AwsResourceTaggingApiLocatorInstance {
  constructor(logger: LoggerService, client: ResourceGroupsTaggingAPIClient);
  // (undocumented)
  static create(options: {
    credsManager: DefaultAwsCredentialsManager;
    accountId: string | undefined;
    region: string | undefined;
    logger: LoggerService;
  }): Promise<AwsResourceTaggingApiLocatorInstance>;
  // (undocumented)
  getResourceArns({
    resourceType,
    tagString,
  }: {
    resourceType: string;
    tagString: string;
  }): Promise<string[]>;
}

// (No @packageDocumentation comment for this package)
```
