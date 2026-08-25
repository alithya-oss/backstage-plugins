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
import { NotAllowedError } from '@backstage/errors';
import express from 'express';
import request from 'supertest';
import { createRouter } from './router';
import { MCPClientService } from './services/MCPClientService';
import { ChatConversationStore } from './services/ChatConversationStore';
import { SummarizationService } from './services/SummarizationService';
import { MCPServerType } from '@alithya-oss/backstage-plugin-mcp-chat-common';

describe('createRouter', () => {
  let app: express.Express;
  let mcpClientService: jest.Mocked<MCPClientService>;
  let conversationStore: jest.Mocked<ChatConversationStore>;
  let summarizationService: jest.Mocked<SummarizationService>;
  let httpAuth: ReturnType<typeof mockServices.httpAuth.mock>;

  beforeEach(async () => {
    mcpClientService = {
      initializeMCPServers: jest.fn(),
      processQuery: jest.fn(),
      streamQuery: jest.fn(),
      getAvailableTools: jest.fn(),
      getProviderStatus: jest.fn(),
      getMCPServerStatus: jest.fn(),
    };

    conversationStore = {
      saveConversation: jest.fn(),
      getConversations: jest.fn(),
      getConversationById: jest.fn(),
      deleteUserConversations: jest.fn(),
      deleteConversation: jest.fn(),
      toggleStarred: jest.fn(),
      updateTitle: jest.fn(),
    } as unknown as jest.Mocked<ChatConversationStore>;

    summarizationService = {
      summarizeConversation: jest.fn().mockResolvedValue('Test Title'),
    } as unknown as jest.Mocked<SummarizationService>;

    httpAuth = mockServices.httpAuth.mock();
    httpAuth.credentials.mockResolvedValue({
      principal: {
        type: 'user',
        userEntityRef: 'user:default/mock',
      },
    } as any);

    const router = await createRouter({
      logger: mockServices.logger.mock(),
      mcpClientService,
      conversationStore,
      httpAuth,
      summarizationService,
    });

    app = express();
    app.use(router);
  });

  describe('GET /provider/status', () => {
    it('should return provider status successfully', async () => {
      const mockStatus = {
        providers: [
          {
            id: 'openai',
            model: 'gpt-4o-mini',
            baseUrl: 'https://api.openai.com/v1',
            connection: {
              connected: true,
            },
          },
        ],
        summary: {
          totalProviders: 1,
          healthyProviders: 1,
        },
        timestamp: '2025-01-01T00:00:00.000Z',
      };

      mcpClientService.getProviderStatus.mockResolvedValue(mockStatus);

      const response = await request(app).get('/provider/status');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockStatus);
      expect(mcpClientService.getProviderStatus).toHaveBeenCalledTimes(1);
    });

    it('should handle provider status errors', async () => {
      mcpClientService.getProviderStatus.mockRejectedValue(
        new Error('Provider connection failed'),
      );

      const response = await request(app).get('/provider/status');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /mcp/status', () => {
    it('should return MCP server status successfully', async () => {
      const mockStatus = {
        total: 2,
        valid: 2,
        active: 2,
        servers: [
          {
            id: 'brave-search',
            name: 'Brave Search',
            type: MCPServerType.STDIO,
            status: {
              valid: true,
              connected: true,
            },
          },
          {
            id: 'backstage-server',
            name: 'Backstage Server',
            type: MCPServerType.STREAMABLE_HTTP,
            status: {
              valid: true,
              connected: true,
            },
          },
        ],
        timestamp: '2025-01-01T00:00:00.000Z',
      };

      mcpClientService.getMCPServerStatus.mockResolvedValue(mockStatus);

      const response = await request(app).get('/mcp/status');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockStatus);
      expect(mcpClientService.getMCPServerStatus).toHaveBeenCalledTimes(1);
    });

    it('should handle MCP status errors', async () => {
      mcpClientService.getMCPServerStatus.mockRejectedValue(
        new Error('MCP status failed'),
      );

      const response = await request(app).get('/mcp/status');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /tools', () => {
    it('should return available tools successfully', async () => {
      const mockTools = [
        {
          serverId: 'brave-search',
          type: 'function' as const,
          function: {
            name: 'search_web',
            description: 'Search the web',
            parameters: {},
          },
        },
        {
          serverId: 'weather-server',
          type: 'function' as const,
          function: {
            name: 'get_weather',
            description: 'Get weather information',
            parameters: {},
          },
        },
      ];

      mcpClientService.getAvailableTools.mockReturnValue(mockTools);

      const response = await request(app).get('/tools');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        availableTools: mockTools,
        toolCount: 2,
        timestamp: expect.any(String),
      });
      expect(mcpClientService.getAvailableTools).toHaveBeenCalledTimes(1);
    });

    it('should return empty tools list', async () => {
      mcpClientService.getAvailableTools.mockReturnValue([]);

      const response = await request(app).get('/tools');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        availableTools: [],
        toolCount: 0,
        timestamp: expect.any(String),
      });
    });
  });

  describe('POST /chat', () => {
    const validMessages = [
      { role: 'user', content: 'Hello, what can you help me with?' },
    ];

    it('should process chat request without tools', async () => {
      const mockResponse = {
        reply: 'Hello! I can help you with various tasks.',
        toolCalls: [],
        toolResponses: [],
      };

      mcpClientService.processQuery.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/chat')
        .send({ messages: validMessages, enabledTools: [] });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        role: 'assistant',
        content: 'Hello! I can help you with various tasks.',
        toolResponses: [],
        toolsUsed: [],
      });
      expect(mcpClientService.processQuery).toHaveBeenCalledWith(
        validMessages,
        [],
      );
    });

    it('should process chat request with tools', async () => {
      const mockToolCall = {
        id: 'call_123',
        type: 'function' as const,
        function: {
          name: 'search_web',
          arguments: JSON.stringify({ query: 'test' }),
        },
      };

      const mockResponse = {
        reply: 'I found some search results.',
        toolCalls: [mockToolCall],
        toolResponses: [
          {
            id: 'call_456',
            name: 'search_web',
            arguments: {},
            result: 'Results here',
            serverId: 'test-server',
          },
        ],
      };

      mcpClientService.processQuery.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/chat')
        .send({ messages: validMessages, enabledTools: ['search_web'] });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        role: 'assistant',
        content: 'I found some search results.',
        toolResponses: [
          {
            id: 'call_456',
            name: 'search_web',
            arguments: {},
            result: 'Results here',
            serverId: 'test-server',
          },
        ],
        toolsUsed: ['search_web'],
      });
    });

    it('should return 400 for empty messages array', async () => {
      const response = await request(app)
        .post('/chat')
        .send({ messages: [], enabledTools: [] });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'At least one message is required',
      });
    });

    it('should return 400 for missing messages', async () => {
      const response = await request(app)
        .post('/chat')
        .send({ enabledTools: [] });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Messages field is required',
      });
    });

    it('should return 400 for invalid message structure', async () => {
      const response = await request(app)
        .post('/chat')
        .send({ messages: [{ role: 'user' }], enabledTools: [] });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Message at index 0 is missing required field 'content'",
      });
    });

    it('should return 400 for invalid role', async () => {
      const response = await request(app)
        .post('/chat')
        .send({
          messages: [{ role: 'invalid', content: 'test' }],
          enabledTools: [],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('invalid role');
    });

    it('should return 400 for empty content', async () => {
      const response = await request(app)
        .post('/chat')
        .send({
          messages: [{ role: 'user', content: '' }],
          enabledTools: [],
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Message at index 0 has empty content',
      });
    });

    it('should return 400 for null content', async () => {
      const response = await request(app)
        .post('/chat')
        .send({
          messages: [{ role: 'user', content: null }],
          enabledTools: [],
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Message at index 0 has empty content',
      });
    });

    it('should return 400 for non-user last message', async () => {
      const response = await request(app)
        .post('/chat')
        .send({
          messages: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there' },
          ],
          enabledTools: [],
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Last message must be from user',
      });
    });

    it('should return 400 for non-array enabledTools', async () => {
      const response = await request(app)
        .post('/chat')
        .send({ messages: validMessages, enabledTools: 'not-array' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'enabledTools must be an array',
      });
    });

    it('should return 400 for non-string enabledTools elements', async () => {
      const response = await request(app)
        .post('/chat')
        .send({ messages: validMessages, enabledTools: [123, 'valid'] });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'All enabledTools must be strings',
      });
    });

    it('should handle processQuery errors', async () => {
      mcpClientService.processQuery.mockRejectedValue(
        new Error('Query processing failed'),
      );

      const response = await request(app)
        .post('/chat')
        .send({ messages: validMessages, enabledTools: [] });

      expect(response.status).toBe(500);
    });

    it('should handle enabledTools being undefined', async () => {
      const mockResponse = {
        reply: 'Response without tools',
        toolCalls: [],
        toolResponses: [],
      };

      mcpClientService.processQuery.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/chat')
        .send({ messages: validMessages });

      expect(response.status).toBe(200);
      expect(mcpClientService.processQuery).toHaveBeenCalledWith(
        validMessages,
        undefined,
      );
    });
  });

  /**
   * Property 8: Backend route paths preserved
   *
   * For any HTTP method+path pair served by the router, the refactored router
   * SHALL handle requests at that same method+path without returning 404.
   *
   * **Validates: Requirements 12.1**
   */
  describe('GET /conversations', () => {
    it('should return conversations list for authenticated user', async () => {
      const mockConversations = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          userId: 'user:default/mock',
          messages: [{ role: 'user' as const, content: 'Hello' }],
          title: 'Test Conversation',
          isStarred: false,
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
        },
      ];
      conversationStore.getConversations.mockResolvedValue(mockConversations);

      const response = await request(app).get('/conversations');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('conversations');
      expect(response.body).toHaveProperty('count');
      expect(response.body.count).toBe(1);
    });

    it('should return 400 for invalid limit parameter', async () => {
      const response = await request(app).get('/conversations?limit=0');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: expect.stringContaining('Limit must be between'),
      });
    });

    it('should return empty list when table is missing', async () => {
      const missingTableError: any = new Error('no such table');
      missingTableError.code = 'SQLITE_ERROR';
      conversationStore.getConversations.mockRejectedValue(missingTableError);

      const response = await request(app).get('/conversations');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ conversations: [], count: 0 });
    });
  });

  describe('GET /conversations/:id', () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';

    it('should return a conversation by ID', async () => {
      const mockConversation = {
        id: validUuid,
        userId: 'user:default/mock',
        messages: [{ role: 'user' as const, content: 'Hello' }],
        title: 'Test',
        isStarred: false,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      };
      conversationStore.getConversationById.mockResolvedValue(mockConversation);

      const response = await request(app).get(`/conversations/${validUuid}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(validUuid);
    });

    it('should return 404 when conversation not found', async () => {
      conversationStore.getConversationById.mockResolvedValue(null);

      const response = await request(app).get(`/conversations/${validUuid}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Conversation not found' });
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app).get('/conversations/not-a-uuid');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid id format' });
    });
  });

  describe('DELETE /conversations/:id', () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';

    it('should delete a conversation and return 204', async () => {
      conversationStore.deleteConversation.mockResolvedValue(true);

      const response = await request(app).delete(`/conversations/${validUuid}`);

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
    });

    it('should return 404 when conversation to delete is not found', async () => {
      conversationStore.deleteConversation.mockResolvedValue(false);

      const response = await request(app).delete(`/conversations/${validUuid}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Conversation not found' });
    });
  });

  describe('PATCH /conversations/:id/star', () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';

    it('should toggle star and return new status', async () => {
      conversationStore.toggleStarred.mockResolvedValue(true);

      const response = await request(app).patch(
        `/conversations/${validUuid}/star`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ isStarred: true });
    });
  });

  describe('PATCH /conversations/:id/title', () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';

    it('should update title and return it', async () => {
      conversationStore.updateTitle.mockResolvedValue(undefined);

      const response = await request(app)
        .patch(`/conversations/${validUuid}/title`)
        .send({ title: 'New Title' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ title: 'New Title' });
    });

    it('should return 400 when title is not a string', async () => {
      const response = await request(app)
        .patch(`/conversations/${validUuid}/title`)
        .send({ title: 123 });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Title must be a string' });
    });

    it('should return 400 when title exceeds 255 characters', async () => {
      const response = await request(app)
        .patch(`/conversations/${validUuid}/title`)
        .send({ title: 'x'.repeat(256) });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Title too long (max 255 characters)',
      });
    });
  });

  /**
   * Property 7: Route handlers throw @backstage/errors types on failure
   *
   * For any invalid request payload delivered to a route handler, the handler
   * SHALL throw an error that is an instance of a class from @backstage/errors
   * (InputError, NotFoundError, NotAllowedError), and the error middleware
   * SHALL map these to the correct HTTP status codes with { error: string } body.
   *
   * **Validates: Requirements 7.2, 7.5**
   */
  describe('Error handler middleware', () => {
    it('should map InputError to 400 with { error: string } body', async () => {
      // InputError is triggered by invalid chat messages
      const response = await request(app)
        .post('/chat')
        .send({ messages: [], enabledTools: [] });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });

    it('should map NotFoundError to 404 with { error: string } body', async () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      conversationStore.getConversationById.mockResolvedValue(null);

      const response = await request(app).get(`/conversations/${validUuid}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });

    it('should map NotAllowedError to 403 with { error: string } body', async () => {
      // Create a separate app that forces a NotAllowedError to be thrown
      const errorRouter = express.Router();
      errorRouter.use(express.json());
      errorRouter.get('/test-forbidden', (_req, _res) => {
        throw new NotAllowedError('Access denied');
      });
      const { createErrorHandler } = require('./middleware');
      errorRouter.use(createErrorHandler(mockServices.logger.mock()));

      const errorApp = express();
      errorApp.use(errorRouter);

      const response = await request(errorApp).get('/test-forbidden');

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Access denied' });
    });

    it('should map untyped Error to 500 with { error: string } body', async () => {
      mcpClientService.getProviderStatus.mockRejectedValue(
        new Error('Something broke unexpectedly'),
      );

      const response = await request(app).get('/provider/status');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });

    it('should map SyntaxError from malformed JSON to 400 with specific message', async () => {
      const response = await request(app)
        .post('/chat')
        .set('Content-Type', 'application/json')
        .send('{invalid json}');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Invalid JSON in request body',
      });
    });
  });
});
