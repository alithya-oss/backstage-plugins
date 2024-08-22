/*
 * Copyright 2024 Larder Software Limited
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
  /**
   * AWS Bedrock Embeddings configuration
   *
   */
  ai: {
    query:
      | {
          awsBedrock: {
            /**
             * Name of the Bedrock model to use to create Embeddings
             *
             * Defaults to `amazon.titan-embed-text-v1`
             */
            modelName: string;
            /**
             * AWS region where the model is enabled
             *
             * Defaults to `us-east-1`
             */
            region: string;
            /**
             * The maximum number of tokens allowed in the generated response.
             * See: https://docs.aws.amazon.com/bedrock/latest/APIReference/API_agent-runtime_InferenceConfiguration.html
             *
             * Defaults to `4096`
             */
            maxTokens: number;
          };
        }
      | {
          bedrock: {
            /**
             * Name of the Bedrock model to use to create Embeddings
             *
             * Defaults to `amazon.titan-embed-text-v1`
             */
            modelName: string;
            /**
             * AWS region where the model is enabled
             *
             * Defaults to `us-east-1`
             */
            region: string;
            /**
             * The maximum number of tokens allowed in the generated response.
             * See: https://docs.aws.amazon.com/bedrock/latest/APIReference/API_agent-runtime_InferenceConfiguration.html
             *
             * Defaults to `4096`
             */
            maxTokens: number;
          };
        };
    embeddings:
      | {
          awsBedrock: {
            /**
             * Name of the Bedrock model to use to create Embeddings
             *
             * Defaults to `amazon.titan-embed-text-v1`
             */
            modelName: string;
            /**
             * AWS region where the model is enabled
             *
             * Defaults to `us-east-1`
             */
            region: string;
            /**
             * The maximum number of tokens allowed in the generated response.
             * See: https://docs.aws.amazon.com/bedrock/latest/APIReference/API_agent-runtime_InferenceConfiguration.html
             *
             * Defaults to `4096`
             */
            maxTokens: number;
          };
        }
      | {
          bedrock: {
            /**
             * Name of the Bedrock model to use to create Embeddings
             *
             * Defaults to `amazon.titan-embed-text-v1`
             */
            modelName: string;
            /**
             * AWS region where the model is enabled
             *
             * Defaults to `us-east-1`
             */
            region: string;
            /**
             * The maximum number of tokens allowed in the generated response.
             * See: https://docs.aws.amazon.com/bedrock/latest/APIReference/API_agent-runtime_InferenceConfiguration.html
             *
             * Defaults to `4096`
             */
            maxTokens: number;
          };
        };
  };
}
