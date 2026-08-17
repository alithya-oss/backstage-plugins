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

import { createLlmProviderModule } from '@alithya-oss/backstage-plugin-mcp-chat-node';
import { AgentGatewayProvider } from './AgentGatewayProvider';

/**
 * Backend module that registers the Agent Gateway LLM provider
 * with the mcp-chat backend plugin.
 *
 * @public
 */
export default createLlmProviderModule({
  providerId: 'agentgateway',
  defaultBaseUrl: 'http://localhost:5555/v1',
  providerFactory: config => new AgentGatewayProvider(config),
});
