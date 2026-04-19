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

import { renderHook, waitFor } from '@testing-library/react';
import { useApi } from '@backstage/core-plugin-api';
import type { Entity } from '@backstage/catalog-model';
import type { WorkflowSummary } from '@backstage-community/plugin-argo-workflows-common';
import { useArgoWorkflows } from './useArgoWorkflows';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

const mockUseApi = useApi as jest.MockedFunction<typeof useApi>;

function createMockEntity(
  annotations: Record<string, string> = {},
): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'test-service',
      annotations,
    },
  };
}

const mockWorkflows: WorkflowSummary[] = [
  {
    name: 'wf-1',
    namespace: 'production',
    phase: 'Succeeded',
    startedAt: '2026-04-18T10:00:00Z',
    nodes: [],
  },
];

function createMockApi(result: WorkflowSummary[] = mockWorkflows) {
  return {
    listWorkflows: jest.fn().mockResolvedValue(result),
    getWorkflow: jest.fn(),
  };
}

describe('useArgoWorkflows', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('calls listWorkflows with namespace from entity annotation', async () => {
    const mockApi = createMockApi();
    mockUseApi.mockReturnValue(mockApi as any);

    const entity = createMockEntity({
      'backstage.io/kubernetes-namespace': 'production',
    });

    const { result } = renderHook(() => useArgoWorkflows(entity));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockApi.listWorkflows).toHaveBeenCalledWith(
      'production',
      undefined,
    );
    expect(result.current.workflows).toEqual(mockWorkflows);
  });

  it('passes labelSelector from entity annotation', async () => {
    const mockApi = createMockApi();
    mockUseApi.mockReturnValue(mockApi as any);

    const entity = createMockEntity({
      'backstage.io/kubernetes-namespace': 'staging',
      'backstage.io/kubernetes-label-selector': 'app=my-service',
    });

    const { result } = renderHook(() => useArgoWorkflows(entity));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockApi.listWorkflows).toHaveBeenCalledWith(
      'staging',
      'app=my-service',
    );
  });

  it('returns error when namespace annotation is missing', () => {
    const mockApi = createMockApi();
    mockUseApi.mockReturnValue(mockApi as any);

    const entity = createMockEntity({});

    const { result } = renderHook(() => useArgoWorkflows(entity));

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain(
      'backstage.io/kubernetes-namespace',
    );
    expect(result.current.workflows).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(mockApi.listWorkflows).not.toHaveBeenCalled();
  });

  it('returns workflows array from API response', async () => {
    const mockApi = createMockApi(mockWorkflows);
    mockUseApi.mockReturnValue(mockApi as any);

    const entity = createMockEntity({
      'backstage.io/kubernetes-namespace': 'ns',
    });

    const { result } = renderHook(() => useArgoWorkflows(entity));

    await waitFor(() => {
      expect(result.current.workflows).toEqual(mockWorkflows);
    });

    expect(result.current.workflows).toHaveLength(1);
    expect(result.current.workflows[0].name).toBe('wf-1');
  });

  it('returns loading true during initial fetch', () => {
    const mockApi = createMockApi();
    mockUseApi.mockReturnValue(mockApi as any);

    const entity = createMockEntity({
      'backstage.io/kubernetes-namespace': 'ns',
    });

    const { result } = renderHook(() => useArgoWorkflows(entity));

    expect(result.current.loading).toBe(true);
  });

  it('returns error when API call fails', async () => {
    const mockApi = {
      listWorkflows: jest.fn().mockRejectedValue(new Error('API failure')),
      getWorkflow: jest.fn(),
    };
    mockUseApi.mockReturnValue(mockApi as any);

    const entity = createMockEntity({
      'backstage.io/kubernetes-namespace': 'ns',
    });

    const { result } = renderHook(() => useArgoWorkflows(entity));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error?.message).toBe('API failure');
    expect(result.current.workflows).toEqual([]);
  });

  it('returns empty array when API returns empty list', async () => {
    const mockApi = createMockApi([]);
    mockUseApi.mockReturnValue(mockApi as any);

    const entity = createMockEntity({
      'backstage.io/kubernetes-namespace': 'ns',
    });

    const { result } = renderHook(() => useArgoWorkflows(entity));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.workflows).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('treats empty string namespace as missing', () => {
    const mockApi = createMockApi();
    mockUseApi.mockReturnValue(mockApi as any);

    const entity = createMockEntity({
      'backstage.io/kubernetes-namespace': '',
    });

    const { result } = renderHook(() => useArgoWorkflows(entity));

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain(
      'backstage.io/kubernetes-namespace',
    );
    expect(mockApi.listWorkflows).not.toHaveBeenCalled();
  });

  it('treats whitespace-only namespace as missing', () => {
    const mockApi = createMockApi();
    mockUseApi.mockReturnValue(mockApi as any);

    const entity = createMockEntity({
      'backstage.io/kubernetes-namespace': '   ',
    });

    const { result } = renderHook(() => useArgoWorkflows(entity));

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain(
      'backstage.io/kubernetes-namespace',
    );
    expect(mockApi.listWorkflows).not.toHaveBeenCalled();
  });

  it('trims namespace and labelSelector values', async () => {
    const mockApi = createMockApi();
    mockUseApi.mockReturnValue(mockApi as any);

    const entity = createMockEntity({
      'backstage.io/kubernetes-namespace': '  production  ',
      'backstage.io/kubernetes-label-selector': '  app=my-service  ',
    });

    const { result } = renderHook(() => useArgoWorkflows(entity));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockApi.listWorkflows).toHaveBeenCalledWith(
      'production',
      'app=my-service',
    );
  });

  it('skips empty labelSelector but still fetches with valid namespace', async () => {
    const mockApi = createMockApi();
    mockUseApi.mockReturnValue(mockApi as any);

    const entity = createMockEntity({
      'backstage.io/kubernetes-namespace': 'production',
      'backstage.io/kubernetes-label-selector': '',
    });

    const { result } = renderHook(() => useArgoWorkflows(entity));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockApi.listWorkflows).toHaveBeenCalledWith(
      'production',
      undefined,
    );
  });

  it('exposes lastUpdated from usePolling after successful fetch', async () => {
    const mockApi = createMockApi();
    mockUseApi.mockReturnValue(mockApi as any);

    const entity = createMockEntity({
      'backstage.io/kubernetes-namespace': 'production',
    });

    const { result } = renderHook(() => useArgoWorkflows(entity));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.lastUpdated).toBeInstanceOf(Date);
  });

  it('returns lastUpdated as null when namespace is missing', () => {
    const mockApi = createMockApi();
    mockUseApi.mockReturnValue(mockApi as any);

    const entity = createMockEntity({});

    const { result } = renderHook(() => useArgoWorkflows(entity));

    expect(result.current.lastUpdated).toBeNull();
  });
});
