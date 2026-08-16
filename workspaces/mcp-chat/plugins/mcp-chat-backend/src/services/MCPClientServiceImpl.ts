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
import { LLMProvider } from '@alithya-oss/backstage-plugin-mcp-chat-node';
import { MCPClientService } from './MCPClientService';
import {
  MCPServer,
  MCPServerStatusData,
  ProviderStatusData,
  QueryResponse,
  ServerTool,
} from '@alithya-oss/backstage-plugin-mcp-chat-common';
import { McpServerLifecycle } from './McpServerLifecycle';
import { McpTransportFactory } from './McpTransportFactory';
import { QueryProcessor } from './QueryProcessor';
import { ProviderStatusReporter } from './ProviderStatusReporter';
import { McpServerStatusReporter } from './McpServerStatusReporter';

/**
 * Options for creating an MCPClientServiceImpl instance.
 *
 * @public
 */
export type Options = {
  logger: LoggerService;
  config: RootConfigService;
  provider: LLMProvider;
};

/**
 * Thin facade implementing the MCPClientService interface.
 * Delegates all responsibilities to dedicated service units.
 *
 * @public
 */
export class MCPClientServiceImpl implements MCPClientService {
  private readonly lifecycle: McpServerLifecycle;
  private readonly queryProcessor: QueryProcessor;
  private readonly providerStatusReporter: ProviderStatusReporter;
  private readonly mcpServerStatusReporter: McpServerStatusReporter;

  constructor(options: Options) {
    const { logger, config, provider } = options;

    const transportFactory = new McpTransportFactory();

    this.lifecycle = new McpServerLifecycle({
      logger,
      config,
      llmProvider: provider,
      transportFactory,
    });

    const systemPrompt =
      config.getOptionalString('mcpChat.systemPrompt') ||
      "You are a helpful assistant. When using tools, provide a clear, readable summary of the results rather than showing raw data. Focus on answering the user's question with the information gathered.";

    const toolCallTimeout =
      config.getOptionalNumber('mcpChat.toolCallTimeout') ?? 60000;

    this.queryProcessor = new QueryProcessor({
      logger,
      llmProvider: provider,
      systemPrompt,
      toolCallTimeout,
      getTools: () => this.lifecycle.getTools(),
      getMcpClients: () => this.lifecycle.getMcpClients(),
      getServerConfigs: () => this.lifecycle.getServerConfigs(),
    });

    this.providerStatusReporter = new ProviderStatusReporter({
      logger,
      llmProvider: provider,
    });

    this.mcpServerStatusReporter = new McpServerStatusReporter({
      getMcpServersPromise: () => this.lifecycle.getMcpServersPromise(),
      getTools: () => this.lifecycle.getTools(),
    });

    // Trigger server initialization
    this.lifecycle.initializeMCPServers();
  }

  async initializeMCPServers(): Promise<MCPServer[]> {
    return this.lifecycle.initializeMCPServers();
  }

  async processQuery(
    messagesInput: any[],
    enabledTools?: string[],
  ): Promise<QueryResponse> {
    return this.queryProcessor.processQuery(messagesInput, enabledTools);
  }

  getAvailableTools(): ServerTool[] {
    return this.mcpServerStatusReporter.getAvailableTools();
  }

  async getProviderStatus(): Promise<ProviderStatusData> {
    return this.providerStatusReporter.getProviderStatus();
  }

  async getMCPServerStatus(): Promise<MCPServerStatusData> {
    return this.mcpServerStatusReporter.getMCPServerStatus();
  }
}
