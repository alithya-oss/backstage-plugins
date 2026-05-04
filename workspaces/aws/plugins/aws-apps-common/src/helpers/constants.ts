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
 * Union of CloudFormation stack statuses and custom deployment statuses.
 *
 * @public
 */
export type DeployStackStatus = StackStatus | ExtraStackDeployStatus;
