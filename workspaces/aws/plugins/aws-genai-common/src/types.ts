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
 * @public
 */
export interface ChatRequest {
  userMessage: string;
  sessionId: string | undefined;
  agentName: string;
  /**
   * Names of the agent's configured actions this run may use.
   *
   * Omitted means every action the agent's allowlist grants, which is the
   * behaviour of a client that predates this field. An empty array means the
   * run is offered no action at all.
   */
  enabledActions?: string[];
  /**
   * Types of the search indexes the run's tools may read.
   *
   * Omitted means no restriction is applied, which is the behaviour of a client
   * that predates this field. An empty array withholds every tool that reads a
   * search index.
   */
  enabledSearchIndexes?: string[];
  /**
   * Declares the caller understands `ToolResultEvent` and the invocation `id`
   * on `ToolEvent`.
   *
   * Left unset, the stream carries exactly the event shapes it carried before
   * those were added, because a client parses events with a strict
   * discriminated union that throws on an unknown type.
   */
  toolResults?: boolean;
}

/**
 * @public
 */
export interface GenerateRequest {
  prompt: string;
  agentName: string;
  responseFormat?: Record<string, any>;
}

/**
 * @public
 */
export interface AgentRequestOptions {
  token: string;
}

/**
 * @public
 */
export interface SyncResponse {
  sessionId: string;
  output: any;
}

/**
 * @public
 */
export interface GenerateResponse {
  output: any;
}

/**
 * @public
 */
export interface EndSessionRequest {
  sessionId: string;
  agentName: string;
}

/**
 * @public
 */
export interface ChatSession {
  sessionId: string;
  principal: string;
  agent: string;
  created: Date;
  lastActivity: Date;
  ended?: Date;
}

/**
 * One of the agent's tools, as advertised by the tool catalogue.
 *
 * @public
 */
export interface AgentToolDescriptor {
  /** Name of the underlying action, as named by the agent's allowlist. */
  name: string;
  title: string;
  description?: string;
}

/**
 * One search index the agent's tools may reach, as advertised by the index
 * catalogue.
 *
 * @public
 */
export interface SearchIndexDescriptor {
  /** Search index type, as a Backstage search collator declares it. */
  type: string;
  title: string;
  /** Whether any tool the agent's allowlist grants reads this index. */
  covered: boolean;
}

/**
 * A tool invocation recorded against a stored turn.
 *
 * @public
 */
export interface ToolInvocation {
  id: string;
  name: string;
  input: string;
  /** Absent while the outcome is unknown, or for a run that was interrupted. */
  output?: string;
  isError?: boolean;
}

/**
 * @public
 */
export type ConversationRole = 'user' | 'assistant';

/**
 * One stored turn of a conversation.
 *
 * @public
 */
export interface ConversationTurn {
  role: ConversationRole;
  content: string;
  toolInvocations?: ToolInvocation[];
  /**
   * Set on an assistant turn whose run failed after producing some text, so a
   * reader can tell a truncated answer from a complete one.
   */
  interrupted?: boolean;
}

/**
 * One of the signed-in user's conversations, as advertised by the conversation
 * list.
 *
 * @public
 */
export interface ConversationSummary {
  sessionId: string;
  /** Derived from the first prompt of the session, once it has one. */
  title?: string;
  /** ISO 8601 timestamp of the conversation's most recent activity. */
  lastActivity: string;
  /** ISO 8601 timestamp, set once the conversation was ended. */
  ended?: string;
}
