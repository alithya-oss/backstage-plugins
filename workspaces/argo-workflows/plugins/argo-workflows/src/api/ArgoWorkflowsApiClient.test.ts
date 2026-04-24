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

import {
  ArgoWorkflowsApiClient,
  ArgoWorkflowsError,
} from './ArgoWorkflowsApiClient';

const BASE_URL = 'http://localhost:7007/api/argo-workflows';

const mockDiscoveryApi = {
  getBaseUrl: jest.fn().mockResolvedValue(BASE_URL),
};

function createMockFetchApi(body: any, ok = true, status = 200) {
  return {
    fetch: jest.fn().mockResolvedValue({
      ok,
      status,
      statusText: ok ? 'OK' : 'Error',
      json: () => Promise.resolve(body),
    }),
  };
}

function createClient(fetchApi: { fetch: jest.Mock }) {
  return new ArgoWorkflowsApiClient({
    discoveryApi: mockDiscoveryApi as any,
    fetchApi: fetchApi as any,
  });
}

describe('ArgoWorkflowsApiClient', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('listWorkflows', () => {
    it('constructs correct URL with namespace', async () => {
      const fetchApi = createMockFetchApi([]);
      const client = createClient(fetchApi);

      await client.listWorkflows('production');

      expect(fetchApi.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/workflows/production`,
      );
    });

    it('appends labelSelector query param', async () => {
      const fetchApi = createMockFetchApi([]);
      const client = createClient(fetchApi);

      await client.listWorkflows('ns', 'app=my-service');

      expect(fetchApi.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/workflows/ns?labelSelector=app%3Dmy-service`,
      );
    });

    it('omits query string when no labelSelector', async () => {
      const fetchApi = createMockFetchApi([]);
      const client = createClient(fetchApi);

      await client.listWorkflows('ns');

      const calledUrl = fetchApi.fetch.mock.calls[0][0] as string;
      expect(calledUrl).not.toContain('?');
    });

    it('returns parsed WorkflowSummary array', async () => {
      const workflows = [
        {
          name: 'wf-1',
          namespace: 'ns',
          kind: 'Workflow',
          phase: 'Succeeded',
          startedAt: '2026-04-18T10:00:00Z',
          nodes: [],
        },
      ];
      const fetchApi = createMockFetchApi(workflows);
      const client = createClient(fetchApi);

      const result = await client.listWorkflows('ns');

      expect(result).toEqual(workflows);
    });

    it('encodes namespace in URL', async () => {
      const fetchApi = createMockFetchApi([]);
      const client = createClient(fetchApi);

      await client.listWorkflows('my namespace');

      expect(fetchApi.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/workflows/my%20namespace`,
      );
    });
  });

  describe('getWorkflow', () => {
    it('constructs correct URL with namespace and name', async () => {
      const fetchApi = createMockFetchApi({});
      const client = createClient(fetchApi);

      await client.getWorkflow('production', 'my-workflow');

      expect(fetchApi.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/workflows/production/my-workflow`,
      );
    });

    it('returns parsed WorkflowDetail', async () => {
      const detail = {
        name: 'wf-1',
        namespace: 'ns',
        phase: 'Succeeded',
        startedAt: '2026-04-18T10:00:00Z',
        nodes: [
          { id: 'n1', displayName: 'build', type: 'Pod', phase: 'Succeeded' },
        ],
      };
      const fetchApi = createMockFetchApi(detail);
      const client = createClient(fetchApi);

      const result = await client.getWorkflow('ns', 'wf-1');

      expect(result).toEqual(detail);
    });

    it('encodes name in URL', async () => {
      const fetchApi = createMockFetchApi({});
      const client = createClient(fetchApi);

      await client.getWorkflow('ns', 'my workflow');

      expect(fetchApi.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/workflows/ns/my%20workflow`,
      );
    });
  });

  describe('error handling', () => {
    it('throws ArgoWorkflowsError for ErrorResponse body', async () => {
      const errorBody = {
        error: { message: 'Access denied', code: 'FORBIDDEN', statusCode: 403 },
      };
      const fetchApi = createMockFetchApi(errorBody, false, 403);
      const client = createClient(fetchApi);

      await expect(client.listWorkflows('ns')).rejects.toThrow(
        ArgoWorkflowsError,
      );
      await expect(client.listWorkflows('ns')).rejects.toMatchObject({
        message: 'Access denied',
        code: 'FORBIDDEN',
        statusCode: 403,
      });
    });

    it('throws generic error for non-JSON error response', async () => {
      const fetchApi = {
        fetch: jest.fn().mockResolvedValue({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () => Promise.reject(new Error('not json')),
        }),
      };
      const client = createClient(fetchApi);

      await expect(client.listWorkflows('ns')).rejects.toMatchObject({
        message: 'Internal Server Error',
        code: 'UNKNOWN',
        statusCode: 500,
      });
    });

    it('uses discoveryApi to resolve base URL', async () => {
      const fetchApi = createMockFetchApi([]);
      const client = createClient(fetchApi);

      await client.listWorkflows('ns');

      expect(mockDiscoveryApi.getBaseUrl).toHaveBeenCalledWith(
        'argo-workflows',
      );
    });
  });

  describe('validation', () => {
    it('throws error for empty namespace in listWorkflows', async () => {
      const fetchApi = createMockFetchApi([]);
      const client = createClient(fetchApi);

      await expect(client.listWorkflows('')).rejects.toThrow(
        'namespace is required and cannot be empty',
      );
    });

    it('throws error for whitespace-only namespace in listWorkflows', async () => {
      const fetchApi = createMockFetchApi([]);
      const client = createClient(fetchApi);

      await expect(client.listWorkflows('   ')).rejects.toThrow(
        'namespace is required and cannot be empty',
      );
    });

    it('throws error for empty namespace in getWorkflow', async () => {
      const fetchApi = createMockFetchApi({});
      const client = createClient(fetchApi);

      await expect(client.getWorkflow('', 'name')).rejects.toThrow(
        'namespace is required and cannot be empty',
      );
    });

    it('throws error for empty name in getWorkflow', async () => {
      const fetchApi = createMockFetchApi({});
      const client = createClient(fetchApi);

      await expect(client.getWorkflow('ns', '')).rejects.toThrow(
        'name is required and cannot be empty',
      );
    });

    it('throws error for whitespace-only name in getWorkflow', async () => {
      const fetchApi = createMockFetchApi({});
      const client = createClient(fetchApi);

      await expect(client.getWorkflow('ns', '   ')).rejects.toThrow(
        'name is required and cannot be empty',
      );
    });

    it('omits query string when labelSelector is empty string', async () => {
      const fetchApi = createMockFetchApi([]);
      const client = createClient(fetchApi);

      await client.listWorkflows('ns', '');

      const calledUrl = fetchApi.fetch.mock.calls[0][0] as string;
      expect(calledUrl).not.toContain('?');
    });

    it('omits query string when labelSelector is whitespace only', async () => {
      const fetchApi = createMockFetchApi([]);
      const client = createClient(fetchApi);

      await client.listWorkflows('ns', '   ');

      const calledUrl = fetchApi.fetch.mock.calls[0][0] as string;
      expect(calledUrl).not.toContain('?');
    });
  });

  describe('JSON parse error handling', () => {
    it('throws error when response.json() fails on success response', async () => {
      const fetchApi = {
        fetch: jest.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.reject(new Error('Invalid JSON')),
        }),
      };
      const client = createClient(fetchApi);

      await expect(client.listWorkflows('ns')).rejects.toThrow(
        'Failed to parse response',
      );
    });
  });
});
