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

import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHttpTransportOptions, StdioTransportOptions } from './types';

/**
 * Factory for creating MCP transport instances.
 *
 * Separates transport creation logic from the server lifecycle,
 * making each transport strategy independently testable.
 *
 * @public
 */
export class McpTransportFactory {
  /**
   * Creates a Streamable HTTP transport for connecting to a remote MCP server.
   *
   * @param url - The URL of the MCP server endpoint
   * @param options - Optional transport configuration including custom headers
   * @returns A configured StreamableHTTPClientTransport instance
   */
  createStreamableHttpTransport(
    url: string,
    options?: StreamableHttpTransportOptions,
  ): StreamableHTTPClientTransport {
    return new StreamableHTTPClientTransport(new URL(url), options ?? {});
  }

  /**
   * Creates a stdio transport for connecting to a local MCP server process.
   *
   * @param options - Transport configuration including command, args, and environment
   * @returns A configured StdioClientTransport instance
   */
  createStdioTransport(options: StdioTransportOptions): StdioClientTransport {
    return new StdioClientTransport({
      command: options.command,
      args: options.args,
      env: options.env,
    });
  }
}
