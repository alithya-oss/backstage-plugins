// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { StackStatus } from '@aws-sdk/client-cloudformation';

/**
 * Additional deployment statuses beyond CloudFormation stack statuses.
 *
 * @public
 */
export enum ExtraStackDeployStatus {
  STAGED = 'STAGED',
  UNSTAGED = 'UNSTAGED',
}

/**
 * Supported AWS environment provider types.
 *
 * @public
 */
export enum ProviderType {
  ECS = 'ecs',
  EKS = 'eks',
  SERVERLESS = 'serverless',
  GENAI_SERVERLESS = 'gen-ai-serverless',
}

/**
 * Union of CloudFormation stack statuses and custom deployment statuses.
 *
 * @public
 */
export type DeployStackStatus = StackStatus | ExtraStackDeployStatus;

/**
 * Application subtypes for AWS deployments.
 *
 * @public
 */
export enum APP_SUBTYPE {
  ECS = 'aws-ecs',
  EKS = 'aws-eks',
  SERVERLESS = 'aws-serverless',
}

/**
 * HTTP method constants.
 *
 * @public
 */
export enum HTTP {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  OPTIONS = 'OPTIONS',
  HEAD = 'HEAD',
}
