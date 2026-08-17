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

import { OpenAICompatibleBase } from '@alithya-oss/backstage-plugin-mcp-chat-node';

/**
 * LiteLLM proxy provider.
 * Provides unified access to 100+ LLM APIs through LiteLLM.
 *
 * LiteLLM exposes a fully OpenAI-compatible interface, so no overrides
 * are needed beyond the provider name.
 *
 * @public
 */
export class LiteLLMProvider extends OpenAICompatibleBase {
  protected get providerName(): string {
    return 'LiteLLM';
  }
}
