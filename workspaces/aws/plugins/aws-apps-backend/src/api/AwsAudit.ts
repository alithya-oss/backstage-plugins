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

import { LoggerService } from '@backstage/backend-plugin-api';
import { IAWSSDKService } from '../services/definition';

/**
 * Request parameters for recording an AWS audit event.
 *
 * @public
 */
export interface AwsAuditRequest {
  envProviderPrefix: string;
  envProviderName: string;
  appName: string;
  apiClient: IAWSSDKService;
  roleArn: string;
  logger: LoggerService;
  awsRegion: string;
  awsAccount: string;
  requester: string;
  owner: string;
  actionType: string;
  actionName: string;
  requestArgs?: string;
  status: string;
  message?: string;
}

/**
 * Response from recording an AWS audit event.
 *
 * @public
 */
export interface AwsAuditResponse {
  status: string;
  message: string;
}

/**
 * Records an audit event to the DynamoDB audit table.
 *
 * @public
 */
export async function createAuditRecord({
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
}: AwsAuditRequest): Promise<AwsAuditResponse> {
  const response: AwsAuditResponse = { status: 'Started', message: '' };

  let tableNameResponse;
  try {
    tableNameResponse = await apiClient.getSSMParameter(
      `/${envProviderPrefix.toLowerCase()}/${envProviderName.toLowerCase()}/${envProviderName.toLowerCase()}-audit`,
    );
  } catch (err) {
    response.status = 'FAILED';
    response.message = `Audit failed - audit table name was set to FIXME. ${tableNameResponse}`;
  }

  if (tableNameResponse?.Parameter?.Value) {
    const recordId = `${awsAccount}#${awsRegion}#${envProviderPrefix}#${envProviderName}#${appName}#${requester}#${actionType}#${new Date().toISOString()}`;
    const auditResponse = await apiClient.putDynamodbTableData({
      tableName: tableNameResponse.Parameter.Value,
      recordId,
      origin: 'Backstage-SDK',
      prefix: envProviderPrefix,
      environmentProviderName: envProviderName,
      appName: appName,
      actionType,
      name: actionName,
      initiatedBy: requester,
      owner,
      assumedRole: roleArn,
      targetAccount: awsAccount,
      targetRegion: awsRegion,
      request: requestArgs ?? '',
      status,
      message: message ?? '',
    });

    if (auditResponse.$metadata.httpStatusCode === 200) {
      response.status = 'Success';
    } else {
      response.status = 'FAILED';
      response.message = "Audit failed - can't extract audit table name.";
    }
  }

  return response;
}
