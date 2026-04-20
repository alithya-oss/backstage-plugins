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

import { renderHook, waitFor, act } from '@testing-library/react';
import { useApi } from '@backstage/core-plugin-api';
import type {
  WorkflowDetail,
  WorkflowPhase,
} from '@alithya-oss/backstage-plugin-argo-workflows-common';
import { useWorkflowDetail } from './useWorkflowDetail';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

const mockUseApi = useApi as jest.MockedFunction<typeof useApi>;

function createMockWorkflowDetail(
  phase: WorkflowPhase = 'Succeeded',
): WorkflowDetail {
  return {
    name: 'my-workflow',
    namespace: 'production',
    phase,
    startedAt: '2026-04-18T10:00:00Z',
    finishedAt: phase === 'Running' ? undefined : '2026-04-18T10:05:00Z',
    duration: phase === 'Running' ? undefined : 300,
    nodes: [
      {
        id: 'node-1',
        displayName: 'build',
        type: 'Pod',
        phase: 'Succeeded',
      },
    ],
  };
}

function createMockApi(result: WorkflowDetail = createMockWorkflowDetail()) {
  return {
    listWorkflows: jest.fn(),
    getWorkflow: jest.fn().mockResolvedValue(result),
  };
}

describe('useWorkflowDetail', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('calls getWorkflow with namespace and name', async () => {
    const mockApi = createMockApi();
    mockUseApi.mockReturnValue(mockApi as any);

    const { result } = renderHook(() =>
      useWorkflowDetail('production', 'my-workflow'),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockApi.getWorkflow).toHaveBeenCalledWith(
      'production',
      'my-workflow',
    );
  });

  it('returns workflow data from API response', async () => {
    const detail = createMockWorkflowDetail('Succeeded');
    const mockApi = createMockApi(detail);
    mockUseApi.mockReturnValue(mockApi as any);

    const { result } = renderHook(() =>
      useWorkflowDetail('production', 'my-workflow'),
    );

    await waitFor(() => {
      expect(result.current.workflow).not.toBeNull();
    });

    expect(result.current.workflow?.name).toBe('my-workflow');
    expect(result.current.workflow?.phase).toBe('Succeeded');
    expect(result.current.workflow?.nodes).toHaveLength(1);
  });

  it('returns loading true during initial fetch', () => {
    const mockApi = createMockApi();
    mockUseApi.mockReturnValue(mockApi as any);

    const { result } = renderHook(() =>
      useWorkflowDetail('production', 'my-workflow'),
    );

    expect(result.current.loading).toBe(true);
  });

  it('returns loading false after fetch completes', async () => {
    const mockApi = createMockApi();
    mockUseApi.mockReturnValue(mockApi as any);

    const { result } = renderHook(() =>
      useWorkflowDetail('production', 'my-workflow'),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.loading).toBe(false);
  });

  it('returns error when API call fails', async () => {
    const mockApi = {
      listWorkflows: jest.fn(),
      getWorkflow: jest.fn().mockRejectedValue(new Error('Network error')),
    };
    mockUseApi.mockReturnValue(mockApi as any);

    const { result } = renderHook(() =>
      useWorkflowDetail('production', 'my-workflow'),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error?.message).toBe('Network error');
  });

  it('returns workflow as null before API responds', () => {
    const mockApi = {
      listWorkflows: jest.fn(),
      getWorkflow: jest.fn().mockReturnValue(new Promise(() => {})),
    };
    mockUseApi.mockReturnValue(mockApi as any);

    const { result } = renderHook(() =>
      useWorkflowDetail('production', 'my-workflow'),
    );

    expect(result.current.workflow).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('polling stops when workflow phase is Succeeded', async () => {
    const detail = createMockWorkflowDetail('Succeeded');
    const mockApi = createMockApi(detail);
    mockUseApi.mockReturnValue(mockApi as any);

    const { result } = renderHook(() =>
      useWorkflowDetail('production', 'my-workflow'),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Initial fetch = 1 call. Advance past polling interval.
    const callCountAfterInit = mockApi.getWorkflow.mock.calls.length;

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    // No additional calls — polling stopped
    expect(mockApi.getWorkflow).toHaveBeenCalledTimes(callCountAfterInit);
  });

  it('polling stops when workflow phase is Failed', async () => {
    const detail = createMockWorkflowDetail('Failed');
    const mockApi = createMockApi(detail);
    mockUseApi.mockReturnValue(mockApi as any);

    const { result } = renderHook(() =>
      useWorkflowDetail('production', 'my-workflow'),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const callCountAfterInit = mockApi.getWorkflow.mock.calls.length;

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(mockApi.getWorkflow).toHaveBeenCalledTimes(callCountAfterInit);
  });

  it('polling stops when workflow phase is Error', async () => {
    const detail = createMockWorkflowDetail('Error');
    const mockApi = createMockApi(detail);
    mockUseApi.mockReturnValue(mockApi as any);

    const { result } = renderHook(() =>
      useWorkflowDetail('production', 'my-workflow'),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const callCountAfterInit = mockApi.getWorkflow.mock.calls.length;

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(mockApi.getWorkflow).toHaveBeenCalledTimes(callCountAfterInit);
  });

  it('polling continues when workflow phase is Running', async () => {
    const detail = createMockWorkflowDetail('Running');
    const mockApi = createMockApi(detail);
    mockUseApi.mockReturnValue(mockApi as any);

    const { result } = renderHook(() =>
      useWorkflowDetail('production', 'my-workflow'),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const callCountAfterInit = mockApi.getWorkflow.mock.calls.length;

    // Advance past one polling interval (5s)
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Should have at least one more call from polling
    expect(mockApi.getWorkflow.mock.calls.length).toBeGreaterThan(
      callCountAfterInit,
    );
  });

  it('polling continues when workflow phase is Pending', async () => {
    const detail = createMockWorkflowDetail('Pending');
    const mockApi = createMockApi(detail);
    mockUseApi.mockReturnValue(mockApi as any);

    const { result } = renderHook(() =>
      useWorkflowDetail('production', 'my-workflow'),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const callCountAfterInit = mockApi.getWorkflow.mock.calls.length;

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(mockApi.getWorkflow.mock.calls.length).toBeGreaterThan(
      callCountAfterInit,
    );
  });
});
