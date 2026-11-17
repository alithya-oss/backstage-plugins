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

import { z } from 'zod';
import { EventSchema } from './events';

/**
 * The union as it stood before tool outcomes were added, so a test can assert
 * what a deployed client does with an event shape it does not know.
 */
const HistoricalEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ChunkEvent'), token: z.string() }),
  z.object({ type: z.literal('ResponseEvent'), sessionId: z.string() }),
  z.object({
    type: z.literal('ToolEvent'),
    name: z.string(),
    input: z.string(),
  }),
  z.object({ type: z.literal('ErrorEvent'), message: z.string() }),
]);

describe('EventSchema', () => {
  it('parses the four historical event shapes unchanged', () => {
    const historical = [
      { type: 'ChunkEvent', token: 'Hello' },
      { type: 'ResponseEvent', sessionId: 'session-1' },
      { type: 'ToolEvent', name: 'search-catalog', input: '{"term":"foo"}' },
      { type: 'ErrorEvent', message: 'boom' },
    ];

    for (const payload of historical) {
      expect(EventSchema.parse(payload)).toEqual(payload);
      // What a client that predates this change makes of the same payload.
      expect(HistoricalEventSchema.parse(payload)).toEqual(payload);
    }
  });

  it('parses a ToolEvent without an id, as a run that did not opt in emits it', () => {
    const withoutId = EventSchema.parse({
      type: 'ToolEvent',
      name: 'search-techdocs',
      input: '{"term":"bar"}',
    });

    expect(withoutId).toEqual({
      type: 'ToolEvent',
      name: 'search-techdocs',
      input: '{"term":"bar"}',
    });
    expect('id' in withoutId).toBe(false);
    expect(withoutId.type === 'ToolEvent' && withoutId.id).toBeUndefined();
  });

  it('parses a ToolEvent carrying an id and the matching ToolResultEvent', () => {
    const start = EventSchema.parse({
      type: 'ToolEvent',
      id: 'invocation-1',
      name: 'search-catalog',
      input: '{"term":"foo"}',
    });
    const success = EventSchema.parse({
      type: 'ToolResultEvent',
      id: 'invocation-1',
      output: '{"results":[]}',
      isError: false,
    });
    const failure = EventSchema.parse({
      type: 'ToolResultEvent',
      id: 'invocation-2',
      output: 'the index is unreachable',
      isError: true,
    });

    expect(start.type === 'ToolEvent' && start.id).toBe('invocation-1');
    expect(success).toEqual({
      type: 'ToolResultEvent',
      id: 'invocation-1',
      output: '{"results":[]}',
      isError: false,
    });
    expect(failure.type === 'ToolResultEvent' && failure.isError).toBe(true);
  });

  it('rejects a ToolResultEvent missing its id, output or failure flag', () => {
    expect(() =>
      EventSchema.parse({
        type: 'ToolResultEvent',
        output: 'x',
        isError: false,
      }),
    ).toThrow(z.ZodError);
    expect(() =>
      EventSchema.parse({ type: 'ToolResultEvent', id: 'i', isError: false }),
    ).toThrow(z.ZodError);
    expect(() =>
      EventSchema.parse({ type: 'ToolResultEvent', id: 'i', output: 'x' }),
    ).toThrow(z.ZodError);
  });

  it('throws on an unknown event type, which is why tool outcomes are opt-in', () => {
    // A client that predates this change does exactly this with a
    // ToolResultEvent, so the backend only emits one when the request opted in.
    expect(() =>
      HistoricalEventSchema.parse({
        type: 'ToolResultEvent',
        id: 'invocation-1',
        output: '{"results":[]}',
        isError: false,
      }),
    ).toThrow(z.ZodError);
    expect(() => EventSchema.parse({ type: 'CompleteEvent' })).toThrow(
      z.ZodError,
    );
  });
});
