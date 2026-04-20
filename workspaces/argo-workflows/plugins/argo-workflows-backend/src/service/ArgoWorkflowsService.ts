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

import type { LoggerService } from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import type {
  WorkflowDetail,
  WorkflowSummary,
} from '@alithya-oss/backstage-plugin-argo-workflows-common';
import {
  mapCrdListToWorkflowSummaries,
  mapCrdToWorkflowDetail,
} from '../mappers';

/** @public */
export interface ServiceError extends Error {
  statusCode: number;
  code: string;
}

function createServiceError(
  message: string,
  code: string,
  statusCode: number,
): ServiceError {
  const err = new Error(message) as ServiceError;
  err.code = code;
  err.statusCode = statusCode;
  return err;
}

/** @public */
export interface ListWorkflowsOptions {
  labelSelector?: string;
  limit?: number;
  offset?: number;
}

/** @public */
export interface ArgoWorkflowsServiceOptions {
  logger: LoggerService;
  config: Config;
  fetchFn?: typeof fetch;
}

/** @public */
export class ArgoWorkflowsService {
  private readonly logger: LoggerService;
  private readonly clusterUrl: string;
  private readonly clusterToken?: string;
  private readonly fetchFn: typeof fetch;

  constructor(options: ArgoWorkflowsServiceOptions) {
    this.logger = options.logger;
    this.fetchFn = options.fetchFn ?? fetch;

    const clusters =
      options.config.getOptionalConfigArray(
        'kubernetes.clusterLocatorMethods',
      ) ?? [];

    let url = 'https://kubernetes.default.svc';
    let token: string | undefined;

    for (const method of clusters) {
      const clusterConfigs = method.getOptionalConfigArray('clusters') ?? [];
      if (clusterConfigs.length > 0) {
        url = clusterConfigs[0].getString('url');
        token = clusterConfigs[0].getOptionalString('serviceAccountToken');
        break;
      }
    }

    this.clusterUrl = url;
    this.clusterToken = token;
  }

  async listWorkflows(
    namespace: string,
    options?: ListWorkflowsOptions,
  ): Promise<WorkflowSummary[]> {
    const { labelSelector, limit = 20, offset = 0 } = options ?? {};

    const params = new URLSearchParams();
    if (labelSelector) {
      params.set('labelSelector', labelSelector);
    }
    // Fetch enough items to cover offset + limit
    params.set('limit', String(offset + limit));

    const apiPath = `/apis/argoproj.io/v1alpha1/namespaces/${encodeURIComponent(
      namespace,
    )}/workflows`;
    const queryString = params.toString();
    const url = `${this.clusterUrl}${apiPath}${
      queryString ? `?${queryString}` : ''
    }`;

    this.logger.debug(`Fetching workflows from ${apiPath}`, {
      namespace,
      labelSelector,
      limit,
      offset,
    });

    let response: Response;
    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };
      if (this.clusterToken) {
        headers.Authorization = `Bearer ${this.clusterToken}`;
      }
      response = await this.fetchFn(url, {
        headers,
        signal: AbortSignal.timeout(10_000),
      });
    } catch (err: any) {
      if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
        throw createServiceError(
          'Kubernetes API request timed out. The cluster may be unreachable. Try again later.',
          'GATEWAY_TIMEOUT',
          504,
        );
      }
      throw createServiceError(
        'Unable to connect to the Kubernetes cluster. Check your Backstage Kubernetes plugin configuration.',
        'BAD_GATEWAY',
        502,
      );
    }

    if (!response.ok) {
      this.mapK8sError(response.status, namespace);
    }

    let body: any;
    try {
      body = await response.json();
    } catch {
      throw createServiceError(
        'Invalid response from Kubernetes API',
        'BAD_GATEWAY',
        502,
      );
    }
    const all = mapCrdListToWorkflowSummaries(body);

    // Apply offset-based pagination
    return all.slice(offset, offset + limit);
  }

  async getWorkflow(namespace: string, name: string): Promise<WorkflowDetail> {
    const apiPath = `/apis/argoproj.io/v1alpha1/namespaces/${encodeURIComponent(
      namespace,
    )}/workflows/${encodeURIComponent(name)}`;
    const url = `${this.clusterUrl}${apiPath}`;

    this.logger.debug(`Fetching workflow detail from ${apiPath}`, {
      namespace,
      name,
    });

    let response: Response;
    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };
      if (this.clusterToken) {
        headers.Authorization = `Bearer ${this.clusterToken}`;
      }
      response = await this.fetchFn(url, {
        headers,
        signal: AbortSignal.timeout(10_000),
      });
    } catch (err: any) {
      if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
        throw createServiceError(
          'Kubernetes API request timed out. The cluster may be unreachable. Try again later.',
          'GATEWAY_TIMEOUT',
          504,
        );
      }
      throw createServiceError(
        'Unable to connect to the Kubernetes cluster. Check your Backstage Kubernetes plugin configuration.',
        'BAD_GATEWAY',
        502,
      );
    }

    if (!response.ok) {
      this.mapK8sError(response.status, namespace);
    }

    let body: any;
    try {
      body = await response.json();
    } catch {
      throw createServiceError(
        'Invalid response from Kubernetes API',
        'BAD_GATEWAY',
        502,
      );
    }

    return mapCrdToWorkflowDetail(body);
  }

  private mapK8sError(status: number, namespace: string): never {
    switch (status) {
      case 403:
        throw createServiceError(
          `Access denied to namespace '${namespace}'. The Backstage service account needs 'get' and 'list' permissions on 'workflows.argoproj.io'.`,
          'FORBIDDEN',
          403,
        );
      case 404:
        throw createServiceError(
          `Namespace '${namespace}' not found. Check the 'backstage.io/kubernetes-namespace' annotation on your entity.`,
          'NOT_FOUND',
          404,
        );
      default:
        throw createServiceError(
          'Unable to connect to the Kubernetes cluster. Check your Backstage Kubernetes plugin configuration.',
          'BAD_GATEWAY',
          502,
        );
    }
  }
}
