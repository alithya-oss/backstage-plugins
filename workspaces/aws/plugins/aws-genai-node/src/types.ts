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

import {
  BackstageCredentials,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { CompoundEntityRef } from '@backstage/catalog-model';
import { ToolInterface } from '@langchain/core/tools';
import {
  ChatEvent,
  GenerateResponse,
} from '@alithya-oss/backstage-plugins-aws-genai-common';
import { Config } from '@backstage/config';
import { ActionsServiceAction } from '@backstage/backend-plugin-api/alpha';
import { PeerAgentToolInstance } from './peerAgent';

/**
 * @public
 */
export interface AgentType {
  stream(
    userMessage: string,
    sessionId: string,
    newSession: boolean,
    agentActions: ActionsServiceAction[],
    peerAgentTools: PeerAgentToolInstance[],
    logger: LoggerService,
    options: {
      userEntityRef?: CompoundEntityRef;
      credentials: BackstageCredentials;
      signal?: AbortSignal;
    },
  ): Promise<ReadableStream<ChatEvent>>;

  generate(
    prompt: string,
    sessionId: string,
    agentActions: ActionsServiceAction[],
    peerAgentTools: PeerAgentToolInstance[],
    logger: LoggerService,
    options: {
      responseFormat?: Record<string, any>;
      userEntityRef?: CompoundEntityRef;
      credentials: BackstageCredentials;
    },
  ): Promise<GenerateResponse>;
}

/**
 * @public
 */
export interface AgentTypeFactory {
  create(agentConfig: AgentConfig, tools: ToolInterface[]): Promise<AgentType>;

  getTypeName(): string;
}

/**
 * @public
 */
export interface GenAIConfig {
  registerCoreActions: boolean;
}

/**
 * @public
 */
export interface AgentConfig {
  name: string;
  description: string;
  prompt: string;
  type?: string;
  tools: string[];
  actions: string[];
  peerAgents: string[];
  config: Config;
}

/**
 * @public
 */
export interface PeerAgentRunner {
  invoke(
    name: string,
    query: string,
    credentials: BackstageCredentials,
    signal?: AbortSignal,
  ): Promise<PeerAgentResponse>;
}

/**
 * @public
 */
export interface PeerAgentResponse {
  output: string;
}
