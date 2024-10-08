/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *   http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  GetPipelineStateOutput,
  PipelineExecutionSummary,
} from '@aws-sdk/client-codepipeline';

/** @public */
export const AWS_CODEPIPELINE_ARN_ANNOTATION =
  'aws.amazon.com/aws-codepipeline-arn';

/** @public */
export const AWS_CODEPIPELINE_TAGS_ANNOTATION =
  'aws.amazon.com/aws-codepipeline-tags';

/** @public */
export const AWS_CODEPIPELINE_ARN_ANNOTATION_LEGACY =
  'aws.amazon.com/aws-codepipeline';

/** @public */
export interface PipelineExecutions {
  pipelineExecutions: Array<PipelineExecutionSummary>;
  pipelineName: string;
  pipelineArn: string;
  pipelineRegion: string;
}

/** @public */
export interface PipelineExecutionsResponse {
  pipelineExecutions: Array<PipelineExecutions>;
}

/** @public */
export interface PipelineState {
  pipelineName: string;
  pipelineArn: string;
  pipelineRegion: string;
  pipelineState: GetPipelineStateOutput;
}

/** @public */
export interface PipelineStateResponse {
  pipelines: Array<PipelineState>;
}
