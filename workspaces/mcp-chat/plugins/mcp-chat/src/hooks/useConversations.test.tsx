/*
 * Copyright 2025 The Alithya Authors
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

import { ReactNode, FC } from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { TestApiProvider } from '@backstage/test-utils';
import { identityApiRef } from '@backstage/frontend-plugin-api';
import { mcpChatApiRef } from '../api';
import { useConversations } from './useConversations';
import type { ConversationRecord } from '../types';

const mockConversations: ConversationRecord[] = [
  {
    id: 'conv-1',
    userId: 'user:default/test-user',
    title: 'First conversation',
    messages: [{ role: 'user', content: 'Hello' }],
    isStarred: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'conv-2',
    userId: 'user:default/test-user',
    title: 'Second conversation',
    messages: [{ role: 'user', content: 'World' }],
    isStarred: true,
    createdAt: '2025-01-02T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
  },
];

function createMockIdentityApi(userEntityRef: string) {
  return {
    getBackstageIdentity: jest.fn().mockResolvedValue({
      type: 'user',
      userEntityRef,
      ownershipEntityRefs: [userEntityRef],
    }),
    getCredentials: jest.fn().mockResolvedValue({ token: undefined }),
    getProfileInfo: jest.fn().mockResolvedValue({
      displayName: 'Test',
      email: 'test@example.com',
    }),
  };
}

function createMockMcpChatApi() {
  return {
    getConversations: jest.fn().mockResolvedValue({
      conversations: mockConversations,
      count: mockConversations.length,
    }),
    getConversationById: jest.fn(),
    deleteConversation: jest.fn().mockResolvedValue(undefined),
    toggleConversationStar: jest.fn().mockResolvedValue({ isStarred: true }),
  };
}

describe('useConversations', () => {
  describe('guest user exclusion', () => {
    it('does not fetch conversations when user is a guest', async () => {
      const mockIdentityApi = createMockIdentityApi('user:development/guest');
      const mockMcpChatApi = createMockMcpChatApi();

      const Wrapper: FC<{ children: ReactNode }> = ({ children }) => (
        <TestApiProvider
          apis={[
            [mcpChatApiRef, mockMcpChatApi],
            [identityApiRef, mockIdentityApi],
          ]}
        >
          {children}
        </TestApiProvider>
      );

      const { result } = renderHook(() => useConversations(), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.conversations).toEqual([]);
      expect(mockMcpChatApi.getConversations).not.toHaveBeenCalled();
    });

    it('fetches conversations when user is not a guest', async () => {
      const mockIdentityApi = createMockIdentityApi('user:default/test-user');
      const mockMcpChatApi = createMockMcpChatApi();

      const Wrapper: FC<{ children: ReactNode }> = ({ children }) => (
        <TestApiProvider
          apis={[
            [mcpChatApiRef, mockMcpChatApi],
            [identityApiRef, mockIdentityApi],
          ]}
        >
          {children}
        </TestApiProvider>
      );

      const { result } = renderHook(() => useConversations(), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.conversations).toHaveLength(2);
      expect(mockMcpChatApi.getConversations).toHaveBeenCalledTimes(1);
    });
  });

  describe('optimistic delete with rollback', () => {
    it('removes conversation immediately then rolls back on API error', async () => {
      const mockIdentityApi = createMockIdentityApi('user:default/test-user');
      const mockMcpChatApi = createMockMcpChatApi();

      const Wrapper: FC<{ children: ReactNode }> = ({ children }) => (
        <TestApiProvider
          apis={[
            [mcpChatApiRef, mockMcpChatApi],
            [identityApiRef, mockIdentityApi],
          ]}
        >
          {children}
        </TestApiProvider>
      );

      const { result } = renderHook(() => useConversations(), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.conversations).toHaveLength(2);

      // Make delete fail
      mockMcpChatApi.deleteConversation.mockRejectedValueOnce(
        new Error('Server error'),
      );

      await act(async () => {
        try {
          await result.current.deleteConversation('conv-1');
        } catch {
          // Expected to throw
        }
      });

      // Rolled back: conv-1 is back after the error
      expect(result.current.conversations).toHaveLength(2);
      expect(
        result.current.conversations.find(c => c.id === 'conv-1'),
      ).toBeDefined();
    });

    it('removes conversation permanently on successful delete', async () => {
      const mockIdentityApi = createMockIdentityApi('user:default/test-user');
      const mockMcpChatApi = createMockMcpChatApi();

      const Wrapper: FC<{ children: ReactNode }> = ({ children }) => (
        <TestApiProvider
          apis={[
            [mcpChatApiRef, mockMcpChatApi],
            [identityApiRef, mockIdentityApi],
          ]}
        >
          {children}
        </TestApiProvider>
      );

      const { result } = renderHook(() => useConversations(), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deleteConversation('conv-1');
      });

      expect(result.current.conversations).toHaveLength(1);
      expect(
        result.current.conversations.find(c => c.id === 'conv-1'),
      ).toBeUndefined();
    });
  });

  describe('optimistic star toggle with rollback', () => {
    it('toggles star immediately then rolls back on API error', async () => {
      const mockIdentityApi = createMockIdentityApi('user:default/test-user');
      const mockMcpChatApi = createMockMcpChatApi();

      const Wrapper: FC<{ children: ReactNode }> = ({ children }) => (
        <TestApiProvider
          apis={[
            [mcpChatApiRef, mockMcpChatApi],
            [identityApiRef, mockIdentityApi],
          ]}
        >
          {children}
        </TestApiProvider>
      );

      const { result } = renderHook(() => useConversations(), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      // conv-1 starts as isStarred: false
      expect(
        result.current.conversations.find(c => c.id === 'conv-1')?.isStarred,
      ).toBe(false);

      // Make toggle fail
      mockMcpChatApi.toggleConversationStar.mockRejectedValueOnce(
        new Error('Star failed'),
      );

      await act(async () => {
        try {
          await result.current.toggleStar('conv-1');
        } catch {
          // Expected to throw
        }
      });

      // Rolled back: isStarred is false again
      expect(
        result.current.conversations.find(c => c.id === 'conv-1')?.isStarred,
      ).toBe(false);
    });

    it('toggles star permanently on success', async () => {
      const mockIdentityApi = createMockIdentityApi('user:default/test-user');
      const mockMcpChatApi = createMockMcpChatApi();

      const Wrapper: FC<{ children: ReactNode }> = ({ children }) => (
        <TestApiProvider
          apis={[
            [mcpChatApiRef, mockMcpChatApi],
            [identityApiRef, mockIdentityApi],
          ]}
        >
          {children}
        </TestApiProvider>
      );

      const { result } = renderHook(() => useConversations(), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      // conv-1 starts as isStarred: false
      expect(
        result.current.conversations.find(c => c.id === 'conv-1')?.isStarred,
      ).toBe(false);

      await act(async () => {
        await result.current.toggleStar('conv-1');
      });

      // Successfully toggled to true
      expect(
        result.current.conversations.find(c => c.id === 'conv-1')?.isStarred,
      ).toBe(true);
      expect(result.current.starredConversations).toHaveLength(2);
    });

    it('separates starred and recent conversations correctly', async () => {
      const mockIdentityApi = createMockIdentityApi('user:default/test-user');
      const mockMcpChatApi = createMockMcpChatApi();

      const Wrapper: FC<{ children: ReactNode }> = ({ children }) => (
        <TestApiProvider
          apis={[
            [mcpChatApiRef, mockMcpChatApi],
            [identityApiRef, mockIdentityApi],
          ]}
        >
          {children}
        </TestApiProvider>
      );

      const { result } = renderHook(() => useConversations(), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      // conv-2 is starred, conv-1 is not
      expect(result.current.starredConversations).toHaveLength(1);
      expect(result.current.starredConversations[0].id).toBe('conv-2');
      expect(result.current.recentConversations).toHaveLength(1);
      expect(result.current.recentConversations[0].id).toBe('conv-1');
    });
  });
});
