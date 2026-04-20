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

import type { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import type {
  ArgoWorkflowsApi,
  WorkflowDetail,
  WorkflowSummary,
} from '@alithya-oss/backstage-plugin-argo-workflows-common';

/** @public */
export class ArgoWorkflowsError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.name = 'ArgoWorkflowsError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/** @public */
export class ArgoWorkflowsApiClient implements ArgoWorkflowsApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  constructor(options: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  async listWorkflows(
    namespace: string,
    labelSelector?: string,
  ): Promise<WorkflowSummary[]> {
    if (!namespace || namespace.trim() === '') {
      throw new Error('namespace is required and cannot be empty');
    }
    const baseUrl = await this.discoveryApi.getBaseUrl('argo-workflows');
    const params = new URLSearchParams();
    if (labelSelector && labelSelector.trim() !== '') {
      params.set('labelSelector', labelSelector);
    }
    const query = params.toString();
    const url = `${baseUrl}/workflows/${encodeURIComponent(namespace)}${
      query ? `?${query}` : ''
    }`;
    return this.request<WorkflowSummary[]>(url);
  }

  async getWorkflow(namespace: string, name: string): Promise<WorkflowDetail> {
    if (!namespace || namespace.trim() === '') {
      throw new Error('namespace is required and cannot be empty');
    }
    if (!name || name.trim() === '') {
      throw new Error('name is required and cannot be empty');
    }
    const baseUrl = await this.discoveryApi.getBaseUrl('argo-workflows');
    const url = `${baseUrl}/workflows/${encodeURIComponent(
      namespace,
    )}/${encodeURIComponent(name)}`;
    return this.request<WorkflowDetail>(url);
  }

  private async request<T>(url: string): Promise<T> {
    const response = await this.fetchApi.fetch(url);
    if (!response.ok) {
      throw await this.parseError(response);
    }
    try {
      return (await response.json()) as T;
    } catch (error) {
      throw new Error(
        `Failed to parse response from ${url}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async parseError(response: Response): Promise<ArgoWorkflowsError> {
    try {
      const body = await response.json();
      if (body?.error?.message) {
        return new ArgoWorkflowsError(
          body.error.message,
          body.error.code ?? 'UNKNOWN',
          body.error.statusCode ?? response.status,
        );
      }
    } catch {
      // non-JSON response — fall through
    }
    return new ArgoWorkflowsError(
      response.statusText || `Request failed with status ${response.status}`,
      'UNKNOWN',
      response.status,
    );
  }
}
