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

import { createExtensionPoint } from '@backstage/backend-plugin-api';
import { StructuredToolInterface } from '@langchain/core/tools';
import { AgentTypeFactory } from './types';

/**
 * @public
 */
export interface AgentToolExtensionPoint {
  addTools(...tools: StructuredToolInterface[]): void;
}

/**
 * @public
 */
export const agentToolExtensionPoint =
  createExtensionPoint<AgentToolExtensionPoint>({
    id: 'aws-genai.function',
  });

/**
 * @public
 */
export interface AgentTypeExtensionPoint {
  addAgentType(factory: AgentTypeFactory): void;
}

/**
 * @public
 */
export const agentTypeExtensionPoint =
  createExtensionPoint<AgentTypeExtensionPoint>({
    id: 'aws-genai.agent-type',
  });
