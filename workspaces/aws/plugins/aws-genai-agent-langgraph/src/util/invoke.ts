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
  PeerAgentResponse,
  PeerAgentToolInstance,
} from '@alithya-oss/backstage-plugins-aws-genai-node';
import { Tool } from '@langchain/core/tools';

export class InvokeAgentTool extends Tool {
  static lc_name() {
    return 'InvokeAgentTool';
  }

  public readonly name: string;
  public readonly description: string;

  constructor(private readonly tool: PeerAgentToolInstance) {
    super();

    this.name = tool.getName();
    this.description = tool.getDescription();
  }

  async _call(query: string): Promise<PeerAgentResponse> {
    return this.tool.invoke(query);
  }
}
