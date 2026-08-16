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
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import * as path from 'path';
import { findNpxPath, loadServerConfigs } from '../utils/index';
import { LLMProvider } from '@alithya-oss/backstage-plugin-mcp-chat-node';
import {
  MCPServer,
  MCPServerType,
  MCPServerFullConfig,
  ServerTool,
} from '@alithya-oss/backstage-plugin-mcp-chat-common';
import { McpTransportFactory } from './McpTransportFactory';
import { StreamableHttpTransportOptions } from './types';

/** Manages MCP server lifecycle: initialization, connection, and tool discovery. */
export class McpServerLifecycle {
  private readonly logger: LoggerService;
  private readonly config: RootConfigService;
  private readonly llmProvider: LLMProvider;
  private readonly transportFactory: McpTransportFactory;
  private readonly mcpClients: Map<string, Client> = new Map();
  private tools: ServerTool[] = [];
  private connected = false;
  private mcpServers: Promise<MCPServer[]> | null = null;
  private serverConfigs: MCPServerFullConfig[] = [];
  private allowedToolsByServer: Map<string, string[]> = new Map();

  constructor(options: {
    logger: LoggerService;
    config: RootConfigService;
    llmProvider: LLMProvider;
    transportFactory: McpTransportFactory;
  }) {
    this.logger = options.logger;
    this.config = options.config;
    this.llmProvider = options.llmProvider;
    this.transportFactory = options.transportFactory;
  }

  getTools(): ServerTool[] {
    return this.tools;
  }
  getMcpClients(): Map<string, Client> {
    return this.mcpClients;
  }
  getServerConfigs(): MCPServerFullConfig[] {
    return this.serverConfigs;
  }
  getAllowedToolsByServer(): Map<string, string[]> {
    return this.allowedToolsByServer;
  }
  getMcpServersPromise(): Promise<MCPServer[]> | null {
    return this.mcpServers;
  }

  async initializeMCPServers(): Promise<MCPServer[]> {
    if (this.mcpServers) return this.mcpServers;
    this.mcpServers = this.mcpServerInit();
    return this.mcpServers;
  }

  private async mcpServerInit(): Promise<MCPServer[]> {
    if (this.connected) return this.mcpServers ? await this.mcpServers : [];

    const allTools: ServerTool[] = [];
    const serverResults: MCPServer[] = [];
    const configs = loadServerConfigs(this.config);
    this.serverConfigs = configs;

    if (this.llmProvider.supportsNativeMcp()) {
      return this.initNativeMcp(configs, allTools, serverResults);
    }
    return this.initStandardMcp(configs, allTools, serverResults);
  }

  private async initNativeMcp(
    configs: MCPServerFullConfig[],
    allTools: ServerTool[],
    results: MCPServer[],
  ): Promise<MCPServer[]> {
    this.logger.info(
      'Using OpenAI Responses API - initializing local MCP for tool discovery',
    );

    for (const sc of configs.filter(c => c.url)) {
      try {
        const client = new Client({
          name: `${sc.name}-client`,
          version: '1.0.0',
        });
        const opts: StreamableHttpTransportOptions = {};
        if (sc.headers) opts.requestInit = { headers: sc.headers };
        const transport = this.transportFactory.createStreamableHttpTransport(
          sc.url!,
          opts,
        );
        await client.connect(transport);
        this.mcpClients.set(sc.id, client);
        const { tools } = await client.listTools();
        const { serverTools, allowedTools } = this.filterDiscoveredTools(
          tools,
          sc,
        );
        if (allowedTools) this.allowedToolsByServer.set(sc.id, allowedTools);
        allTools.push(...serverTools);
        results.push({
          id: sc.id,
          name: sc.name,
          type: sc.type,
          url: sc.url,
          status: { valid: true, connected: true },
        });
        this.logger.info(
          `Connected to ${sc.name}: ${serverTools.length} tools`,
        );
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Failed to connect to ${sc.name}: ${msg}`);
        results.push({
          id: sc.id,
          name: sc.name,
          type: sc.type,
          url: sc.url,
          status: { valid: true, connected: false, error: msg },
        });
      }
    }

    for (const sc of configs.filter(c => !c.url)) {
      results.push({
        id: sc.id,
        name: sc.name,
        type: sc.type,
        npxCommand: sc.npxCommand,
        scriptPath: sc.scriptPath,
        args: sc.args,
        status: {
          valid: false,
          connected: false,
          error: 'Responses API only supports URL-based MCP servers',
        },
      });
    }

    this.tools = allTools;
    this.connected = true;
    this.logger.info(
      `Discovered ${this.tools.length} tools from ${
        results.filter(s => s.status.connected).length
      } connected servers`,
    );
    return results;
  }

  private async initStandardMcp(
    configs: MCPServerFullConfig[],
    allTools: ServerTool[],
    results: MCPServer[],
  ): Promise<MCPServer[]> {
    for (const sc of configs) {
      const isValid = !!(sc.url || sc.npxCommand || sc.scriptPath);
      const base = {
        id: sc.id,
        name: sc.name,
        type: sc.type,
        url: sc.url,
        npxCommand: sc.npxCommand,
        scriptPath: sc.scriptPath,
        args: sc.args,
      };
      try {
        const client = new Client({
          name: `${sc.name}-client`,
          version: '1.0.0',
        });
        const transport = await this.createTransportForConfig(sc);
        await client.connect(transport);
        const { tools } = await client.listTools();
        const { serverTools } = this.filterDiscoveredTools(tools, sc);
        allTools.push(...serverTools);
        this.mcpClients.set(sc.id, client);
        results.push({ ...base, status: { valid: isValid, connected: true } });
        this.logger.info(
          `MCP Server '${sc.name}' connected via ${
            sc.type
          } with tools: ${serverTools.map(t => t.function.name).join(', ')}`,
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        results.push({
          ...base,
          status: { valid: isValid, connected: false, error: errorMessage },
        });
        this.logger.warn(
          `Failed to connect to MCP server '${sc.name}': ${errorMessage}`,
        );
      }
    }

    this.tools = allTools;
    this.connected = true;
    const connected = results.filter(s => s.status.connected).length;
    const failed = results.filter(s => !s.status.connected);
    if (failed.length > 0) {
      this.logger.info(
        `MCP initialization completed: ${connected}/${
          configs.length
        } servers connected. Failed: ${failed.map(s => s.name).join(', ')}`,
      );
    } else {
      this.logger.info(
        `All MCP servers connected successfully. Total tools: ${this.tools.length}`,
      );
    }
    return results;
  }

  private async createTransportForConfig(sc: MCPServerFullConfig) {
    if (sc.type === MCPServerType.STREAMABLE_HTTP) {
      if (!sc.url)
        throw new Error(
          `Server config for '${sc.name}' with streamable-http type must have a url`,
        );
      const opts: StreamableHttpTransportOptions = {};
      if (sc.headers) opts.requestInit = { headers: sc.headers };
      return this.transportFactory.createStreamableHttpTransport(sc.url, opts);
    }
    return this.createStdioTransportForConfig(sc);
  }

  private async createStdioTransportForConfig(sc: MCPServerFullConfig) {
    let command: string;
    let args: string[];

    if (sc.npxCommand) {
      try {
        command = await findNpxPath(this.logger);
        args = ['-y', sc.npxCommand, ...(sc.args || [])];
      } catch (error) {
        throw new Error(
          `Failed to find npx for server '${sc.name}': ${
            error instanceof Error ? error.message : error
          }. Please ensure Node.js is properly installed with npx available.`,
        );
      }
    } else if (sc.scriptPath) {
      const isPython = sc.scriptPath.endsWith('.py');
      let pythonCmd: string;
      if (isPython) {
        pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
      } else {
        pythonCmd = process.execPath;
      }
      command = pythonCmd;
      args = [sc.scriptPath, ...(sc.args || [])];
    } else {
      throw new Error(
        `Server config for '${sc.name}' must have either scriptPath, npxCommand, or url`,
      );
    }

    const env = Object.fromEntries(
      Object.entries({
        ...process.env,
        ...sc.env,
        ...(sc.npxCommand && {
          PATH: `${path.dirname(process.execPath)}:${process.env.PATH || ''}`,
        }),
      }).filter((entry): entry is [string, string] => entry[1] !== undefined),
    );
    return this.transportFactory.createStdioTransport({ command, args, env });
  }

  /** Filters discovered tools based on the server's disabledTools config. */
  filterDiscoveredTools(
    tools: {
      name: string;
      description?: string;
      inputSchema: Record<string, unknown>;
    }[],
    serverConfig: MCPServerFullConfig,
  ): { serverTools: ServerTool[]; allowedTools?: string[] } {
    const disabledSet = new Set(serverConfig.disabledTools || []);
    const allNames = tools.map(t => t.name);

    if (disabledSet.size > 0) {
      for (const invalid of [...disabledSet].filter(
        t => !allNames.includes(t),
      )) {
        const maxShown = 5;
        const summary =
          allNames.length <= maxShown
            ? allNames.join(', ')
            : `${allNames.slice(0, maxShown).join(', ')} and ${
                allNames.length - maxShown
              } others`;
        this.logger.warn(
          `Unable to exclude tool '${invalid}' from MCP Server '${serverConfig.name}': tool not found. Available: ${summary}`,
        );
      }
    }

    const enabled = tools.filter(t => !disabledSet.has(t.name));
    const actuallyDisabled = [...disabledSet].filter(t => allNames.includes(t));
    if (actuallyDisabled.length > 0) {
      this.logger.info(
        `MCP Server '${
          serverConfig.name
        }': disabled tools: ${actuallyDisabled.join(', ')}`,
      );
    }

    const serverTools: ServerTool[] = enabled.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description || '',
        parameters: tool.inputSchema,
      },
      serverId: serverConfig.id,
    }));

    return {
      serverTools,
      allowedTools:
        actuallyDisabled.length > 0 ? enabled.map(t => t.name) : undefined,
    };
  }
}
