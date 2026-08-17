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

import { McpServerStatusReporter } from './McpServerStatusReporter';
import {
  MCPServer,
  ServerTool,
} from '@alithya-oss/backstage-plugin-mcp-chat-common';

describe('McpServerStatusReporter', () => {
  describe('getMCPServerStatus', () => {
    it('returns empty status when servers promise is null', async () => {
      const reporter = new McpServerStatusReporter({
        getMcpServersPromise: () => null,
        getTools: () => [],
      });

      const status = await reporter.getMCPServerStatus();

      expect(status).toMatchObject({
        total: 0,
        valid: 0,
        active: 0,
        servers: [],
      });
      expect(status.timestamp).toBeDefined();
    });

    it('counts valid and active servers correctly', async () => {
      const servers: MCPServer[] = [
        {
          id: 'server-1',
          name: 'Server 1',
          type: 'streamable-http' as any,
          url: 'https://example.com/mcp',
          status: { valid: true, connected: true },
        },
        {
          id: 'server-2',
          name: 'Server 2',
          type: 'stdio' as any,
          scriptPath: '/path/to/script.py',
          status: { valid: true, connected: false, error: 'Connection failed' },
        },
        {
          id: 'server-3',
          name: 'Server 3',
          type: 'stdio' as any,
          status: { valid: false, connected: false, error: 'No script path' },
        },
      ];

      const reporter = new McpServerStatusReporter({
        getMcpServersPromise: () => Promise.resolve(servers),
        getTools: () => [],
      });

      const status = await reporter.getMCPServerStatus();

      expect(status.total).toBe(3);
      expect(status.valid).toBe(2);
      expect(status.active).toBe(1);
      expect(status.servers).toEqual(servers);
      expect(status.timestamp).toBeDefined();
    });

    it('returns all servers in the servers array', async () => {
      const servers: MCPServer[] = [
        {
          id: 'only-server',
          name: 'Only Server',
          type: 'streamable-http' as any,
          url: 'https://single.example.com/mcp',
          status: { valid: true, connected: true },
        },
      ];

      const reporter = new McpServerStatusReporter({
        getMcpServersPromise: () => Promise.resolve(servers),
        getTools: () => [],
      });

      const status = await reporter.getMCPServerStatus();

      expect(status.servers).toHaveLength(1);
      expect(status.servers[0].id).toBe('only-server');
    });
  });

  describe('getAvailableTools', () => {
    it('returns tools from the getter function', () => {
      const tools: ServerTool[] = [
        {
          type: 'function',
          function: {
            name: 'list_files',
            description: 'Lists files in a directory',
            parameters: { type: 'object', properties: {} },
          },
          serverId: 'fs-server',
        },
        {
          type: 'function',
          function: {
            name: 'read_file',
            description: 'Reads a file',
            parameters: { type: 'object', properties: {} },
          },
          serverId: 'fs-server',
        },
      ];

      const reporter = new McpServerStatusReporter({
        getMcpServersPromise: () => null,
        getTools: () => tools,
      });

      const result = reporter.getAvailableTools();

      expect(result).toEqual(tools);
      expect(result).toHaveLength(2);
    });

    it('returns an empty array when no tools are available', () => {
      const reporter = new McpServerStatusReporter({
        getMcpServersPromise: () => null,
        getTools: () => [],
      });

      expect(reporter.getAvailableTools()).toEqual([]);
    });
  });
});
