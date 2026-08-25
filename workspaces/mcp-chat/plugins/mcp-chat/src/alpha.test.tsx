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

import { renderTestApp } from '@backstage/frontend-test-utils';
import { screen } from '@testing-library/react';
import mcpChatPlugin from './alpha';
import { mcpChatApiRef } from './api';
import { rootRouteRef, promptRouteRef } from './wiring';
import { McpChat } from './api/McpChatApi';

jest.mock('./components/BotIcon', () => ({
  BotIconComponent: jest.fn(() => 'BotIconComponent'),
}));

jest.mock('./components/ChatPage', () => ({
  ChatPage: () => <div>chat page</div>,
  ChatPageContent: () => <div>chat page content</div>,
}));

jest.mock('./components/PromptPage', () => ({
  PromptPageContent: () => <div>prompt page content</div>,
}));

describe('mcp-chat plugin', () => {
  describe('mcpChatPlugin', () => {
    it('should have correct plugin configuration', () => {
      expect(mcpChatPlugin.pluginId).toBe('mcp-chat');
      expect(mcpChatPlugin.routes.root).toBe(rootRouteRef);
      expect(mcpChatPlugin.routes.prompt).toBe(promptRouteRef);
      expect(mcpChatPlugin.routes.prompt).not.toBe(mcpChatPlugin.routes.root);
    });

    it('should register API extension', () => {
      expect(mcpChatPlugin.getExtension('api:mcp-chat')).toBeDefined();
    });

    it('should register page extension', () => {
      expect(mcpChatPlugin.getExtension('page:mcp-chat')).toBeDefined();
    });

    it('should register the prompt page extension', () => {
      expect(mcpChatPlugin.getExtension('page:mcp-chat/prompt')).toBeDefined();
    });
  });

  describe('page routing', () => {
    it('should reach both pages at their own paths, each leaving the other unrendered', async () => {
      renderTestApp({
        features: [mcpChatPlugin],
        initialRouteEntries: ['/mcp-chat'],
      });

      expect(await screen.findByText('chat page content')).toBeInTheDocument();
      expect(screen.queryByText('prompt page content')).not.toBeInTheDocument();
    });

    it('should render the prompt page on its own path', async () => {
      renderTestApp({
        features: [mcpChatPlugin],
        initialRouteEntries: ['/mcp-chat-prompt'],
      });

      expect(
        await screen.findByText('prompt page content'),
      ).toBeInTheDocument();
      expect(screen.queryByText('chat page content')).not.toBeInTheDocument();
    });

    it('should leave the existing page unaffected when the prompt page is not mounted', async () => {
      renderTestApp({
        features: [mcpChatPlugin],
        initialRouteEntries: ['/mcp-chat'],
        config: {
          app: { extensions: [{ 'page:mcp-chat/prompt': false }] },
        },
      });

      expect(await screen.findByText('chat page content')).toBeInTheDocument();
      expect(screen.queryByText('prompt page content')).not.toBeInTheDocument();
    });
  });

  describe('McpChat API implementation', () => {
    let client: McpChat;
    let mockDiscoveryApi: any;
    let mockFetchApi: any;
    let mockFetch: jest.Mock;

    beforeEach(() => {
      mockFetch = jest.fn();
      mockDiscoveryApi = {
        getBaseUrl: jest.fn().mockResolvedValue('http://localhost:7007/api'),
      };
      mockFetchApi = {
        fetch: mockFetch,
      };
      client = new McpChat({
        discoveryApi: mockDiscoveryApi,
        fetchApi: mockFetchApi,
      });
    });

    it('should implement all required API methods', () => {
      expect(typeof client.sendChatMessage).toBe('function');
      expect(typeof client.getMCPServerStatus).toBe('function');
      expect(typeof client.getAvailableTools).toBe('function');
      expect(typeof client.getProviderStatus).toBe('function');
    });

    it('should handle sendChatMessage with proper parameters', async () => {
      const mockResponse = { role: 'assistant', content: 'Hello' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const messages = [{ role: 'user' as const, content: 'Hello' }];
      const result = await client.sendChatMessage(messages, ['tool1']);

      expect(result).toEqual(mockResponse);
      expect(mockDiscoveryApi.getBaseUrl).toHaveBeenCalledWith('mcp-chat');
    });

    it('should handle API methods without optional parameters', async () => {
      const mockServerStatus = {
        total: 0,
        valid: 0,
        active: 0,
        servers: [],
        timestamp: '2024-01-01',
      };
      const mockTools = { tools: [] };
      const mockProviderStatus = { providers: [] };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockServerStatus),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockTools),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockProviderStatus),
        });

      const serverStatus = await client.getMCPServerStatus();
      const tools = await client.getAvailableTools();
      const providerStatus = await client.getProviderStatus();

      expect(serverStatus).toEqual(mockServerStatus);
      expect(tools).toEqual(mockTools);
      expect(providerStatus).toEqual(mockProviderStatus);
    });
  });

  describe('API reference', () => {
    it('should have correct API reference configuration', () => {
      expect(mcpChatApiRef.id).toBe('plugin.mcp-chat.service');
    });
  });
});
