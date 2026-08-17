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

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import {
  ToolCall,
  ServerTool,
  ToolExecutionResult,
} from '@alithya-oss/backstage-plugin-mcp-chat-common';

/**
 * Default timeout in milliseconds for MCP tool call requests.
 * @public
 */
export const DEFAULT_MCP_TOOL_CALL_TIMEOUT_MS = 60000;

/**
 * Executes a tool call using the MCP client.
 * Finds the appropriate server based on the tool's serverId and executes the tool call.
 *
 * @param toolCall - The tool call from the LLM containing function name and arguments
 * @param tools - List of available tools with their server IDs
 * @param mcpClients - Map of server IDs to MCP client instances
 * @param toolCallTimeout - Timeout for the tool call to complete (default: 60000, unit: ms)
 * @returns Promise resolving to the tool execution result
 * @public
 */
export async function executeToolCall(
  toolCall: ToolCall,
  tools: ServerTool[],
  mcpClients: Map<string, Client>,
  toolCallTimeout: number = DEFAULT_MCP_TOOL_CALL_TIMEOUT_MS,
): Promise<ToolExecutionResult> {
  const toolName = toolCall.function.name;
  const toolArgs = JSON.parse(toolCall.function.arguments || '{}');

  // Find which server this tool belongs to
  const tool = tools.find(t => t.function.name === toolName);
  if (!tool) {
    throw new Error(`Tool '${toolName}' not found`);
  }

  const client = mcpClients.get(tool.serverId);
  if (!client) {
    throw new Error(`Client for server '${tool.serverId}' not found`);
  }

  const result = await client.callTool(
    {
      name: toolName,
      arguments: toolArgs,
    },
    undefined,
    { timeout: toolCallTimeout },
  );

  // Extract and format the result content properly
  let formattedResult: string;
  if (Array.isArray(result.content)) {
    // MCP results are arrays of content blocks
    formattedResult = result.content
      .map((block: any) => {
        if (block.type === 'text') {
          return block.text;
        } else if (typeof block === 'string') {
          return block;
        }
        return JSON.stringify(block, null, 2);
      })
      .join('\n');
  } else if (typeof result.content === 'string') {
    formattedResult = result.content;
  } else {
    formattedResult = JSON.stringify(result.content, null, 2);
  }

  return {
    id: toolCall.id,
    name: toolName,
    arguments: toolArgs,
    result: formattedResult,
    serverId: tool.serverId,
  };
}
