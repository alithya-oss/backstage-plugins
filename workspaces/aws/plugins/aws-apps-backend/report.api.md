## API Report File for "@alithya-oss/plugin-aws-apps-backend"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts
import { AuthService } from '@backstage/backend-plugin-api';
import { AwsCredentialIdentity } from '@aws-sdk/types';
import { AWSServiceResources } from '@alithya-oss/plugin-aws-apps-common';
import { BackendFeature } from '@backstage/backend-plugin-api';
import { BackstageUserInfo } from '@backstage/backend-plugin-api';
import { CatalogApi } from '@backstage/catalog-client';
import { Config } from '@backstage/config';
import { CreateBucketCommandOutput } from '@aws-sdk/client-s3';
import { CreateSecretCommandOutput } from '@aws-sdk/client-secrets-manager';
import { CreateStackCommandOutput } from '@aws-sdk/client-cloudformation';
import { DeleteStackCommandOutput } from '@aws-sdk/client-cloudformation';
import { DescribeClusterCommandOutput } from '@aws-sdk/client-eks';
import { DescribeLogGroupsCommandOutput } from '@aws-sdk/client-cloudwatch-logs';
import { DescribeLogStreamsCommandOutput } from '@aws-sdk/client-cloudwatch-logs';
import { DescribeStackEventsCommandOutput } from '@aws-sdk/client-cloudformation';
import { DescribeStacksCommandOutput } from '@aws-sdk/client-cloudformation';
import { DescribeTaskDefinitionCommandOutput } from '@aws-sdk/client-ecs';
import { DescribeTasksCommandOutput } from '@aws-sdk/client-ecs';
import express from 'express';
import { GetLogEventsCommandOutput } from '@aws-sdk/client-cloudwatch-logs';
import { GetLogRecordCommandOutput } from '@aws-sdk/client-cloudwatch-logs';
import { GetParameterCommandOutput } from '@aws-sdk/client-ssm';
import { GetSecretValueCommandOutput } from '@aws-sdk/client-secrets-manager';
import { HeadObjectCommandOutput } from '@aws-sdk/client-s3';
import { HttpAuthService } from '@backstage/backend-plugin-api';
import { InvokeCommandOutput } from '@aws-sdk/client-lambda';
import { ListGroupResourcesCommandOutput } from '@aws-sdk/client-resource-groups';
import { ListTasksCommandOutput } from '@aws-sdk/client-ecs';
import { LoggerService } from '@backstage/backend-plugin-api';
import { Parameter } from '@aws-sdk/client-cloudformation';
import { PermissionsService } from '@backstage/backend-plugin-api';
import { PutItemCommandOutput } from '@aws-sdk/client-dynamodb';
import { PutSecretValueCommandOutput } from '@aws-sdk/client-secrets-manager';
import { RegisterTaskDefinitionCommandOutput } from '@aws-sdk/client-ecs';
import { ScanCommandOutput } from '@aws-sdk/client-dynamodb';
import { TaskDefinition } from '@aws-sdk/client-ecs';
import { UpdateServiceCommandOutput } from '@aws-sdk/client-ecs';
import { UpdateStackCommandOutput } from '@aws-sdk/client-cloudformation';
import { UserEntity } from '@backstage/catalog-model';
import { UserInfoService } from '@backstage/backend-plugin-api';

// @public (undocumented)
export class AwsAppsApi {
  constructor(
    config: Config,
    logger: LoggerService,
    awsRegion: string,
    awsAccount: string,
  );
  // (undocumented)
  callLambda(functionName: string, body: string): Promise<InvokeCommandOutput>;
  // (undocumented)
  createS3Bucket(
    bucketName: string,
    tags?: {
      Key: string;
      Value: string | number | boolean;
    }[],
  ): Promise<CreateBucketCommandOutput>;
  // (undocumented)
  createSecret(
    secretName: string,
    description: string,
    tags?: {
      Key: string;
      Value: string | number | boolean;
    }[],
  ): Promise<CreateSecretCommandOutput>;
  createStack(
    componentName: string,
    stackName: string,
    s3BucketName: string,
    cfFileName: string,
    providerName: string,
    parameters?: Parameter[],
  ): Promise<CreateStackCommandOutput>;
  deleteStack(stackName: string): Promise<DeleteStackCommandOutput>;
  describeClusterTasks(
    clusterName: string,
    taskArns: string[],
  ): Promise<DescribeTasksCommandOutput>;
  describeStack(stackName: string): Promise<DescribeStacksCommandOutput>;
  describeStackEvents(
    stackName: string,
  ): Promise<DescribeStackEventsCommandOutput>;
  describeTaskDefinition(
    taskDefinitionArn: string,
  ): Promise<DescribeTaskDefinitionCommandOutput>;
  // (undocumented)
  doesS3FileExist(
    bucketName: string,
    fileName: string,
  ): Promise<HeadObjectCommandOutput>;
  getCategorizedResources(resourceGroup: string): Promise<AWSServiceResources>;
  // (undocumented)
  getDynamodbTable(
    tableName: string,
    appName: string,
    timeFrame: number,
  ): Promise<ScanCommandOutput>;
  getEcsServiceTask(
    clusterName: string,
    serviceName: string,
  ): Promise<ListTasksCommandOutput>;
  getEksCluster(clusterName: string): Promise<DescribeClusterCommandOutput>;
  getLogGroupEvents(
    logGroupName: string,
    logStreamName: string,
    startFromHead?: boolean,
  ): Promise<GetLogEventsCommandOutput>;
  getLogGroups(logPrefix: string): Promise<DescribeLogGroupsCommandOutput>;
  // (undocumented)
  getLogRecord(logRecordPointer: string): Promise<GetLogRecordCommandOutput>;
  getLogStreams(logGroupName: string): Promise<DescribeLogStreamsCommandOutput>;
  getResourceGroupResources(
    resourceGroupName: string,
  ): Promise<ListGroupResourcesCommandOutput>;
  getSecretValue(secretArn: string): Promise<GetSecretValueCommandOutput>;
  getSSMParameter(ssmParamName: string): Promise<GetParameterCommandOutput>;
  // (undocumented)
  putDynamodbTableData(data: DynamoDBTableData): Promise<PutItemCommandOutput>;
  // (undocumented)
  putSecretValue(
    secretArn: string,
    secretValue: string,
  ): Promise<PutSecretValueCommandOutput>;
  registerTaskDefinition(
    taskDefinition: TaskDefinition,
  ): Promise<RegisterTaskDefinitionCommandOutput>;
  updateServiceTask(
    clusterName: string,
    serviceName: string,
    taskDefinition: string,
    restart: boolean,
    numberOfTasks?: number | undefined,
  ): Promise<UpdateServiceCommandOutput>;
  updateStack(
    componentName: string,
    stackName: string,
    s3BucketName: string,
    cfFileName: string,
    providerName: string,
    parameters?: Parameter[],
  ): Promise<UpdateStackCommandOutput>;
}

// @public
const awsAppsPlugin: BackendFeature;
export default awsAppsPlugin;

// @public (undocumented)
export interface AwsAuditRequest {
  // (undocumented)
  actionName: string;
  // (undocumented)
  actionType: string;
  // (undocumented)
  apiClient: AwsAppsApi;
  // (undocumented)
  appName: string;
  // (undocumented)
  awsAccount: string;
  // (undocumented)
  awsRegion: string;
  // (undocumented)
  envProviderName: string;
  // (undocumented)
  envProviderPrefix: string;
  // (undocumented)
  logger: LoggerService;
  // (undocumented)
  message?: string;
  // (undocumented)
  owner: string;
  // (undocumented)
  requestArgs?: string;
  // (undocumented)
  requester: string;
  // (undocumented)
  roleArn: string;
  // (undocumented)
  status: string;
}

// @public (undocumented)
export interface AwsAuditResponse {
  // (undocumented)
  message: string;
  // (undocumented)
  status: string;
}

// @public (undocumented)
export interface AwsAuthResponse {
  // (undocumented)
  account: string;
  // (undocumented)
  credentials: AwsCredentialIdentity;
  // (undocumented)
  owner?: string;
  // (undocumented)
  region: string;
  // (undocumented)
  requester: string;
  // (undocumented)
  roleArn: string;
}

// @public (undocumented)
export function createAuditRecord({
  envProviderPrefix,
  envProviderName,
  appName,
  apiClient,
  roleArn,
  awsRegion,
  awsAccount,
  requester,
  owner,
  actionType,
  actionName,
  requestArgs,
  status,
  message,
}: AwsAuditRequest): Promise<AwsAuditResponse>;

// @public (undocumented)
export function createRouter(options: RouterOptions): Promise<express.Router>;

// @public (undocumented)
export type DynamoDBTableData = {
  tableName: string;
  recordId: string;
  origin: string;
  prefix: string;
  appName: string;
  environmentProviderName: string;
  actionType: string;
  name: string;
  initiatedBy: string;
  owner: string;
  assumedRole: string;
  targetAccount: string;
  targetRegion: string;
  request: string;
  status: string;
  message: string;
};

// @public (undocumented)
export function getAWScreds(
  config: Config,
  logger: LoggerService,
  accountId: string,
  region: string,
  prefix: string,
  providerName: string,
  user?: UserEntity,
  userIdentity?: BackstageUserInfo,
): Promise<AwsAuthResponse>;

// @public (undocumented)
export interface RouterOptions {
  // (undocumented)
  auth: AuthService;
  // (undocumented)
  catalogApi: CatalogApi;
  // (undocumented)
  config: Config;
  // (undocumented)
  httpAuth: HttpAuthService;
  // (undocumented)
  logger: LoggerService;
  // (undocumented)
  permissions: PermissionsService;
  // (undocumented)
  userInfo: UserInfoService;
}

// (No @packageDocumentation comment for this package)
```