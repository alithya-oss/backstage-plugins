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

import { RootConfigService } from '@backstage/backend-plugin-api';
import {
  MCPServerFullConfig,
  MCPServerType,
} from '@alithya-oss/backstage-plugin-mcp-chat-common';

/**
 * Loads MCP server configurations from Backstage config.
 * Reads from the `mcpChat.mcpServers` configuration section.
 *
 * @param config - The Backstage root config service
 * @returns Array of server configurations including secrets
 * @public
 */
export function loadServerConfigs(
  config: RootConfigService,
): MCPServerFullConfig[] {
  const mcpServers = config.getOptionalConfigArray('mcpChat.mcpServers') || [];

  return mcpServers?.map(serverConfig => {
    const headers: Record<string, string> | undefined = serverConfig
      .getOptionalConfig('headers')
      ?.get() as Record<string, string> | undefined;

    const env: Record<string, string> | undefined = serverConfig
      .getOptionalConfig('env')
      ?.get() as Record<string, string> | undefined;

    const typeString = serverConfig.getOptionalString('type');
    let type: MCPServerType;

    if (typeString === 'streamable-http' || serverConfig.has('url')) {
      type = MCPServerType.STREAMABLE_HTTP;
    } else {
      type = MCPServerType.STDIO;
    }

    return {
      id: serverConfig.getString('id'),
      name: serverConfig.getString('name'),
      scriptPath: serverConfig.getOptionalString('scriptPath'),
      npxCommand: serverConfig.getOptionalString('npxCommand'),
      args: serverConfig.getOptionalStringArray('args'),
      env,
      url: serverConfig.getOptionalString('url'),
      headers,
      type,
      disabledTools: serverConfig.getOptionalStringArray('disabledTools'),
    };
  });
}
