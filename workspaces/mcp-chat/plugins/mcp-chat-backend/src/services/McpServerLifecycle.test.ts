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

jest.mock('@modelcontextprotocol/sdk/client/index.js');
jest.mock('../utils');

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const utils = require('../utils');

import { mockServices } from '@backstage/backend-test-utils';
import { McpServerLifecycle } from './McpServerLifecycle';
import { McpTransportFactory } from './McpTransportFactory';
import { MCPServerFullConfig } from '@alithya-oss/backstage-plugin-mcp-chat-common';

describe('McpServerLifecycle', () => {
  let lifecycle: McpServerLifecycle;
  let mockLogger: ReturnType<typeof mockServices.logger.mock>;
  let mockConfig: ReturnType<typeof mockServices.rootConfig.mock>;
  let mockLLMProvider: any;
  let mockTransportFactory: jest.Mocked<McpTransportFactory>;
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger = mockServices.logger.mock();
    mockConfig = mockServices.rootConfig.mock();

    mockLLMProvider = {
      supportsNativeMcp: jest.fn().mockReturnValue(false),
      setMcpServerConfigs: jest.fn(),
    };

    mockTransportFactory = {
      createStreamableHttpTransport: jest.fn().mockReturnValue({}),
      createStdioTransport: jest.fn().mockReturnValue({}),
    } as any;

    mockClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      listTools: jest.fn().mockResolvedValue({ tools: [] }),
    };

    Client.mockImplementation(() => mockClient);
    utils.loadServerConfigs.mockReturnValue([]);
    utils.findNpxPath.mockResolvedValue('/usr/local/bin/npx');

    lifecycle = new McpServerLifecycle({
      logger: mockLogger,
      config: mockConfig,
      llmProvider: mockLLMProvider,
      transportFactory: mockTransportFactory,
    });
  });

  describe('filterDiscoveredTools', () => {
    it('filters out disabled tools from the results', () => {
      const tools = [
        { name: 'safe_tool', description: 'Safe', inputSchema: {} },
        { name: 'dangerous_tool', description: 'Dangerous', inputSchema: {} },
      ];

      const serverConfig = {
        id: 'test-server',
        name: 'Test Server',
        disabledTools: ['dangerous_tool'],
      } as unknown as MCPServerFullConfig;

      const result = lifecycle.filterDiscoveredTools(tools, serverConfig);

      expect(result.serverTools).toHaveLength(1);
      expect(result.serverTools[0].function.name).toBe('safe_tool');
      expect(result.serverTools[0].serverId).toBe('test-server');
    });

    it('logs a warning for invalid disabled tool names', () => {
      const tools = [
        { name: 'real_tool', description: 'Real', inputSchema: {} },
      ];

      const serverConfig = {
        id: 'test-server',
        name: 'Test Server',
        disabledTools: ['nonexistent_tool'],
      } as unknown as MCPServerFullConfig;

      lifecycle.filterDiscoveredTools(tools, serverConfig);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Unable to exclude tool 'nonexistent_tool'"),
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Available: real_tool'),
      );
    });

    it('returns all tools when no disabledTools configured', () => {
      const tools = [
        { name: 'tool_a', description: 'A', inputSchema: {} },
        { name: 'tool_b', description: 'B', inputSchema: {} },
      ];

      const serverConfig = {
        id: 'test-server',
        name: 'Test Server',
      } as unknown as MCPServerFullConfig;

      const result = lifecycle.filterDiscoveredTools(tools, serverConfig);

      expect(result.serverTools).toHaveLength(2);
      expect(result.allowedTools).toBeUndefined();
    });

    it('returns allowedTools list when tools are actually disabled', () => {
      const tools = [
        { name: 'tool_a', description: 'A', inputSchema: {} },
        { name: 'tool_b', description: 'B', inputSchema: {} },
      ];

      const serverConfig = {
        id: 'test-server',
        name: 'Test Server',
        disabledTools: ['tool_b'],
      } as unknown as MCPServerFullConfig;

      const result = lifecycle.filterDiscoveredTools(tools, serverConfig);

      expect(result.serverTools).toHaveLength(1);
      expect(result.allowedTools).toEqual(['tool_a']);
    });

    it('does not return allowedTools when all disabledTools are invalid', () => {
      const tools = [{ name: 'tool_a', description: 'A', inputSchema: {} }];

      const serverConfig = {
        id: 'test-server',
        name: 'Test Server',
        disabledTools: ['typo_tool'],
      } as unknown as MCPServerFullConfig;

      const result = lifecycle.filterDiscoveredTools(tools, serverConfig);

      expect(result.serverTools).toHaveLength(1);
      expect(result.allowedTools).toBeUndefined();
    });

    it('truncates available tool names when server has many tools', () => {
      const tools = Array.from({ length: 8 }, (_, i) => ({
        name: `tool_${i}`,
        description: `Tool ${i}`,
        inputSchema: {},
      }));

      const serverConfig = {
        id: 'test-server',
        name: 'Test Server',
        disabledTools: ['missing_tool'],
      } as unknown as MCPServerFullConfig;

      lifecycle.filterDiscoveredTools(tools, serverConfig);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('and 3 others'),
      );
    });
  });

  describe('initializeMCPServers', () => {
    it('memoizes and only initializes once', async () => {
      utils.loadServerConfigs.mockReturnValue([]);

      const result1 = await lifecycle.initializeMCPServers();
      const result2 = await lifecycle.initializeMCPServers();

      expect(result1).toBe(result2);
      expect(utils.loadServerConfigs).toHaveBeenCalledTimes(1);
    });

    it('connects to streamable-http servers using transport factory', async () => {
      const configs: MCPServerFullConfig[] = [
        {
          id: 'http-server',
          name: 'HTTP Server',
          type: 'streamable-http' as any,
          url: 'https://example.com/mcp',
          headers: { Authorization: 'Bearer token' },
        } as any,
      ];

      utils.loadServerConfigs.mockReturnValue(configs);
      mockClient.listTools.mockResolvedValue({
        tools: [
          { name: 'http_tool', description: 'HTTP tool', inputSchema: {} },
        ],
      });

      const servers = await lifecycle.initializeMCPServers();

      expect(
        mockTransportFactory.createStreamableHttpTransport,
      ).toHaveBeenCalledWith('https://example.com/mcp', {
        requestInit: { headers: { Authorization: 'Bearer token' } },
      });
      expect(servers).toHaveLength(1);
      expect(servers[0].status.connected).toBe(true);
    });

    it('handles connection failures gracefully', async () => {
      const configs: MCPServerFullConfig[] = [
        {
          id: 'failing-server',
          name: 'Failing Server',
          type: 'stdio' as any,
          scriptPath: '/path/to/failing.py',
        } as any,
      ];

      utils.loadServerConfigs.mockReturnValue(configs);
      mockClient.connect.mockRejectedValue(new Error('Connection refused'));

      const servers = await lifecycle.initializeMCPServers();

      expect(servers).toHaveLength(1);
      expect(servers[0].status.connected).toBe(false);
      expect(servers[0].status.error).toBe('Connection refused');
    });
  });
});
