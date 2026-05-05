/*
 * Copyright 2026 The Alithya Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// SPDX-License-Identifier: Apache-2.0

import { StackStatus } from '@aws-sdk/client-cloudformation';

/** @public */
export enum ExtraStackDeployStatus {
  STAGED = 'STAGED',
  UNSTAGED = 'UNSTAGED',
}

/** @public */
export enum ProviderType {
  ECS = 'ecs',
  EKS = 'eks',
  SERVERLESS = 'serverless',
  GENAI_SERVERLESS = 'gen-ai-serverless',
}

/** @public */
export type DeployStackStatus = StackStatus | ExtraStackDeployStatus;

/** @public */
export enum APP_SUBTYPE {
  ECS = 'aws-ecs',
  EKS = 'aws-eks',
  SERVERLESS = 'aws-serverless',
}

/** @public */
export enum HTTP {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  OPTIONS = 'OPTIONS',
  HEAD = 'HEAD',
}
