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

/**
 * One MCP tool invocation belonging to an assistant turn.
 *
 * An invocation is recorded when its tool-call event arrives, before its
 * outcome exists: `result` and `isError` stay absent until the matching
 * tool-result event lands. That absence is what the tool rendering reads as
 * "still running".
 */
export interface PromptToolInvocation {
  /** Correlation id shared by the tool-call and tool-result events */
  id: string;
  /** Name of the invoked tool */
  name: string;
  /** Arguments the tool was invoked with */
  arguments: Record<string, unknown>;
  /** ID of the MCP server running the tool */
  serverId: string;
  /** Outcome, or the error detail when `isError` is true. Absent while running. */
  result?: string;
  /** Whether the invocation failed. Absent while running. */
  isError?: boolean;
}

/**
 * Lifecycle of an assistant turn.
 *
 * `error` and `cancelled` both keep whatever text had arrived — the turn is
 * marked interrupted rather than retracted.
 */
export type PromptTurnStatus =
  | { type: 'running' }
  | { type: 'complete' }
  | { type: 'cancelled' }
  | { type: 'error'; message: string };

/**
 * One turn of the prompt page conversation, and the single source of truth the
 * external store adapter converts for the runtime.
 */
export interface PromptTurn {
  /** Stable id, used as the runtime message id */
  id: string;
  role: 'user' | 'assistant';
  /** Text accumulated so far — the concatenation of the fragments received */
  text: string;
  /** Tool invocations of an assistant turn, in the order they started */
  invocations?: PromptToolInvocation[];
  /** Lifecycle of an assistant turn. Absent on a user turn. */
  status?: PromptTurnStatus;
}

/**
 * Why a run failed.
 *
 * `provider` is a failure the run itself reported through the stream;
 * `transport` is a failure that prevented the stream, such as an unreachable
 * backend or a backend too old to serve the streaming route. The page words the
 * two differently, so the distinction is kept rather than flattened to a
 * message.
 */
export interface PromptThreadError {
  kind: 'provider' | 'transport';
  message: string;
}
