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

const utils = require('../utils');

import { mockServices } from '@backstage/backend-test-utils';
import { QueryProcessor } from './QueryProcessor';
import {
  ChatResponse,
  ToolCall,
  ServerTool,
} from '@alithya-oss/backstage-plugin-mcp-chat-common';

describe('QueryProcessor', () => {
  let processor: QueryProcessor;
  let mockLogger: ReturnType<typeof mockServices.logger.mock>;
  let mockLLMProvider: any;
  let mockTools: ServerTool[];
  let mockMcpClients: Map<string, any>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger = mockServices.logger.mock();

    mockLLMProvider = {
      sendMessage: jest.fn(),
      streamMessage: jest.fn(),
      supportsNativeMcp: jest.fn().mockReturnValue(false),
      setMcpServerConfigs: jest.fn(),
      getLastResponseOutput: jest.fn().mockReturnValue(null),
    };

    mockTools = [
      {
        type: 'function',
        function: {
          name: 'test_tool',
          description: 'A test tool',
          parameters: { type: 'object', properties: {} },
        },
        serverId: 'test-server',
      },
    ];

    mockMcpClients = new Map();
    mockMcpClients.set('test-server', { callTool: jest.fn() });

    utils.executeToolCall.mockResolvedValue({
      id: 'call_1',
      name: 'test_tool',
      arguments: { arg1: 'value1' },
      result: 'tool result',
      serverId: 'test-server',
    });

    processor = new QueryProcessor({
      logger: mockLogger,
      llmProvider: mockLLMProvider,
      systemPrompt: 'You are a helpful assistant.',
      toolCallTimeout: 60000,
      getTools: () => mockTools,
      getMcpClients: () => mockMcpClients,
      getServerConfigs: () => [],
    });
  });

  describe('processQuery without tools', () => {
    it('returns reply directly when LLM responds without tool calls', async () => {
      const response: ChatResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Hello! How can I help you?',
            },
          },
        ],
      };
      mockLLMProvider.sendMessage.mockResolvedValue(response);

      const result = await processor.processQuery([
        { role: 'user', content: 'Hello' },
      ]);

      expect(result).toEqual({
        reply: 'Hello! How can I help you?',
        toolCalls: [],
        toolResponses: [],
      });
    });

    it('prepends system prompt when no system message is present', async () => {
      const response: ChatResponse = {
        choices: [{ message: { role: 'assistant', content: 'Hi' } }],
      };
      mockLLMProvider.sendMessage.mockResolvedValue(response);

      await processor.processQuery([{ role: 'user', content: 'Hello' }]);

      const sentMessages = mockLLMProvider.sendMessage.mock.calls[0][0];
      expect(sentMessages[0]).toEqual({
        role: 'system',
        content: 'You are a helpful assistant.',
      });
    });

    it('does not prepend system prompt when first message is already system', async () => {
      const response: ChatResponse = {
        choices: [{ message: { role: 'assistant', content: 'Hi' } }],
      };
      mockLLMProvider.sendMessage.mockResolvedValue(response);

      await processor.processQuery([
        { role: 'system', content: 'Custom system prompt' },
        { role: 'user', content: 'Hello' },
      ]);

      const sentMessages = mockLLMProvider.sendMessage.mock.calls[0][0];
      expect(sentMessages[0]).toEqual({
        role: 'system',
        content: 'Custom system prompt',
      });
      const systemMessages = sentMessages.filter(
        (m: any) => m.role === 'system',
      );
      expect(systemMessages).toHaveLength(1);
    });
  });

  describe('processQuery with tool calls', () => {
    it('executes tools and sends follow-up to LLM', async () => {
      const toolCall: ToolCall = {
        id: 'call_1',
        type: 'function',
        function: { name: 'test_tool', arguments: '{"query": "test"}' },
      };

      const initialResponse: ChatResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [toolCall],
            },
          },
        ],
      };

      const followUpResponse: ChatResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Based on the result: tool result',
            },
          },
        ],
      };

      mockLLMProvider.sendMessage
        .mockResolvedValueOnce(initialResponse)
        .mockResolvedValueOnce(followUpResponse);

      const result = await processor.processQuery([
        { role: 'user', content: 'Use the test tool' },
      ]);

      expect(result.reply).toBe('Based on the result: tool result');
      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolResponses).toHaveLength(1);
      expect(utils.executeToolCall).toHaveBeenCalledWith(
        toolCall,
        mockTools,
        mockMcpClients,
        60000,
      );
    });

    it('handles tool execution errors gracefully', async () => {
      const toolCall: ToolCall = {
        id: 'call_err',
        type: 'function',
        function: { name: 'failing_tool', arguments: '{}' },
      };

      const initialResponse: ChatResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [toolCall],
            },
          },
        ],
      };

      const followUpResponse: ChatResponse = {
        choices: [
          { message: { role: 'assistant', content: 'An error occurred.' } },
        ],
      };

      mockLLMProvider.sendMessage
        .mockResolvedValueOnce(initialResponse)
        .mockResolvedValueOnce(followUpResponse);

      utils.executeToolCall.mockRejectedValue(
        new Error('Tool execution failed'),
      );

      const result = await processor.processQuery([
        { role: 'user', content: 'Use failing tool' },
      ]);

      expect(result.reply).toBe('An error occurred.');
      expect(result.toolResponses[0].result).toContain('Tool execution failed');
      expect(result.toolResponses[0].serverId).toBe('error');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Error executing tool 'failing_tool'"),
      );
    });
  });

  describe('processQuery with enabledTools filter', () => {
    it('filters tools by serverId when enabledTools is provided', async () => {
      const additionalTool: ServerTool = {
        type: 'function',
        function: {
          name: 'other_tool',
          description: 'Another tool',
          parameters: { type: 'object', properties: {} },
        },
        serverId: 'other-server',
      };

      const processorWithMultipleTools = new QueryProcessor({
        logger: mockLogger,
        llmProvider: mockLLMProvider,
        systemPrompt: 'You are helpful.',
        toolCallTimeout: 60000,
        getTools: () => [...mockTools, additionalTool],
        getMcpClients: () => mockMcpClients,
        getServerConfigs: () => [],
      });

      const response: ChatResponse = {
        choices: [{ message: { role: 'assistant', content: 'Done' } }],
      };
      mockLLMProvider.sendMessage.mockResolvedValue(response);

      await processorWithMultipleTools.processQuery(
        [{ role: 'user', content: 'Hello' }],
        ['test-server'],
      );

      // Only tools from 'test-server' should be sent to the LLM
      const sentTools = mockLLMProvider.sendMessage.mock.calls[0][1];
      expect(sentTools).toHaveLength(1);
      expect(sentTools[0].function.name).toBe('test_tool');
    });
  });

  describe('processQuery with native MCP provider (Responses API)', () => {
    it('delegates to Responses API path when provider supports native MCP', async () => {
      mockLLMProvider.supportsNativeMcp.mockReturnValue(true);

      const serverConfigs = [
        {
          id: 'http-server',
          name: 'HTTP Server',
          type: 'streamable-http',
          url: 'https://example.com/mcp',
        },
      ];

      const processorWithResponsesApi = new QueryProcessor({
        logger: mockLogger,
        llmProvider: mockLLMProvider,
        systemPrompt: 'You are helpful.',
        toolCallTimeout: 60000,
        getTools: () => mockTools,
        getMcpClients: () => mockMcpClients,
        getServerConfigs: () => serverConfigs as any,
      });

      const response: ChatResponse = {
        choices: [
          { message: { role: 'assistant', content: 'Responses API reply' } },
        ],
      };
      mockLLMProvider.sendMessage.mockResolvedValue(response);
      mockLLMProvider.getLastResponseOutput.mockReturnValue(null);

      const result = await processorWithResponsesApi.processQuery([
        { role: 'user', content: 'Hello' },
      ]);

      expect(result.reply).toBe('Responses API reply');
      expect(mockLLMProvider.setMcpServerConfigs).toHaveBeenCalledWith(
        serverConfigs,
      );
    });

    it('extracts tool responses from Responses API mcp_call events', async () => {
      mockLLMProvider.supportsNativeMcp.mockReturnValue(true);

      const processorWithResponsesApi = new QueryProcessor({
        logger: mockLogger,
        llmProvider: mockLLMProvider,
        systemPrompt: 'You are helpful.',
        toolCallTimeout: 60000,
        getTools: () => mockTools,
        getMcpClients: () => mockMcpClients,
        getServerConfigs: () =>
          [
            {
              id: 'server-1',
              name: 'Server 1',
              type: 'streamable-http',
              url: 'https://example.com',
            },
          ] as any,
      });

      const response: ChatResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Result from tools',
              tool_calls: [
                {
                  id: 'tc_1',
                  type: 'function',
                  function: { name: 'tool1', arguments: '{}' },
                },
              ],
            },
          },
        ],
      };
      mockLLMProvider.sendMessage.mockResolvedValue(response);
      mockLLMProvider.getLastResponseOutput.mockReturnValue([
        {
          type: 'mcp_call',
          id: 'mcp_1',
          name: 'tool1',
          arguments: '{"key": "value"}',
          output: 'tool output',
          server_label: 'server-1',
        },
      ]);

      const result = await processorWithResponsesApi.processQuery([
        { role: 'user', content: 'Use a tool' },
      ]);

      expect(result.toolResponses).toHaveLength(1);
      expect(result.toolResponses[0]).toMatchObject({
        id: 'mcp_1',
        name: 'tool1',
        arguments: { key: 'value' },
        result: 'tool output',
        serverId: 'server-1',
      });
    });
  });

  describe('streamQuery', () => {
    /** Builds a provider stream from a list of chunks. */
    const streamOf = (...chunks: any[]) =>
      jest.fn(async function* () {
        for (const chunk of chunks) {
          yield chunk;
        }
      });

    const textChunk = (text: string) => ({ type: 'text', text });
    const responseChunk = (message: any) => ({
      type: 'response',
      response: { choices: [{ message }] },
    });

    const drain = async (
      generator: AsyncGenerator<any, void, undefined>,
    ): Promise<any[]> => {
      const events: any[] = [];
      for await (const event of generator) {
        events.push(event);
      }
      return events;
    };

    const toolCall: ToolCall = {
      id: 'call_1',
      type: 'function',
      function: { name: 'test_tool', arguments: '{"arg1":"value1"}' },
    };

    it('streams a reply in order and terminates once when no tool is used', async () => {
      mockLLMProvider.streamMessage = streamOf(
        textChunk('Hello'),
        textChunk(', '),
        textChunk('world'),
        responseChunk({ role: 'assistant', content: 'Hello, world' }),
      );

      const events = await drain(
        processor.streamQuery([{ role: 'user', content: 'Hi' }]),
      );

      expect(events.map(event => event.type)).toEqual([
        'text',
        'text',
        'text',
        'result',
      ]);
      expect(
        events
          .filter(event => event.type === 'text')
          .map(event => event.text)
          .join(''),
      ).toBe('Hello, world');
      expect(events[events.length - 1].result).toEqual({
        reply: 'Hello, world',
        toolCalls: [],
        toolResponses: [],
      });
      expect(events.filter(event => event.type === 'result')).toHaveLength(1);
    });

    it('emits a single text event for a provider that does not stream natively', async () => {
      // The base-class fallback shape: whole reply as one fragment.
      mockLLMProvider.streamMessage = streamOf(
        textChunk('One shot reply'),
        responseChunk({ role: 'assistant', content: 'One shot reply' }),
      );

      const events = await drain(
        processor.streamQuery([{ role: 'user', content: 'Hi' }]),
      );

      expect(events).toEqual([
        { type: 'text', text: 'One shot reply' },
        {
          type: 'result',
          result: {
            reply: 'One shot reply',
            toolCalls: [],
            toolResponses: [],
          },
        },
      ]);
    });

    it('announces a tool invocation before its result and streams the follow-up reply', async () => {
      mockLLMProvider.streamMessage = jest
        .fn()
        .mockImplementationOnce(async function* () {
          yield responseChunk({
            role: 'assistant',
            content: null,
            tool_calls: [toolCall],
          });
        })
        .mockImplementationOnce(async function* () {
          yield textChunk('Based on ');
          yield textChunk('the tool');
          yield responseChunk({
            role: 'assistant',
            content: 'Based on the tool',
          });
        });

      const events = await drain(
        processor.streamQuery([{ role: 'user', content: 'Use a tool' }]),
      );

      expect(events.map(event => event.type)).toEqual([
        'tool-call',
        'tool-result',
        'text',
        'text',
        'result',
      ]);
      expect(events[0]).toEqual({
        type: 'tool-call',
        id: 'call_1',
        name: 'test_tool',
        arguments: { arg1: 'value1' },
        serverId: 'test-server',
      });
      expect(events[1]).toEqual({
        type: 'tool-result',
        id: 'call_1',
        result: 'tool result',
        isError: false,
      });
      expect(events[events.length - 1].result).toMatchObject({
        reply: 'Based on the tool',
        toolCalls: [toolCall],
      });
    });

    it('marks a failed tool invocation and still reaches the terminal chunk', async () => {
      utils.executeToolCall.mockRejectedValue(new Error('tool exploded'));
      mockLLMProvider.streamMessage = jest
        .fn()
        .mockImplementationOnce(async function* () {
          yield responseChunk({
            role: 'assistant',
            content: null,
            tool_calls: [toolCall],
          });
        })
        .mockImplementationOnce(async function* () {
          yield textChunk('Sorry, that failed');
          yield responseChunk({
            role: 'assistant',
            content: 'Sorry, that failed',
          });
        });

      const events = await drain(
        processor.streamQuery([{ role: 'user', content: 'Use a tool' }]),
      );

      const toolResult = events.find(event => event.type === 'tool-result');
      expect(toolResult).toEqual({
        type: 'tool-result',
        id: 'call_1',
        result: "Error executing tool 'test_tool': tool exploded",
        isError: true,
      });
      expect(events[events.length - 1]).toMatchObject({
        type: 'result',
        result: { reply: 'Sorry, that failed' },
      });
    });

    it('starts no further tool invocation and emits no terminal chunk once aborted', async () => {
      const controller = new AbortController();
      mockLLMProvider.streamMessage = jest
        .fn()
        .mockImplementationOnce(async function* () {
          yield textChunk('Partial');
          yield responseChunk({
            role: 'assistant',
            content: null,
            tool_calls: [toolCall],
          });
        });

      const events: any[] = [];
      for await (const event of processor.streamQuery(
        [{ role: 'user', content: 'Use a tool' }],
        undefined,
        { signal: controller.signal },
      )) {
        events.push(event);
        // Cancel as soon as the first fragment lands.
        controller.abort();
      }

      expect(events).toEqual([{ type: 'text', text: 'Partial' }]);
      expect(utils.executeToolCall).not.toHaveBeenCalled();
      expect(events.some(event => event.type === 'result')).toBe(false);
      // Only the first pass ran; no follow-up request was made.
      expect(mockLLMProvider.streamMessage).toHaveBeenCalledTimes(1);
    });

    it('replays a native-MCP provider run as tool events followed by its reply', async () => {
      mockLLMProvider.supportsNativeMcp.mockReturnValue(true);
      mockLLMProvider.sendMessage.mockResolvedValue({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Native reply',
              tool_calls: [toolCall],
            },
          },
        ],
      });
      mockLLMProvider.getLastResponseOutput.mockReturnValue([
        {
          type: 'mcp_call',
          id: 'mcp_1',
          name: 'tool1',
          arguments: '{"key":"value"}',
          output: 'tool output',
          server_label: 'server-1',
        },
      ]);

      const events = await drain(
        processor.streamQuery([{ role: 'user', content: 'Use a tool' }]),
      );

      expect(events.map(event => event.type)).toEqual([
        'tool-call',
        'tool-result',
        'text',
        'result',
      ]);
      expect(events[1]).toEqual({
        type: 'tool-result',
        id: 'mcp_1',
        result: 'tool output',
        isError: false,
      });
      expect(events[2]).toEqual({ type: 'text', text: 'Native reply' });
    });
  });
});
