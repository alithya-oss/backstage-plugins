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

jest.mock('@modelcontextprotocol/sdk/client/streamableHttp.js');
jest.mock('@modelcontextprotocol/sdk/client/stdio.js');

const {
  StreamableHTTPClientTransport,
} = require('@modelcontextprotocol/sdk/client/streamableHttp.js');
const {
  StdioClientTransport,
} = require('@modelcontextprotocol/sdk/client/stdio.js');

import { McpTransportFactory } from './McpTransportFactory';

describe('McpTransportFactory', () => {
  let factory: McpTransportFactory;

  beforeEach(() => {
    jest.clearAllMocks();
    factory = new McpTransportFactory();
  });

  describe('createStreamableHttpTransport', () => {
    it('creates a StreamableHTTPClientTransport with the correct URL', () => {
      factory.createStreamableHttpTransport('https://example.com/mcp');

      expect(StreamableHTTPClientTransport).toHaveBeenCalledWith(
        new URL('https://example.com/mcp'),
        {},
      );
    });

    it('passes transport options including custom headers', () => {
      const options = {
        requestInit: {
          headers: { Authorization: 'Bearer my-token' },
        },
      };

      factory.createStreamableHttpTransport('https://example.com/mcp', options);

      expect(StreamableHTTPClientTransport).toHaveBeenCalledWith(
        new URL('https://example.com/mcp'),
        options,
      );
    });

    it('defaults to empty options when none provided', () => {
      factory.createStreamableHttpTransport('https://example.com/mcp');

      expect(StreamableHTTPClientTransport).toHaveBeenCalledWith(
        expect.any(URL),
        {},
      );
    });
  });

  describe('createStdioTransport', () => {
    it('creates a StdioClientTransport with command, args, and env', () => {
      const options = {
        command: '/usr/local/bin/npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
        env: { PATH: '/usr/local/bin:/usr/bin', HOME: '/home/user' },
      };

      factory.createStdioTransport(options);

      expect(StdioClientTransport).toHaveBeenCalledWith({
        command: '/usr/local/bin/npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
        env: { PATH: '/usr/local/bin:/usr/bin', HOME: '/home/user' },
      });
    });

    it('passes empty args and env when specified', () => {
      const options = {
        command: 'python3',
        args: [],
        env: {},
      };

      factory.createStdioTransport(options);

      expect(StdioClientTransport).toHaveBeenCalledWith({
        command: 'python3',
        args: [],
        env: {},
      });
    });
  });
});
