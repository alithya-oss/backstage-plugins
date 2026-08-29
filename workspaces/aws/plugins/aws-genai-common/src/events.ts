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

/**
 * Events a chat run streams.
 *
 * This is a strict discriminated union: a client throws on a `type` it does not
 * know. `ToolResultEvent`, and the `id` on `ToolEvent`, are therefore emitted
 * only to a request that set `toolResults` on its `ChatRequest` — every
 * other request sees the four shapes that predate them, unchanged.
 *
 * @public
 */
export const EventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ChunkEvent'),
    token: z.string(),
  }),
  z.object({
    type: z.literal('ResponseEvent'),
    sessionId: z.string(),
  }),
  z.object({
    type: z.literal('ToolEvent'),
    name: z.string(),
    input: z.string(),
    /**
     * Identifies the invocation, so its `ToolResultEvent` fills the invocation
     * already shown rather than showing it twice. Absent unless the request
     * opted into tool results.
     */
    id: z.string().optional(),
  }),
  z.object({
    type: z.literal('ToolResultEvent'),
    /** Identifier of the `ToolEvent` this outcome belongs to. */
    id: z.string(),
    output: z.string(),
    isError: z.boolean(),
  }),
  z.object({
    type: z.literal('ErrorEvent'),
    message: z.string(),
  }),
]);

/**
 * @public
 */
export type ChatEvent = z.TypeOf<typeof EventSchema>;
