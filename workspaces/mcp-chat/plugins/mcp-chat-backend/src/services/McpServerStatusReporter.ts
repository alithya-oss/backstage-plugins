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

import {
  MCPServer,
  MCPServerStatusData,
  ServerTool,
} from '@alithya-oss/backstage-plugin-mcp-chat-common';

/**
 * Reports the status of connected MCP servers and available tools.
 *
 * @public
 */
export class McpServerStatusReporter {
  private readonly getMcpServersPromise: () => Promise<MCPServer[]> | null;
  private readonly getTools: () => ServerTool[];

  constructor(options: {
    getMcpServersPromise: () => Promise<MCPServer[]> | null;
    getTools: () => ServerTool[];
  }) {
    this.getMcpServersPromise = options.getMcpServersPromise;
    this.getTools = options.getTools;
  }

  async getMCPServerStatus(): Promise<MCPServerStatusData> {
    const mcpServers = this.getMcpServersPromise();
    if (!mcpServers) {
      return {
        total: 0,
        valid: 0,
        active: 0,
        servers: [],
        timestamp: new Date().toISOString(),
      };
    }
    const servers = await mcpServers;
    return {
      total: servers.length,
      valid: servers.filter(s => s.status.valid).length,
      active: servers.filter(s => s.status.connected).length,
      servers,
      timestamp: new Date().toISOString(),
    };
  }

  getAvailableTools(): ServerTool[] {
    return this.getTools();
  }
}
