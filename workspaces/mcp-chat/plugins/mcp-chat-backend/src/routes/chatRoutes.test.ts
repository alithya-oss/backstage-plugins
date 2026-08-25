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
import express from 'express';
import http from 'http';
import { AddressInfo } from 'net';
import request from 'supertest';
import { createRouter } from '../router';
import { MCPClientService } from '../services/MCPClientService';
import { ChatConversationStore } from '../services/ChatConversationStore';
import { SummarizationService } from '../services/SummarizationService';

/** A frame of the server-sent event stream. */
type SseFrame = { event: string; data: any };

/** Parses an SSE body into its frames, asserting each carries both lines. */
const parseSse = (raw: string): SseFrame[] =>
  raw
    .split('\n\n')
    .filter(frame => frame.trim().length > 0)
    .map(frame => {
      const lines = frame.split('\n');
      const name = lines.find(line => line.startsWith('event: '));
      const data = lines.find(line => line.startsWith('data: '));
      if (!name || !data) {
        throw new Error(`Malformed SSE frame: ${JSON.stringify(frame)}`);
      }
      return {
        event: name.slice('event: '.length),
        data: JSON.parse(data.slice('data: '.length)),
      };
    });

/** Turns a fixed list of chunks into the generator streamQuery returns. */
const streamOf = (...chunks: any[]) =>
  async function* () {
    for (const chunk of chunks) {
      yield chunk;
    }
  };

const USER_TURN = [{ role: 'user', content: 'Hello' }];
const CONVERSATION_ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';

describe('POST /chat/stream', () => {
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
      saveConversation: jest.fn().mockResolvedValue({ id: CONVERSATION_ID }),
      updateTitle: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ChatConversationStore>;

    summarizationService = {
      summarizeConversation: jest.fn().mockResolvedValue('Test Title'),
    } as unknown as jest.Mocked<SummarizationService>;

    httpAuth = mockServices.httpAuth.mock();
    httpAuth.credentials.mockResolvedValue({
      principal: { type: 'user', userEntityRef: 'user:default/mock' },
    } as any);

    app = express();
    app.use(
      await createRouter({
        logger: mockServices.logger.mock(),
        mcpClientService,
        conversationStore,
        httpAuth,
        summarizationService,
      }),
    );
  });

  describe('a streaming request is accepted', () => {
    it('answers an event stream with anti-buffering headers, forwarding tool events before exactly one terminal event', async () => {
      mcpClientService.streamQuery.mockImplementation(
        streamOf(
          { type: 'text', text: 'Looking' },
          {
            type: 'tool-call',
            id: 'call_1',
            name: 'test_tool',
            arguments: { arg1: 'value1' },
            serverId: 'test-server',
          },
          { type: 'tool-result', id: 'call_1', result: 'ok', isError: false },
          { type: 'text', text: ' — done' },
          {
            type: 'result',
            result: {
              reply: 'Looking — done',
              toolCalls: [
                {
                  id: 'call_1',
                  type: 'function',
                  function: { name: 'test_tool', arguments: '{}' },
                },
              ],
              toolResponses: [],
            },
          },
        ) as any,
      );

      const response = await request(app)
        .post('/chat/stream')
        .send({ messages: USER_TURN, enabledTools: ['test-server'] });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe(
        'text/event-stream; charset=utf-8',
      );
      expect(response.headers['cache-control']).toBe('no-cache, no-transform');
      expect(response.headers['x-accel-buffering']).toBe('no');

      const frames = parseSse(response.text);
      expect(frames.map(frame => frame.event)).toEqual([
        'text',
        'tool-call',
        'tool-result',
        'text',
        'complete',
      ]);

      // The tool-call event precedes the result bearing the same id.
      const callIndex = frames.findIndex(f => f.event === 'tool-call');
      const resultIndex = frames.findIndex(f => f.event === 'tool-result');
      expect(callIndex).toBeLessThan(resultIndex);
      expect(frames[callIndex].data.id).toBe(frames[resultIndex].data.id);

      // Concatenating the fragments reproduces the reply.
      expect(
        frames
          .filter(f => f.event === 'text')
          .map(f => f.data.text)
          .join(''),
      ).toBe('Looking — done');

      // Exactly one terminal event, and nothing after it.
      expect(
        frames.filter(f => f.event === 'complete' || f.event === 'error'),
      ).toHaveLength(1);
      expect(frames[frames.length - 1].data).toEqual({
        type: 'complete',
        conversationId: CONVERSATION_ID,
        toolsUsed: ['test_tool'],
      });

      expect(mcpClientService.streamQuery).toHaveBeenCalledWith(
        USER_TURN,
        ['test-server'],
        expect.objectContaining({ signal: expect.anything() }),
      );
    });

    it('terminates with a failure event when the provider fails after partial output, without retracting fragments', async () => {
      mcpClientService.streamQuery.mockImplementation((() =>
        (async function* () {
          yield { type: 'text', text: 'Partial answer' };
          throw new Error('provider exploded');
        })()) as any);

      const response = await request(app)
        .post('/chat/stream')
        .send({ messages: USER_TURN });

      const frames = parseSse(response.text);
      expect(frames.map(frame => frame.event)).toEqual(['text', 'error']);
      expect(frames[0].data.text).toBe('Partial answer');
      expect(frames[1].data).toEqual({
        type: 'error',
        message: 'provider exploded',
      });
      expect(conversationStore.saveConversation).not.toHaveBeenCalled();
    });
  });

  describe('the request is invalid', () => {
    // Every payload the single-response endpoint rejects, so both endpoints are
    // held to one validation contract.
    const invalidPayloads: [string, any][] = [
      ['missing messages', {}],
      ['messages not an array', { messages: 'nope' }],
      ['empty messages', { messages: [] }],
      [
        'last message not from user',
        {
          messages: [
            { role: 'user', content: 'a' },
            { role: 'assistant', content: 'b' },
          ],
        },
      ],
      ['invalid role', { messages: [{ role: 'wizard', content: 'a' }] }],
      [
        'enabledTools not an array',
        { messages: USER_TURN, enabledTools: 'nope' },
      ],
      [
        'enabledTools not all strings',
        { messages: USER_TURN, enabledTools: [1] },
      ],
      [
        'malformed conversation id',
        { messages: USER_TURN, conversationId: 'not-a-uuid' },
      ],
    ];

    it.each(invalidPayloads)(
      'rejects %s identically on both endpoints, before opening a stream',
      async (_label, payload) => {
        const streamed = await request(app).post('/chat/stream').send(payload);
        const single = await request(app).post('/chat').send(payload);

        expect(streamed.status).toBe(400);
        expect(streamed.status).toBe(single.status);
        expect(streamed.body).toEqual(single.body);
        // No stream was opened: this is a plain JSON error response.
        expect(streamed.headers['content-type']).toMatch(/application\/json/);
        expect(mcpClientService.streamQuery).not.toHaveBeenCalled();
      },
    );
  });

  describe('authorization and persistence parity', () => {
    beforeEach(() => {
      mcpClientService.streamQuery.mockImplementation(
        streamOf(
          { type: 'text', text: 'Reply' },
          {
            type: 'result',
            result: { reply: 'Reply', toolCalls: [], toolResponses: [] },
          },
        ) as any,
      );
    });

    it('stores the conversation for an authenticated user and reports its id, generating a title for a new one', async () => {
      const response = await request(app)
        .post('/chat/stream')
        .send({ messages: USER_TURN });

      const frames = parseSse(response.text);
      expect(frames[frames.length - 1].data).toEqual({
        type: 'complete',
        conversationId: CONVERSATION_ID,
        toolsUsed: [],
      });
      expect(conversationStore.saveConversation).toHaveBeenCalledWith(
        'user:default/mock',
        [...USER_TURN, { role: 'assistant', content: 'Reply' }],
        undefined,
        undefined,
      );

      // Title generation is fire-and-forget for a newly created conversation.
      await new Promise(resolve => setImmediate(resolve));
      await new Promise(resolve => setImmediate(resolve));
      expect(summarizationService.summarizeConversation).toHaveBeenCalled();
      expect(conversationStore.updateTitle).toHaveBeenCalledWith(
        'user:default/mock',
        CONVERSATION_ID,
        'Test Title',
      );
    });

    it('stores nothing for a guest and completes without a conversation id', async () => {
      httpAuth.credentials.mockResolvedValue({
        principal: { type: 'user', userEntityRef: 'user:development/guest' },
      } as any);

      const response = await request(app)
        .post('/chat/stream')
        .send({ messages: USER_TURN });

      const frames = parseSse(response.text);
      expect(frames.map(f => f.event)).toEqual(['text', 'complete']);
      expect(frames[1].data).toEqual({ type: 'complete', toolsUsed: [] });
      expect(conversationStore.saveConversation).not.toHaveBeenCalled();
    });

    it('still reaches the completion event when persistence fails', async () => {
      conversationStore.saveConversation.mockRejectedValue(
        new Error('database is on fire'),
      );

      const response = await request(app)
        .post('/chat/stream')
        .send({ messages: USER_TURN });

      const frames = parseSse(response.text);
      expect(response.status).toBe(200);
      expect(frames.map(f => f.event)).toEqual(['text', 'complete']);
      expect(frames[0].data.text).toBe('Reply');
      expect(frames[1].data).toEqual({ type: 'complete', toolsUsed: [] });
    });
  });

  describe('cancellation and disconnection', () => {
    it('stores nothing when a run ends without reaching its terminal chunk', async () => {
      // An aborted run yields no result chunk — the route must not persist it.
      mcpClientService.streamQuery.mockImplementation(
        streamOf({ type: 'text', text: 'Partial' }) as any,
      );

      const response = await request(app)
        .post('/chat/stream')
        .send({ messages: USER_TURN });

      const frames = parseSse(response.text);
      expect(frames.map(f => f.event)).toEqual(['text']);
      expect(conversationStore.saveConversation).not.toHaveBeenCalled();
    });

    it('aborts the run when the client disconnects mid-stream', async () => {
      let signal: AbortSignal | undefined;
      const aborted = new Promise<void>(resolve => {
        mcpClientService.streamQuery.mockImplementation(((
          _messages: any,
          _enabled: any,
          options: any,
        ) =>
          (async function* () {
            signal = options.signal;
            yield { type: 'text', text: 'Partial' };
            // Hold the run open until the client goes away.
            await new Promise<void>(done => {
              signal!.addEventListener('abort', () => {
                resolve();
                done();
              });
            });
            // No result chunk: the run was abandoned.
          })()) as any);
      });

      const server = http.createServer(app);
      await new Promise<void>(resolve => server.listen(0, resolve));
      const { port } = server.address() as AddressInfo;

      const body = JSON.stringify({ messages: USER_TURN });
      const clientRequest = http.request({
        port,
        path: '/chat/stream',
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(body),
        },
      });

      clientRequest.on('error', () => {
        /* destroying the request is the point of this test */
      });
      clientRequest.on('response', res => {
        // Drop the connection as soon as the first fragment arrives.
        res.once('data', () => clientRequest.destroy());
      });
      clientRequest.end(body);

      await aborted;

      expect(signal?.aborted).toBe(true);
      expect(conversationStore.saveConversation).not.toHaveBeenCalled();

      await new Promise<void>(resolve => server.close(() => resolve()));
    });
  });
});
