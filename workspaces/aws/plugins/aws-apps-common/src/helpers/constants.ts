// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { StackStatus } from '@aws-sdk/client-cloudformation';

export enum ExtraStackDeployStatus {
  STAGED = 'STAGED',
  UNSTAGED = 'UNSTAGED',
}

export type DeployStackStatus = StackStatus | ExtraStackDeployStatus;
