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

import { mockServices } from '@backstage/backend-test-utils';
import {
  loadServerConfigs,
  executeToolCall,
  validateConfig,
  validateMessages,
  isGuestUser,
  isMissingTableError,
  findNpxPath,
} from './utils';
import { MCPServerType } from '@alithya-oss/backstage-plugin-mcp-chat-common';
import { LoggerService } from '@backstage/backend-plugin-api';
import fc from 'fast-check';

jest.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
  Client: jest.fn(),
}));

describe('Utils', () => {
  let mockLogger: jest.Mocked<LoggerService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      child: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<LoggerService>;
  });

  describe('loadServerConfigs', () => {
    it('should load basic server configurations', () => {
      const mockConfig = mockServices.rootConfig({
        data: {
          mcpChat: {
            mcpServers: [
              {
                id: 'server1',
                name: 'Test Server',
                scriptPath: '/path/to/script',
                args: ['--arg1', '--arg2'],
              },
            ],
          },
        },
      });

      const result = loadServerConfigs(mockConfig);

      expect(result).toEqual([
        {
          id: 'server1',
          name: 'Test Server',
          scriptPath: '/path/to/script',
          args: ['--arg1', '--arg2'],
          type: MCPServerType.STDIO,
          env: undefined,
          headers: undefined,
          npxCommand: undefined,
          url: undefined,
        },
      ]);
    });

    it('should handle optional fields', () => {
      const mockConfig = mockServices.rootConfig({
        data: {
          mcpChat: {
            mcpServers: [
              {
                id: 'server1',
                name: 'Test Server',
                scriptPath: '/path/to/script',
                headers: {
                  Authorization: 'Bearer token',
                  'Content-Type': 'application/json',
                },
                env: {
                  NODE_ENV: 'test',
                  API_KEY: 'secret',
                },
              },
            ],
          },
        },
      });

      const result = loadServerConfigs(mockConfig);

      expect(result[0]).toMatchObject({
        id: 'server1',
        name: 'Test Server',
        headers: {
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
        },
        env: {
          NODE_ENV: 'test',
          API_KEY: 'secret',
        },
      });
    });

    it('should infer streamable-http type when url is present', () => {
      const mockConfig = mockServices.rootConfig({
        data: {
          mcpChat: {
            mcpServers: [
              {
                id: 'server1',
                name: 'HTTP Server',
                url: 'http://example.com/mcp',
              },
            ],
          },
        },
      });

      const result = loadServerConfigs(mockConfig);

      expect(result[0].type).toBe(MCPServerType.STREAMABLE_HTTP);
    });

    it('should infer streamable-http type when type is explicitly set', () => {
      const mockConfig = mockServices.rootConfig({
        data: {
          mcpChat: {
            mcpServers: [
              {
                id: 'server1',
                name: 'HTTP Server',
                type: MCPServerType.STREAMABLE_HTTP,
                scriptPath: '/path/to/script',
              },
            ],
          },
        },
      });

      const result = loadServerConfigs(mockConfig);

      expect(result[0].type).toBe(MCPServerType.STREAMABLE_HTTP);
    });

    it('should handle empty server configurations', () => {
      const mockConfig = mockServices.rootConfig({
        data: {
          mcpChat: {},
        },
      });

      const result = loadServerConfigs(mockConfig);

      expect(result).toEqual([]);
    });

    it('should handle missing mcpServers configuration', () => {
      const mockConfig = mockServices.rootConfig({
        data: {},
      });

      const result = loadServerConfigs(mockConfig);

      expect(result).toEqual([]);
    });
  });

  describe('validateConfig', () => {
    it('should throw error when no providers are configured', () => {
      const mockConfig = mockServices.rootConfig({
        data: {
          mcpChat: {
            mcpServers: [],
          },
        },
      });

      expect(() => validateConfig(mockConfig, mockLogger)).toThrow(
        'No LLM providers configured in mcpChat.providers. Please add at least one provider.',
      );
    });

    it('should validate provider requirements', () => {
      const mockConfig = mockServices.rootConfig({
        data: {
          mcpChat: {
            providers: [
              {
                id: 'test-provider',
                model: 'test-model',
              },
            ],
          },
        },
      });

      expect(() => validateConfig(mockConfig, mockLogger)).not.toThrow();
    });

    it('should validate MCP server headers configuration', () => {
      const mockConfig = mockServices.rootConfig({
        data: {
          mcpChat: {
            providers: [{ id: 'test' }],
            mcpServers: [
              {
                id: 'server1',
                name: 'Test Server',
                headers: 'invalid-headers',
              },
            ],
          },
        },
      });

      expect(() => validateConfig(mockConfig, mockLogger)).toThrow(
        'Invalid configuration for MCP server at index 0',
      );
    });

    it('should validate MCP server env configuration', () => {
      const mockConfig = mockServices.rootConfig({
        data: {
          mcpChat: {
            providers: [{ id: 'test' }],
            mcpServers: [
              {
                id: 'server1',
                name: 'Test Server',
                env: ['invalid-env'],
              },
            ],
          },
        },
      });

      expect(() => validateConfig(mockConfig, mockLogger)).toThrow(
        'Invalid configuration for MCP server at index 0',
      );
    });

    it('should validate quickPrompts required fields', () => {
      const mockConfig = mockServices.rootConfig({
        data: {
          mcpChat: {
            providers: [{ id: 'test' }],
            quickPrompts: [
              {
                title: 'Test Prompt',
                description: 'Test Description',
                category: 'Test Category',
              },
            ],
          },
        },
      });

      expect(() => validateConfig(mockConfig, mockLogger)).toThrow(
        "QuickPrompt at index 0 is missing required field: 'prompt'",
      );
    });

    it('should validate quickPrompts empty values', () => {
      const mockConfig = mockServices.rootConfig({
        data: {
          mcpChat: {
            providers: [{ id: 'test' }],
            quickPrompts: [
              {
                title: '',
                description: 'Test Description',
                prompt: 'Test Prompt',
                category: 'Test Category',
              },
            ],
          },
        },
      });

      expect(() => validateConfig(mockConfig, mockLogger)).toThrow();
    });

    it('should pass validation with valid configuration', () => {
      const mockConfig = mockServices.rootConfig({
        data: {
          mcpChat: {
            providers: [{ id: 'test' }],
            mcpServers: [
              {
                id: 'server1',
                name: 'Test Server',
                headers: { 'Content-Type': 'application/json' },
                env: { NODE_ENV: 'test' },
              },
            ],
            quickPrompts: [
              {
                title: 'Test Prompt',
                description: 'Test Description',
                prompt: 'Test Prompt Content',
                category: 'Test Category',
              },
            ],
          },
        },
      });

      expect(() => validateConfig(mockConfig, mockLogger)).not.toThrow();
    });

    it('should throw when toolCallTimeout is 0', () => {
      const mockConfig = mockServices.rootConfig({
        data: {
          mcpChat: {
            providers: [{ id: 'test' }],
            toolCallTimeout: 0,
          },
        },
      });

      expect(() => validateConfig(mockConfig, mockLogger)).toThrow(
        'mcpChat.toolCallTimeout must be a strictly positive number, got: 0',
      );
    });

    it('should throw when toolCallTimeout is negative', () => {
      const mockConfig = mockServices.rootConfig({
        data: {
          mcpChat: {
            providers: [{ id: 'test' }],
            toolCallTimeout: -1000,
          },
        },
      });

      expect(() => validateConfig(mockConfig, mockLogger)).toThrow(
        'mcpChat.toolCallTimeout must be a strictly positive number, got: -1000',
      );
    });

    it('should pass when toolCallTimeout is a positive number', () => {
      const mockConfig = mockServices.rootConfig({
        data: {
          mcpChat: {
            providers: [{ id: 'test' }],
            toolCallTimeout: 30000,
          },
        },
      });

      expect(() => validateConfig(mockConfig, mockLogger)).not.toThrow();
    });
  });

  describe('validateMessages', () => {
    it('should validate basic message structure', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
        { role: 'user', content: 'How are you?' },
      ];

      const result = validateMessages(messages, mockLogger);

      expect(result.isValid).toBe(true);
    });

    it('should require messages field', () => {
      const result = validateMessages(null, mockLogger);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Messages field is required');
    });

    it('should require messages to be an array', () => {
      const result = validateMessages('not an array', mockLogger);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Messages must be an array');
    });

    it('should require at least one message', () => {
      const result = validateMessages([], mockLogger);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('At least one message is required');
    });

    it('should validate message object structure', () => {
      const messages = ['not an object'];

      const result = validateMessages(messages, mockLogger);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Message at index 0 must be an object');
    });

    it('should validate required role field', () => {
      const messages = [{ content: 'Hello' }];

      const result = validateMessages(messages, mockLogger);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        "Message at index 0 is missing required field 'role'",
      );
    });

    it('should validate required content field', () => {
      const messages = [{ role: 'user' }];

      const result = validateMessages(messages, mockLogger);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        "Message at index 0 is missing required field 'content'",
      );
    });

    it('should validate role values', () => {
      const messages = [{ role: 'invalid', content: 'Hello' }];

      const result = validateMessages(messages, mockLogger);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain(
        "Message at index 0 has invalid role 'invalid'",
      );
    });

    it('should validate content types', () => {
      const messages = [{ role: 'user', content: 123 }];

      const result = validateMessages(messages, mockLogger);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        'Message at index 0 content must be a string or null',
      );
    });

    it('should validate content length', () => {
      const longContent = 'a'.repeat(100001);
      const messages = [{ role: 'user', content: longContent }];

      const result = validateMessages(messages, mockLogger);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        'Message at index 0 content exceeds maximum length of 100,000 characters',
      );
    });

    it('should validate empty content for non-tool messages', () => {
      const messages = [{ role: 'user', content: '' }];

      const result = validateMessages(messages, mockLogger);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Message at index 0 has empty content');
    });

    it('should allow empty content for tool messages', () => {
      const messages = [
        { role: 'tool', content: '', tool_call_id: 'call_123' },
        { role: 'user', content: 'Hello' },
      ];

      const result = validateMessages(messages, mockLogger);

      expect(result.isValid).toBe(true);
    });

    it('should validate tool message tool_call_id', () => {
      const messages = [
        { role: 'tool', content: 'result' },
        { role: 'user', content: 'Hello' },
      ];

      const result = validateMessages(messages, mockLogger);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        'Tool message at index 0 must have a valid tool_call_id',
      );
    });

    it('should validate tool_calls array structure', () => {
      const messages = [
        {
          role: 'assistant',
          content: 'Let me help',
          tool_calls: 'not an array',
        },
        { role: 'user', content: 'Hello' },
      ];

      const result = validateMessages(messages, mockLogger);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        'Message at index 0 tool_calls must be an array',
      );
    });

    it('should validate tool_calls object structure', () => {
      const messages = [
        {
          role: 'assistant',
          content: 'Let me help',
          tool_calls: ['not an object'],
        },
        { role: 'user', content: 'Hello' },
      ];

      const result = validateMessages(messages, mockLogger);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        'Tool call at index 0 in message 0 must be an object',
      );
    });

    it('should validate tool_calls id field', () => {
      const messages = [
        {
          role: 'assistant',
          content: 'Let me help',
          tool_calls: [{ function: { name: 'test' } }],
        },
        { role: 'user', content: 'Hello' },
      ];

      const result = validateMessages(messages, mockLogger);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        'Tool call at index 0 in message 0 must have a valid id',
      );
    });

    it('should validate tool_calls function structure', () => {
      const messages = [
        {
          role: 'assistant',
          content: 'Let me help',
          tool_calls: [{ id: 'call_123' }],
        },
        { role: 'user', content: 'Hello' },
      ];

      const result = validateMessages(messages, mockLogger);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        'Tool call at index 0 in message 0 must have a valid function object',
      );
    });

    it('should validate tool_calls function name', () => {
      const messages = [
        {
          role: 'assistant',
          content: 'Let me help',
          tool_calls: [{ id: 'call_123', function: {} }],
        },
        { role: 'user', content: 'Hello' },
      ];

      const result = validateMessages(messages, mockLogger);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        'Tool call at index 0 in message 0 must have a valid function name',
      );
    });

    it('should require last message to be from user', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
      ];

      const result = validateMessages(messages, mockLogger);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Last message must be from user');
    });

    it('should warn about consecutive user messages but still validate', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'user', content: 'Are you there?' },
      ];

      const result = validateMessages(messages, mockLogger);

      expect(result.isValid).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Consecutive user messages detected in conversation',
      );
    });
  });

  describe('executeToolCall', () => {
    let mockClient: any;
    let mockClients: Map<string, any>;
    let mockTools: any[];

    beforeEach(() => {
      mockClient = {
        callTool: jest.fn(),
      };
      mockClients = new Map([['server1', mockClient]]);
      mockTools = [
        {
          function: { name: 'test_tool' },
          serverId: 'server1',
        },
      ];
    });

    it('should execute tool call successfully', async () => {
      const toolCall = {
        id: 'call_123',
        type: 'function' as const,
        function: {
          name: 'test_tool',
          arguments: JSON.stringify({ param: 'value' }),
        },
      };

      mockClient.callTool.mockResolvedValue({
        content: [{ type: 'text', text: 'Tool result' }],
      });

      const result = await executeToolCall(toolCall, mockTools, mockClients);

      expect(result).toEqual({
        id: 'call_123',
        name: 'test_tool',
        arguments: { param: 'value' },
        result: 'Tool result',
        serverId: 'server1',
      });
    });

    it('should handle different result formats', async () => {
      const toolCall = {
        id: 'call_123',
        type: 'function' as const,
        function: {
          name: 'test_tool',
          arguments: JSON.stringify({ param: 'value' }),
        },
      };

      mockClient.callTool.mockResolvedValue({
        content: 'Direct string result',
      });

      const result = await executeToolCall(toolCall, mockTools, mockClients);

      expect(result.result).toBe('Direct string result');
    });

    it('should handle empty arguments', async () => {
      const toolCall = {
        id: 'call_123',
        type: 'function' as const,
        function: {
          name: 'test_tool',
          arguments: '',
        },
      };

      mockClient.callTool.mockResolvedValue({
        content: [{ type: 'text', text: 'Success' }],
      });

      const result = await executeToolCall(toolCall, mockTools, mockClients);

      expect(result.arguments).toEqual({});
    });

    it('should throw error when tool not found', async () => {
      const toolCall = {
        id: 'call_123',
        type: 'function' as const,
        function: {
          name: 'nonexistent_tool',
          arguments: JSON.stringify({ param: 'value' }),
        },
      };

      await expect(
        executeToolCall(toolCall, mockTools, mockClients),
      ).rejects.toThrow("Tool 'nonexistent_tool' not found");
    });

    it('should throw error when client not found', async () => {
      const toolCall = {
        id: 'call_123',
        type: 'function' as const,
        function: {
          name: 'test_tool',
          arguments: JSON.stringify({ param: 'value' }),
        },
      };

      const toolsWithMissingServer = [
        {
          type: 'function' as const,
          function: {
            name: 'test_tool',
            description: 'Test tool',
            parameters: {},
          },
          serverId: 'missing_server',
        },
      ];

      await expect(
        executeToolCall(toolCall, toolsWithMissingServer, mockClients),
      ).rejects.toThrow("Client for server 'missing_server' not found");
    });

    it('should handle malformed JSON arguments', async () => {
      const toolCall = {
        id: 'call_123',
        type: 'function' as const,
        function: {
          name: 'test_tool',
          arguments: 'invalid json{',
        },
      };

      await expect(
        executeToolCall(toolCall, mockTools, mockClients),
      ).rejects.toThrow();
    });

    it('should propagate client errors', async () => {
      const toolCall = {
        id: 'call_123',
        type: 'function' as const,
        function: {
          name: 'test_tool',
          arguments: JSON.stringify({ param: 'value' }),
        },
      };

      mockClient.callTool.mockRejectedValue(new Error('Tool execution failed'));

      await expect(
        executeToolCall(toolCall, mockTools, mockClients),
      ).rejects.toThrow('Tool execution failed');
    });

    it('should forward the provided toolCallTimeout to client.callTool', async () => {
      const toolCall = {
        id: 'call_123',
        type: 'function' as const,
        function: {
          name: 'test_tool',
          arguments: JSON.stringify({ param: 'value' }),
        },
      };

      mockClient.callTool.mockResolvedValue({
        content: [{ type: 'text', text: 'ok' }],
      });

      await executeToolCall(toolCall, mockTools, mockClients, 30000);

      expect(mockClient.callTool).toHaveBeenCalledWith(
        { name: 'test_tool', arguments: { param: 'value' } },
        undefined,
        { timeout: 30000 },
      );
    });

    it('should use 60000ms as the default timeout when toolCallTimeout is omitted', async () => {
      const toolCall = {
        id: 'call_123',
        type: 'function' as const,
        function: {
          name: 'test_tool',
          arguments: JSON.stringify({ param: 'value' }),
        },
      };

      mockClient.callTool.mockResolvedValue({
        content: [{ type: 'text', text: 'ok' }],
      });

      await executeToolCall(toolCall, mockTools, mockClients);

      expect(mockClient.callTool).toHaveBeenCalledWith(
        { name: 'test_tool', arguments: { param: 'value' } },
        undefined,
        { timeout: 60000 },
      );
    });
  });

  describe('validateConfig - systemPrompt validation', () => {
    it('should accept valid systemPrompt', () => {
      const mockConfig = {
        getOptionalConfigArray: jest.fn((key: string) => {
          if (key === 'mcpChat.providers') {
            return [
              {
                getString: jest.fn((innerKey: string) => {
                  if (innerKey === 'id') return 'openai';
                  if (innerKey === 'model') return 'gpt-4';
                  return 'test-value';
                }),
                getOptionalString: jest.fn(),
                has: jest.fn(),
              },
            ];
          }
          if (key === 'mcpChat.mcpServers') {
            return [
              {
                getString: jest.fn(),
                getOptionalString: jest.fn(),
                getOptionalConfig: jest.fn(),
                has: jest.fn(),
              },
            ];
          }
          if (key === 'mcpChat.quickPrompts') {
            return [];
          }
          return [];
        }),
        getOptionalString: jest.fn((key: string) => {
          if (key === 'mcpChat.systemPrompt') {
            return 'You are a helpful assistant specialized in DevOps.';
          }
          return undefined;
        }),
        getOptionalNumber: jest.fn(),
      } as any;

      expect(() => validateConfig(mockConfig, mockLogger)).not.toThrow();
    });

    it('should accept undefined systemPrompt', () => {
      const mockConfig = {
        getOptionalConfigArray: jest.fn((key: string) => {
          if (key === 'mcpChat.providers') {
            return [
              {
                getString: jest.fn((innerKey: string) => {
                  if (innerKey === 'id') return 'openai';
                  if (innerKey === 'model') return 'gpt-4';
                  return 'test-value';
                }),
                getOptionalString: jest.fn(),
                has: jest.fn(),
              },
            ];
          }
          if (key === 'mcpChat.mcpServers') {
            return [
              {
                getString: jest.fn(),
                getOptionalString: jest.fn(),
                getOptionalConfig: jest.fn(),
                has: jest.fn(),
              },
            ];
          }
          if (key === 'mcpChat.quickPrompts') {
            return [];
          }
          return [];
        }),
        getOptionalString: jest.fn((key: string) => {
          if (key === 'mcpChat.systemPrompt') {
            return undefined;
          }
          return undefined;
        }),
        getOptionalNumber: jest.fn(),
      } as any;

      expect(() => validateConfig(mockConfig, mockLogger)).not.toThrow();
    });

    it('should reject empty systemPrompt', () => {
      const mockConfig = {
        getOptionalConfigArray: jest.fn((key: string) => {
          if (key === 'mcpChat.providers') {
            return [
              {
                getString: jest.fn((innerKey: string) => {
                  if (innerKey === 'id') return 'openai';
                  if (innerKey === 'model') return 'gpt-4';
                  return 'test-value';
                }),
                getOptionalString: jest.fn(),
                has: jest.fn(),
              },
            ];
          }
          if (key === 'mcpChat.mcpServers') {
            return [
              {
                getString: jest.fn(),
                getOptionalString: jest.fn(),
                getOptionalConfig: jest.fn(),
                has: jest.fn(),
              },
            ];
          }
          if (key === 'mcpChat.quickPrompts') {
            return [];
          }
          return [];
        }),
        getOptionalString: jest.fn((key: string) => {
          if (key === 'mcpChat.systemPrompt') {
            return '';
          }
          return undefined;
        }),
        getOptionalNumber: jest.fn(),
      } as any;

      expect(() => validateConfig(mockConfig, mockLogger)).toThrow(
        'systemPrompt cannot be empty or whitespace-only',
      );
    });

    it('should reject whitespace-only systemPrompt', () => {
      const mockConfig = {
        getOptionalConfigArray: jest.fn((key: string) => {
          if (key === 'mcpChat.providers') {
            return [
              {
                getString: jest.fn((innerKey: string) => {
                  if (innerKey === 'id') return 'openai';
                  if (innerKey === 'model') return 'gpt-4';
                  return 'test-value';
                }),
                getOptionalString: jest.fn(),
                has: jest.fn(),
              },
            ];
          }
          if (key === 'mcpChat.mcpServers') {
            return [
              {
                getString: jest.fn(),
                getOptionalString: jest.fn(),
                getOptionalConfig: jest.fn(),
                has: jest.fn(),
              },
            ];
          }
          if (key === 'mcpChat.quickPrompts') {
            return [];
          }
          return [];
        }),
        getOptionalString: jest.fn((key: string) => {
          if (key === 'mcpChat.systemPrompt') {
            return '   \n\t  ';
          }
          return undefined;
        }),
        getOptionalNumber: jest.fn(),
      } as any;

      expect(() => validateConfig(mockConfig, mockLogger)).toThrow(
        'systemPrompt cannot be empty or whitespace-only',
      );
    });

    it('should reject non-string systemPrompt', () => {
      const mockConfig = {
        getOptionalConfigArray: jest.fn((key: string) => {
          if (key === 'mcpChat.providers') {
            return [
              {
                getString: jest.fn((innerKey: string) => {
                  if (innerKey === 'id') return 'openai';
                  if (innerKey === 'model') return 'gpt-4';
                  return 'test-value';
                }),
                getOptionalString: jest.fn(),
                has: jest.fn(),
              },
            ];
          }
          if (key === 'mcpChat.mcpServers') {
            return [
              {
                getString: jest.fn(),
                getOptionalString: jest.fn(),
                getOptionalConfig: jest.fn(),
                has: jest.fn(),
              },
            ];
          }
          if (key === 'mcpChat.quickPrompts') {
            return [];
          }
          return [];
        }),
        getOptionalString: jest.fn((key: string) => {
          if (key === 'mcpChat.systemPrompt') {
            return 123 as any;
          }
          return undefined;
        }),
        getOptionalNumber: jest.fn(),
      } as any;

      expect(() => validateConfig(mockConfig, mockLogger)).toThrow(
        'systemPrompt must be a string',
      );
    });
  });

  describe('isGuestUser', () => {
    it('should return true for guest user', () => {
      expect(isGuestUser('user:development/guest')).toBe(true);
    });

    it('should return true for guest user case-insensitively', () => {
      expect(isGuestUser('User:Development/Guest')).toBe(true);
      expect(isGuestUser('USER:DEVELOPMENT/GUEST')).toBe(true);
    });

    it('should return false for regular users', () => {
      expect(isGuestUser('user:default/john.doe')).toBe(false);
      expect(isGuestUser('user:default/admin')).toBe(false);
    });

    it('should return false for partial guest matches', () => {
      expect(isGuestUser('user:development/guest-admin')).toBe(false);
      expect(isGuestUser('user:development/guestuser')).toBe(false);
    });
  });

  describe('isMissingTableError', () => {
    it('should return true for errors with code SQLITE_ERROR', () => {
      const error = Object.assign(new Error('no such table: conversations'), {
        code: 'SQLITE_ERROR',
      });
      expect(isMissingTableError(error)).toBe(true);
    });

    it('should return true for errors with code 42P01 (PostgreSQL)', () => {
      const error = Object.assign(
        new Error('relation "conversations" does not exist'),
        { code: '42P01' },
      );
      expect(isMissingTableError(error)).toBe(true);
    });

    it('should return true for errors with message containing "no such table"', () => {
      const error = new Error('SQLITE: no such table: mcp_conversations');
      expect(isMissingTableError(error)).toBe(true);
    });

    it('should return true for errors with message containing "relation ... does not exist"', () => {
      const error = new Error('relation "mcp_conversations" does not exist');
      expect(isMissingTableError(error)).toBe(true);
    });

    it('should return false for random errors', () => {
      const error = new Error('Connection timeout');
      expect(isMissingTableError(error)).toBe(false);
    });

    it('should return false for non-Error values', () => {
      expect(isMissingTableError('string error')).toBe(false);
      expect(isMissingTableError(null)).toBe(false);
      expect(isMissingTableError(undefined)).toBe(false);
      expect(isMissingTableError(42)).toBe(false);
      expect(isMissingTableError({})).toBe(false);
    });
  });

  describe('Property 6: Utility functions emit diagnostics through injected logger', () => {
    /**
     * **Validates: Requirements 6.7**
     *
     * For any utility function that emits diagnostic output (validateMessages,
     * validateConfig), calling it with a mock LoggerService SHALL result in at
     * least one call to the logger and zero calls to console.log/console.warn/console.error.
     */

    it('validateConfig calls logger.info on valid config (not console)', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('openai', 'anthropic', 'gemini', 'ollama'),
          providerId => {
            const logger: jest.Mocked<LoggerService> = {
              info: jest.fn(),
              warn: jest.fn(),
              error: jest.fn(),
              debug: jest.fn(),
              child: jest.fn().mockReturnThis(),
            } as unknown as jest.Mocked<LoggerService>;

            const consoleSpy = jest.spyOn(console, 'log');
            const consoleWarnSpy = jest.spyOn(console, 'warn');
            const consoleErrorSpy = jest.spyOn(console, 'error');

            const config = mockServices.rootConfig({
              data: {
                mcpChat: {
                  providers: [{ id: providerId }],
                },
              },
            });

            validateConfig(config, logger);

            expect(logger.info).toHaveBeenCalledWith(
              'MCP Chat configuration validated successfully',
            );
            expect(consoleSpy).not.toHaveBeenCalled();
            expect(consoleWarnSpy).not.toHaveBeenCalled();
            expect(consoleErrorSpy).not.toHaveBeenCalled();

            consoleSpy.mockRestore();
            consoleWarnSpy.mockRestore();
            consoleErrorSpy.mockRestore();
          },
        ),
        { numRuns: 100 },
      );
    });

    it('validateMessages calls logger.warn on consecutive user messages (not console.warn)', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 100 })
            .filter(s => s.trim().length > 0),
          fc
            .string({ minLength: 1, maxLength: 100 })
            .filter(s => s.trim().length > 0),
          (msg1, msg2) => {
            const logger: jest.Mocked<LoggerService> = {
              info: jest.fn(),
              warn: jest.fn(),
              error: jest.fn(),
              debug: jest.fn(),
              child: jest.fn().mockReturnThis(),
            } as unknown as jest.Mocked<LoggerService>;

            const consoleSpy = jest.spyOn(console, 'log');
            const consoleWarnSpy = jest.spyOn(console, 'warn');
            const consoleErrorSpy = jest.spyOn(console, 'error');

            const messages = [
              { role: 'user', content: msg1 },
              { role: 'user', content: msg2 },
            ];

            const result = validateMessages(messages, logger);

            expect(result.isValid).toBe(true);
            expect(logger.warn).toHaveBeenCalledWith(
              'Consecutive user messages detected in conversation',
            );
            expect(consoleSpy).not.toHaveBeenCalled();
            expect(consoleWarnSpy).not.toHaveBeenCalled();
            expect(consoleErrorSpy).not.toHaveBeenCalled();

            consoleSpy.mockRestore();
            consoleWarnSpy.mockRestore();
            consoleErrorSpy.mockRestore();
          },
        ),
        { numRuns: 100 },
      );
    });

    it('findNpxPath calls logger.debug when searching (not console)', async () => {
      const logger: jest.Mocked<LoggerService> = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        child: jest.fn().mockReturnThis(),
      } as unknown as jest.Mocked<LoggerService>;

      const consoleSpy = jest.spyOn(console, 'log');
      const consoleWarnSpy = jest.spyOn(console, 'warn');
      const consoleErrorSpy = jest.spyOn(console, 'error');

      // findNpxPath will either succeed or throw, but in both cases
      // it should use logger.debug and not console
      try {
        await findNpxPath(logger);
      } catch {
        // It's fine if npx is not found in the test environment
      }

      expect(logger.debug).toHaveBeenCalled();
      expect(consoleSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});
