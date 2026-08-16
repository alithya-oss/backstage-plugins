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

export interface Config {
  /** Configuration options for the MCP Chat plugin */
  mcpChat?: {
    /**
     * AI/LLM providers configuration
     * @visibility backend
     */
    providers?: Array<{
      /**
       * Unique identifier for the provider
       * @visibility backend
       */
      id: string;
      /**
       * API token for the provider
       * @visibility secret
       */
      token?: string;
      /**
       * Model name to use for this provider
       * @visibility backend
       */
      model: string;
      /**
       * Base URL for the Azure OpenAI resource endpoint
       * @visibility backend
       */
      baseUrl?: string;
      /**
       * Azure OpenAI deployment name
       * @visibility backend
       */
      deploymentName?: string;
      /**
       * Maximum number of tokens to generate in the response
       * @visibility backend
       */
      maxTokens?: number;
      /**
       * Sampling temperature for response generation (0.0 to 2.0)
       * @visibility backend
       */
      temperature?: number;
    }>;
  };
}
