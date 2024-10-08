## API Report File for "@alithya-oss/plugin-aws-codepipeline-backend"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts
import { AuthService } from '@backstage/backend-plugin-api';
import { AwsCredentialsManager } from '@backstage/integration-aws-node';
import { AwsResourceLocator } from '@alithya-oss/plugin-aws-core-common';
import { BackendFeatureCompat } from '@backstage/backend-plugin-api';
import { BackstageCredentials } from '@backstage/backend-plugin-api';
import { CatalogApi } from '@backstage/catalog-client';
import { CompoundEntityRef } from '@backstage/catalog-model';
import { Config } from '@backstage/config';
import { DiscoveryService } from '@backstage/backend-plugin-api';
import express from 'express';
import { HttpAuthService } from '@backstage/backend-plugin-api';
import { Logger } from 'winston';
import { PipelineExecutionsResponse } from '@alithya-oss/plugin-aws-codepipeline-common';
import { PipelineStateResponse } from '@alithya-oss/plugin-aws-codepipeline-common';

// @public (undocumented)
export interface AwsCodePipelineService {
  // (undocumented)
  getPipelineExecutionsByEntity(options: {
    entityRef: CompoundEntityRef;
    credentials?: BackstageCredentials;
  }): Promise<PipelineExecutionsResponse>;
  // (undocumented)
  getPipelineStateByEntity(options: {
    entityRef: CompoundEntityRef;
    credentials?: BackstageCredentials;
  }): Promise<PipelineStateResponse>;
}

// @public (undocumented)
const awsCodePiplinePlugin: BackendFeatureCompat;
export default awsCodePiplinePlugin;

// @public (undocumented)
export function createRouter(options: RouterOptions): Promise<express.Router>;

// @public (undocumented)
export class DefaultAwsCodePipelineService implements AwsCodePipelineService {
  constructor(
    logger: Logger,
    auth: AuthService,
    catalogApi: CatalogApi,
    resourceLocator: AwsResourceLocator,
    credsManager: AwsCredentialsManager,
  );
  // (undocumented)
  static fromConfig(
    config: Config,
    options: {
      catalogApi: CatalogApi;
      discovery: DiscoveryService;
      auth?: AuthService;
      httpAuth?: HttpAuthService;
      logger: Logger;
      resourceLocator?: AwsResourceLocator;
    },
  ): Promise<DefaultAwsCodePipelineService>;
  // (undocumented)
  getPipelineExecutionsByEntity(options: {
    entityRef: CompoundEntityRef;
    credentials?: BackstageCredentials;
  }): Promise<PipelineExecutionsResponse>;
  // (undocumented)
  getPipelineStateByEntity(options: {
    entityRef: CompoundEntityRef;
    credentials?: BackstageCredentials;
  }): Promise<PipelineStateResponse>;
}

// @public (undocumented)
export interface RouterOptions {
  // (undocumented)
  auth?: AuthService;
  // (undocumented)
  awsCodePipelineApi: AwsCodePipelineService;
  // (undocumented)
  discovery: DiscoveryService;
  // (undocumented)
  httpAuth?: HttpAuthService;
  // (undocumented)
  logger: Logger;
}

// (No @packageDocumentation comment for this package)
```
