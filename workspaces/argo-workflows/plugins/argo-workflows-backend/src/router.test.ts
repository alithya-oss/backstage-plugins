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

import express from 'express';
import request from 'supertest';
import { ConfigReader } from '@backstage/config';
import { createRouter } from './router';

// Mock the ArgoWorkflowsService
jest.mock('./service', () => {
  const mockListWorkflows = jest.fn();
  const mockGetWorkflow = jest.fn();
  return {
    ArgoWorkflowsService: jest.fn().mockImplementation(() => ({
      listWorkflows: mockListWorkflows,
      getWorkflow: mockGetWorkflow,
    })),
    __mockListWorkflows: mockListWorkflows,
    __mockGetWorkflow: mockGetWorkflow,
  };
});

const {
  __mockListWorkflows: mockListWorkflows,
  __mockGetWorkflow: mockGetWorkflow,
} = jest.requireMock('./service');

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockReturnThis(),
};

const mockHttpAuth = {
  credentials: jest.fn(),
  issueUserCookie: jest.fn(),
};

const mockPermissions = {
  authorize: jest.fn().mockResolvedValue([{ result: 'ALLOW' }]),
};

const config = new ConfigReader({});

async function createApp() {
  const router = await createRouter({
    logger: mockLogger as any,
    config,
    httpAuth: mockHttpAuth as any,
    permissions: mockPermissions as any,
  });
  const app = express();
  app.use(router);
  return app;
}

describe('createRouter', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /health', () => {
    it('returns HTTP 200', async () => {
      const app = await createApp();
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
    });

    it('returns { status: "ok" } JSON body', async () => {
      const app = await createApp();
      const res = await request(app).get('/health');
      expect(res.body).toEqual({ status: 'ok' });
    });
  });

  describe('GET /workflows/:namespace', () => {
    it('returns 403 when permission is denied', async () => {
      mockPermissions.authorize.mockResolvedValueOnce([{ result: 'DENY' }]);
      const app = await createApp();
      const res = await request(app).get('/workflows/production');
      expect(res.status).toBe(403);
    });

    it('returns 200 with WorkflowSummary array', async () => {
      const workflows = [
        {
          name: 'wf-1',
          namespace: 'production',
          kind: 'CronWorkflow',
          phase: 'Succeeded',
          startedAt: '2026-04-18T10:00:00Z',
          nodes: [],
        },
      ];
      mockListWorkflows.mockResolvedValue(workflows);
      const app = await createApp();

      const res = await request(app).get('/workflows/production');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(workflows);
    });

    it('passes labelSelector to service', async () => {
      mockListWorkflows.mockResolvedValue([]);
      const app = await createApp();

      await request(app).get(
        '/workflows/production?labelSelector=app%3Dmy-service',
      );

      expect(mockListWorkflows).toHaveBeenCalledWith('production', {
        labelSelector: 'app=my-service',
        limit: 20,
        offset: 0,
      });
    });

    it('passes limit and offset to service', async () => {
      mockListWorkflows.mockResolvedValue([]);
      const app = await createApp();

      await request(app).get('/workflows/ns?limit=10&offset=5');

      expect(mockListWorkflows).toHaveBeenCalledWith('ns', {
        labelSelector: undefined,
        limit: 10,
        offset: 5,
      });
    });

    it('uses default limit=20 and offset=0', async () => {
      mockListWorkflows.mockResolvedValue([]);
      const app = await createApp();

      await request(app).get('/workflows/ns');

      expect(mockListWorkflows).toHaveBeenCalledWith('ns', {
        labelSelector: undefined,
        limit: 20,
        offset: 0,
      });
    });

    it('returns ErrorResponse for service errors', async () => {
      const err = new Error('Access denied') as any;
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      mockListWorkflows.mockRejectedValue(err);
      const app = await createApp();

      const res = await request(app).get('/workflows/production');

      expect(res.status).toBe(403);
      expect(res.body).toEqual({
        error: {
          message: 'Access denied',
          code: 'FORBIDDEN',
          statusCode: 403,
        },
      });
    });

    it('returns 500 for unexpected errors', async () => {
      mockListWorkflows.mockRejectedValue(new Error('unexpected'));
      const app = await createApp();

      const res = await request(app).get('/workflows/ns');

      expect(res.status).toBe(500);
      expect(res.body.error.code).toBe('INTERNAL_ERROR');
    });

    it('clamps negative limit to 1', async () => {
      mockListWorkflows.mockResolvedValue([]);
      const app = await createApp();

      await request(app).get('/workflows/ns?limit=-5');

      expect(mockListWorkflows).toHaveBeenCalledWith('ns', {
        labelSelector: undefined,
        limit: 1,
        offset: 0,
      });
    });

    it('clamps limit over 100 to 100', async () => {
      mockListWorkflows.mockResolvedValue([]);
      const app = await createApp();

      await request(app).get('/workflows/ns?limit=500');

      expect(mockListWorkflows).toHaveBeenCalledWith('ns', {
        labelSelector: undefined,
        limit: 100,
        offset: 0,
      });
    });

    it('clamps negative offset to 0', async () => {
      mockListWorkflows.mockResolvedValue([]);
      const app = await createApp();

      await request(app).get('/workflows/ns?offset=-10');

      expect(mockListWorkflows).toHaveBeenCalledWith('ns', {
        labelSelector: undefined,
        limit: 20,
        offset: 0,
      });
    });
  });

  describe('GET /workflows/:namespace/:name', () => {
    it('returns 200 with WorkflowDetail object', async () => {
      const detail = {
        name: 'pipeline-abc',
        namespace: 'production',
        phase: 'Succeeded',
        startedAt: '2026-04-18T14:00:00Z',
        finishedAt: '2026-04-18T14:05:00Z',
        duration: 300,
        nodes: [
          {
            id: 'root',
            displayName: 'pipeline-abc',
            type: 'DAG',
            phase: 'Succeeded',
          },
          {
            id: 'build-1',
            displayName: 'build',
            type: 'Pod',
            phase: 'Succeeded',
          },
        ],
      };
      mockGetWorkflow.mockResolvedValue(detail);
      const app = await createApp();

      const res = await request(app).get('/workflows/production/pipeline-abc');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(detail);
    });

    it('passes namespace and name params to service', async () => {
      mockGetWorkflow.mockResolvedValue({ name: 'wf', nodes: [] });
      const app = await createApp();

      await request(app).get('/workflows/my-namespace/my-workflow');

      expect(mockGetWorkflow).toHaveBeenCalledWith(
        'my-namespace',
        'my-workflow',
      );
    });

    it('returns ErrorResponse for service errors', async () => {
      const err = new Error('Access denied') as any;
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      mockGetWorkflow.mockRejectedValue(err);
      const app = await createApp();

      const res = await request(app).get('/workflows/production/wf');

      expect(res.status).toBe(403);
      expect(res.body).toEqual({
        error: {
          message: 'Access denied',
          code: 'FORBIDDEN',
          statusCode: 403,
        },
      });
    });

    it('returns 500 for unexpected errors', async () => {
      mockGetWorkflow.mockRejectedValue(new Error('unexpected'));
      const app = await createApp();

      const res = await request(app).get('/workflows/ns/wf');

      expect(res.status).toBe(500);
      expect(res.body.error.code).toBe('INTERNAL_ERROR');
    });
  });
});
