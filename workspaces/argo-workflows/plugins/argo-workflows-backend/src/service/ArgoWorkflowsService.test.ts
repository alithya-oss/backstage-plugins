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

import { ConfigReader } from '@backstage/config';
import { ArgoWorkflowsService } from './ArgoWorkflowsService';
import type { ServiceError } from './ArgoWorkflowsService';

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockReturnThis(),
};

const config = new ConfigReader({
  kubernetes: {
    clusterLocatorMethods: [
      {
        type: 'config',
        clusters: [
          {
            url: 'https://k8s.example.com',
            name: 'test',
            serviceAccountToken: 'test-token',
          },
        ],
      },
    ],
  },
});

const k8sListResponse = {
  apiVersion: 'argoproj.io/v1alpha1',
  kind: 'WorkflowList',
  items: [
    {
      metadata: { name: 'wf-1', namespace: 'production', labels: { app: 'svc' } },
      status: {
        phase: 'Succeeded',
        startedAt: '2026-04-18T10:00:00Z',
        finishedAt: '2026-04-18T10:05:00Z',
        nodes: {
          n1: { displayName: 'build', type: 'Pod', phase: 'Succeeded' },
        },
      },
    },
    {
      metadata: { name: 'wf-2', namespace: 'production' },
      status: { phase: 'Running', startedAt: '2026-04-18T11:00:00Z' },
    },
  ],
};

function createMockFetch(body: any, status = 200): jest.Mock {
  return jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

function createService(fetchFn: jest.Mock) {
  return new ArgoWorkflowsService({
    logger: mockLogger as any,
    config,
    fetchFn: fetchFn as any,
  });
}

describe('ArgoWorkflowsService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('listWorkflows', () => {
    it('fetches and transforms workflows successfully', async () => {
      const mockFetch = createMockFetch(k8sListResponse);
      const service = createService(mockFetch);

      const result = await service.listWorkflows('production');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('wf-1');
      expect(result[0].phase).toBe('Succeeded');
      expect(result[0].nodes).toEqual([
        { displayName: 'build', phase: 'Succeeded' },
      ]);
      expect(result[1].name).toBe('wf-2');
      expect(result[1].phase).toBe('Running');
    });

    it('passes labelSelector query parameter', async () => {
      const mockFetch = createMockFetch({ items: [] });
      const service = createService(mockFetch);

      await service.listWorkflows('ns', { labelSelector: 'app=my-svc' });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('labelSelector=app%3Dmy-svc');
    });

    it('passes limit parameter', async () => {
      const mockFetch = createMockFetch({ items: [] });
      const service = createService(mockFetch);

      await service.listWorkflows('ns', { limit: 10, offset: 0 });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('limit=10');
    });

    it('applies offset-based pagination', async () => {
      const items = Array.from({ length: 5 }, (_, i) => ({
        metadata: { name: `wf-${i}`, namespace: 'ns' },
        status: { phase: 'Succeeded', startedAt: '2026-04-18T10:00:00Z' },
      }));
      const mockFetch = createMockFetch({ items });
      const service = createService(mockFetch);

      const result = await service.listWorkflows('ns', {
        limit: 2,
        offset: 2,
      });

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('wf-2');
      expect(result[1].name).toBe('wf-3');
    });

    it('includes Authorization header with token', async () => {
      const mockFetch = createMockFetch({ items: [] });
      const service = createService(mockFetch);

      await service.listWorkflows('ns');

      const calledOptions = mockFetch.mock.calls[0][1];
      expect(calledOptions.headers.Authorization).toBe('Bearer test-token');
    });

    it('constructs correct K8s API URL', async () => {
      const mockFetch = createMockFetch({ items: [] });
      const service = createService(mockFetch);

      await service.listWorkflows('my-namespace');

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain(
        'https://k8s.example.com/apis/argoproj.io/v1alpha1/namespaces/my-namespace/workflows',
      );
    });

    it('returns empty array for empty list', async () => {
      const mockFetch = createMockFetch({ items: [] });
      const service = createService(mockFetch);

      const result = await service.listWorkflows('ns');
      expect(result).toEqual([]);
    });

    it('throws 403 for K8s forbidden error', async () => {
      const mockFetch = createMockFetch({ message: 'forbidden' }, 403);
      const service = createService(mockFetch);

      await expect(service.listWorkflows('production')).rejects.toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN',
        message: expect.stringContaining('Access denied'),
      });
    });

    it('throws 404 for K8s not found error', async () => {
      const mockFetch = createMockFetch({ message: 'not found' }, 404);
      const service = createService(mockFetch);

      await expect(service.listWorkflows('bad-ns')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
        message: expect.stringContaining("'bad-ns'"),
      });
    });

    it('throws 502 for K8s 500 error', async () => {
      const mockFetch = createMockFetch({ message: 'internal' }, 500);
      const service = createService(mockFetch);

      await expect(service.listWorkflows('ns')).rejects.toMatchObject({
        statusCode: 502,
        code: 'BAD_GATEWAY',
      });
    });

    it('throws 504 for timeout', async () => {
      const timeoutErr = new Error('timeout');
      timeoutErr.name = 'TimeoutError';
      const mockFetch = jest.fn().mockRejectedValue(timeoutErr);
      const service = createService(mockFetch);

      await expect(service.listWorkflows('ns')).rejects.toMatchObject({
        statusCode: 504,
        code: 'GATEWAY_TIMEOUT',
        message: expect.stringContaining('timed out'),
      });
    });

    it('throws 502 for network error', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
      const service = createService(mockFetch);

      await expect(service.listWorkflows('ns')).rejects.toMatchObject({
        statusCode: 502,
        code: 'BAD_GATEWAY',
      });
    });

    it('throws 502 for non-JSON response', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });
      const service = createService(mockFetch);

      await expect(service.listWorkflows('ns')).rejects.toMatchObject({
        statusCode: 502,
        code: 'BAD_GATEWAY',
        message: expect.stringContaining('Invalid response'),
      });
    });
  });
});
