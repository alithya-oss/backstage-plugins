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

/**
 * Parameters for promoting an application across environments.
 *
 * @public
 */
export type AppPromoParams = {
  envName: string;
  envRequiresManualApproval: boolean;
  appName: string;
  providers: AWSProviderParams[];
};

/**
 * AWS provider configuration for an application deployment.
 *
 * @public
 */
export type AWSProviderParams = {
  awsAccount: string;
  awsRegion: string;
  assumedRoleArn: string;
  environmentName: string;
  envRequiresManualApproval: boolean;
  prefix: string;
  providerName: string;
  parameters: { [key: string]: string }; // Parameters key value map for provisioning the app on the designated provider
};
