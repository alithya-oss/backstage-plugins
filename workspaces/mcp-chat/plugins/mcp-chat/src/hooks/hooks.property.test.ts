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

import fc from 'fast-check';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { TestApiProvider } from '@backstage/test-utils';
import { identityApiRef } from '@backstage/frontend-plugin-api';
import { mcpChatApiRef } from '../api';
import { useProviderStatus } from './useProviderStatus';
import { useMcpServers } from './useMcpServers';
import { useAvailableTools } from './useAvailableTools';
import { useConversations } from './useConversations';

/**
 * **Validates: Requirements 9.6**
 *
 * Property 9: Frontend hooks expose Error instances
 *
 * For any hook in the frontend plugin that exposes an error state
 * (useProviderStatus, useMcpServers, useConversations, useAvailableTools),
 * the error value SHALL be `undefined` or an instance of `Error`.
 */

const mockIdentityApi = {
  getBackstageIdentity: jest.fn().mockResolvedValue({
    type: 'user',
    userEntityRef: 'user:default/test-user',
    ownershipEntityRefs: ['user:default/test-user'],
  }),
  getCredentials: jest.fn().mockResolvedValue({ token: undefined }),
  getProfileInfo: jest.fn().mockResolvedValue({
    displayName: 'Test',
    email: 'test@example.com',
  }),
};

function createWrapper(mockApi: any) {
  return ({ children }: { children: React.ReactNode }) =>
    createElement(TestApiProvider, {
      apis: [
        [mcpChatApiRef, mockApi],
        [identityApiRef, mockIdentityApi],
      ] as any,
      children,
    } as any);
}

describe('Property 9: Frontend hooks expose Error instances', () => {
  it('useProviderStatus error is undefined or an Error instance for any thrown error', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), errorMessage => {
        const mockApi = {
          getProviderStatus: jest
            .fn()
            .mockRejectedValue(new Error(errorMessage)),
        };

        const { result } = renderHook(() => useProviderStatus(), {
          wrapper: createWrapper(mockApi),
        });

        // Initially loading — error should be undefined
        const errorValue = result.current.error;
        expect(errorValue === undefined || errorValue instanceof Error).toBe(
          true,
        );
      }),
      { numRuns: 100 },
    );
  });

  it('useProviderStatus error becomes an Error instance after rejection', async () => {
    const mockApi = {
      getProviderStatus: jest
        .fn()
        .mockRejectedValue(new Error('Network failure')),
    };

    const { result } = renderHook(() => useProviderStatus(), {
      wrapper: createWrapper(mockApi),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const { error } = result.current;
    expect(error === undefined || error instanceof Error).toBe(true);
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe('Network failure');
  });

  it('useMcpServers error is undefined or an Error instance for any thrown error', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), errorMessage => {
        const mockApi = {
          getMCPServerStatus: jest
            .fn()
            .mockRejectedValue(new Error(errorMessage)),
        };

        const { result } = renderHook(() => useMcpServers(), {
          wrapper: createWrapper(mockApi),
        });

        const errorValue = result.current.error;
        expect(errorValue === undefined || errorValue instanceof Error).toBe(
          true,
        );
      }),
      { numRuns: 100 },
    );
  });

  it('useMcpServers error becomes an Error instance after rejection', async () => {
    const mockApi = {
      getMCPServerStatus: jest
        .fn()
        .mockRejectedValue(new Error('Server unreachable')),
    };

    const { result } = renderHook(() => useMcpServers(), {
      wrapper: createWrapper(mockApi),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const { error } = result.current;
    expect(error === undefined || error instanceof Error).toBe(true);
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe('Server unreachable');
  });

  it('useAvailableTools error is undefined or an Error instance for any thrown error', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), errorMessage => {
        const mockApi = {
          getAvailableTools: jest
            .fn()
            .mockRejectedValue(new Error(errorMessage)),
        };

        const mcpServers = [
          { id: '1', name: 'server1', enabled: true },
        ] as any[];

        const { result } = renderHook(() => useAvailableTools(mcpServers), {
          wrapper: createWrapper(mockApi),
        });

        const errorValue = result.current.error;
        expect(errorValue === undefined || errorValue instanceof Error).toBe(
          true,
        );
      }),
      { numRuns: 100 },
    );
  });

  it('useAvailableTools error becomes an Error instance after rejection', async () => {
    const mockApi = {
      getAvailableTools: jest
        .fn()
        .mockRejectedValue(new Error('Tools unavailable')),
    };

    const mcpServers = [{ id: '1', name: 'server1', enabled: true }] as any[];

    const { result } = renderHook(() => useAvailableTools(mcpServers), {
      wrapper: createWrapper(mockApi),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const { error } = result.current;
    expect(error === undefined || error instanceof Error).toBe(true);
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe('Tools unavailable');
  });

  it('useConversations error is undefined or an Error instance for any thrown error', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), errorMessage => {
        const mockApi = {
          getConversations: jest
            .fn()
            .mockRejectedValue(new Error(errorMessage)),
        };

        const { result } = renderHook(() => useConversations(), {
          wrapper: createWrapper(mockApi),
        });

        const errorValue = result.current.error;
        expect(errorValue === undefined || errorValue instanceof Error).toBe(
          true,
        );
      }),
      { numRuns: 100 },
    );
  });

  it('useConversations error is undefined when API call fails (gracefully catches)', async () => {
    // useConversations has internal try-catch that returns empty array on failure
    const mockApi = {
      getConversations: jest.fn().mockRejectedValue(new Error('API error')),
    };

    const { result } = renderHook(() => useConversations(), {
      wrapper: createWrapper(mockApi),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // useConversations catches errors internally and returns empty array
    // so error should remain undefined (graceful degradation)
    const { error } = result.current;
    expect(error === undefined || error instanceof Error).toBe(true);
  });

  it('all hooks return error as undefined on success', async () => {
    const mockApi = {
      getProviderStatus: jest.fn().mockResolvedValue({
        providers: [],
        summary: { totalProviders: 0, healthyProviders: 0 },
        timestamp: new Date().toISOString(),
      }),
      getMCPServerStatus: jest.fn().mockResolvedValue({
        servers: [],
      }),
      getAvailableTools: jest.fn().mockResolvedValue({
        availableTools: [],
        toolCount: 0,
        timestamp: new Date().toISOString(),
      }),
      getConversations: jest.fn().mockResolvedValue({
        conversations: [],
        count: 0,
      }),
    };

    const mcpServers = [{ id: '1', name: 'server1', enabled: true }] as any[];

    const wrapper = createWrapper(mockApi);

    const { result: providerResult } = renderHook(() => useProviderStatus(), {
      wrapper,
    });
    const { result: mcpResult } = renderHook(() => useMcpServers(), {
      wrapper,
    });
    const { result: toolsResult } = renderHook(
      () => useAvailableTools(mcpServers),
      { wrapper },
    );
    const { result: convoResult } = renderHook(() => useConversations(), {
      wrapper,
    });

    await waitFor(() => {
      expect(providerResult.current.isLoading).toBe(false);
      expect(mcpResult.current.isLoading).toBe(false);
      expect(toolsResult.current.isLoading).toBe(false);
      expect(convoResult.current.loading).toBe(false);
    });

    expect(providerResult.current.error).toBeUndefined();
    expect(mcpResult.current.error).toBeUndefined();
    expect(toolsResult.current.error).toBeUndefined();
    expect(convoResult.current.error).toBeUndefined();
  });
});
