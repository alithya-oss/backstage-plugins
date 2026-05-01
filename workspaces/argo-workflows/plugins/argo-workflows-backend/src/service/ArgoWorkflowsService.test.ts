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

import { ConfigReader, type JsonObject } from '@backstage/config';
import {
  ArgoWorkflowsService,
  validateLabelSelector,
} from './ArgoWorkflowsService';

// Mock node-fetch
jest.mock('node-fetch', () => jest.fn());
import fetch from 'node-fetch';

const mockFetch = fetch as unknown as jest.Mock;

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockReturnThis(),
};

function createConfig(data: JsonObject) {
  return new ConfigReader(data);
}

describe('validateLabelSelector', () => {
  it('accepts simple equality selectors', () => {
    expect(validateLabelSelector('app=my-service')).toBeUndefined();
    expect(validateLabelSelector('app==my-service')).toBeUndefined();
    expect(validateLabelSelector('app!=my-service')).toBeUndefined();
  });

  it('accepts set-based selectors', () => {
    expect(validateLabelSelector('env in (prod,staging)')).toBeUndefined();
    expect(validateLabelSelector('env notin (dev,test)')).toBeUndefined();
  });

  it('accepts existence selectors', () => {
    expect(validateLabelSelector('app')).toBeUndefined();
    expect(validateLabelSelector('!app')).toBeUndefined();
  });

  it('accepts comma-separated selectors', () => {
    expect(validateLabelSelector('app=my-service,env=prod')).toBeUndefined();
    expect(
      validateLabelSelector('app=my-service,env in (prod,staging)'),
    ).toBeUndefined();
  });

  it('accepts selectors with DNS prefix keys', () => {
    expect(
      validateLabelSelector('app.kubernetes.io/name=my-service'),
    ).toBeUndefined();
  });

  it('rejects empty selectors', () => {
    expect(validateLabelSelector('')).toBeDefined();
    expect(validateLabelSelector('   ')).toBeDefined();
  });

  it('rejects invalid selectors', () => {
    expect(validateLabelSelector('=value')).toBeDefined();
    expect(validateLabelSelector('key=')).toBeDefined();
    expect(validateLabelSelector('key in ()')).toBeDefined();
  });
});

describe('ArgoWorkflowsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('logs a warning when no argoWorkflows config is present', () => {
      const config = createConfig({});
      const _service = new ArgoWorkflowsService(config, mockLogger);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Aucune configuration argoWorkflows'),
      );
    });

    it('logs a warning when no instances are configured', () => {
      const config = createConfig({
        argoWorkflows: { instances: [] },
      });
      const _service = new ArgoWorkflowsService(config, mockLogger);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Aucune instance Argo Workflows configurée'),
      );
    });

    it('reads instances from config', () => {
      const config = createConfig({
        argoWorkflows: {
          defaultInstance: 'main',
          instances: [
            {
              name: 'main',
              baseUrl: 'https://argo.example.com',
              token: 'test-token',
            },
          ],
        },
      });
      const service = new ArgoWorkflowsService(config, mockLogger);
      expect(mockLogger.warn).not.toHaveBeenCalled();
      expect(service).toBeDefined();
    });
  });

  describe('resolveInstance (via listWorkflows)', () => {
    it('throws 503 when no instances are configured', async () => {
      const config = createConfig({});
      const service = new ArgoWorkflowsService(config, mockLogger);

      await expect(service.listWorkflows('', 'app=test')).rejects.toThrow(
        'Aucune instance Argo Workflows configurée',
      );
    });

    it('throws 404 when instance name is unknown', async () => {
      const config = createConfig({
        argoWorkflows: {
          defaultInstance: 'main',
          instances: [
            {
              name: 'main',
              baseUrl: 'https://argo.example.com',
              token: 'test-token',
            },
          ],
        },
      });
      const service = new ArgoWorkflowsService(config, mockLogger);

      await expect(
        service.listWorkflows('unknown', 'app=test'),
      ).rejects.toThrow("Instance Argo Workflows 'unknown' non trouvée");
    });

    it('uses default instance when instanceName is empty', async () => {
      const config = createConfig({
        argoWorkflows: {
          defaultInstance: 'main',
          instances: [
            {
              name: 'main',
              baseUrl: 'https://argo.example.com',
              token: 'test-token',
            },
          ],
        },
      });
      const service = new ArgoWorkflowsService(config, mockLogger);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      });

      const result = await service.listWorkflows('', 'app=test');
      expect(result).toEqual([]);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://argo.example.com'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      );
    });

    it('uses the specified instance when instanceName is provided', async () => {
      const config = createConfig({
        argoWorkflows: {
          defaultInstance: 'main',
          instances: [
            {
              name: 'main',
              baseUrl: 'https://argo.example.com',
              token: 'main-token',
            },
            {
              name: 'staging',
              baseUrl: 'https://argo-staging.example.com',
              token: 'staging-token',
            },
          ],
        },
      });
      const service = new ArgoWorkflowsService(config, mockLogger);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      });

      await service.listWorkflows('staging', 'app=test');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://argo-staging.example.com'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer staging-token',
          }),
        }),
      );
    });
  });

  describe('listWorkflows', () => {
    const config = createConfig({
      argoWorkflows: {
        defaultInstance: 'main',
        instances: [
          {
            name: 'main',
            baseUrl: 'https://argo.example.com',
            token: 'test-token',
          },
        ],
      },
    });

    it('rejects invalid label selectors with 400', async () => {
      const service = new ArgoWorkflowsService(config, mockLogger);

      await expect(service.listWorkflows('main', '')).rejects.toThrow(
        'Sélecteur de labels invalide',
      );
    });

    it('calls the Argo API with the correct URL and parses results', async () => {
      const service = new ArgoWorkflowsService(config, mockLogger);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              metadata: {
                name: 'wf-1',
                namespace: 'default',
                uid: 'uid-1',
                creationTimestamp: '2024-01-01T00:00:00Z',
              },
              status: { phase: 'Succeeded' },
            },
          ],
        }),
      });

      const result = await service.listWorkflows('main', 'app=test');
      expect(result).toHaveLength(1);
      expect(result[0].metadata.name).toBe('wf-1');
      expect(result[0].status.phase).toBe('Succeeded');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://argo.example.com/api/v1/workflows?listOptions.labelSelector=app%3Dtest',
        expect.any(Object),
      );
    });

    it('returns empty array when items is null/undefined', async () => {
      const service = new ArgoWorkflowsService(config, mockLogger);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const result = await service.listWorkflows('main', 'app=test');
      expect(result).toEqual([]);
    });

    it('throws 502 when Argo server is unreachable', async () => {
      const service = new ArgoWorkflowsService(config, mockLogger);

      mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      await expect(service.listWorkflows('main', 'app=test')).rejects.toThrow(
        'Le serveur Argo Workflows est indisponible',
      );
    });

    it('propagates HTTP error codes from Argo server', async () => {
      const service = new ArgoWorkflowsService(config, mockLogger);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      await expect(service.listWorkflows('main', 'app=test')).rejects.toThrow(
        'Erreur du serveur Argo Workflows (HTTP 403)',
      );
    });
  });

  describe('getWorkflow', () => {
    const config = createConfig({
      argoWorkflows: {
        defaultInstance: 'main',
        instances: [
          {
            name: 'main',
            baseUrl: 'https://argo.example.com',
            token: 'test-token',
          },
        ],
      },
    });

    it('calls the Argo API with the correct URL and parses the result', async () => {
      const service = new ArgoWorkflowsService(config, mockLogger);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          metadata: {
            name: 'wf-1',
            namespace: 'default',
            uid: 'uid-1',
            creationTimestamp: '2024-01-01T00:00:00Z',
          },
          status: { phase: 'Running' },
        }),
      });

      const result = await service.getWorkflow('main', 'default', 'wf-1');
      expect(result.metadata.name).toBe('wf-1');
      expect(result.status.phase).toBe('Running');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://argo.example.com/api/v1/workflows/default/wf-1',
        expect.any(Object),
      );
    });

    it('throws 502 when Argo server is unreachable', async () => {
      const service = new ArgoWorkflowsService(config, mockLogger);

      mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      await expect(
        service.getWorkflow('main', 'default', 'wf-1'),
      ).rejects.toThrow('Le serveur Argo Workflows est indisponible');
    });

    it('propagates HTTP error codes from Argo server', async () => {
      const service = new ArgoWorkflowsService(config, mockLogger);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(
        service.getWorkflow('main', 'default', 'wf-1'),
      ).rejects.toThrow('Erreur du serveur Argo Workflows (HTTP 404)');
    });

    it('throws 503 when no instances are configured', async () => {
      const emptyConfig = createConfig({});
      const service = new ArgoWorkflowsService(emptyConfig, mockLogger);

      await expect(service.getWorkflow('', 'default', 'wf-1')).rejects.toThrow(
        'Aucune instance Argo Workflows configurée',
      );
    });
  });
});
