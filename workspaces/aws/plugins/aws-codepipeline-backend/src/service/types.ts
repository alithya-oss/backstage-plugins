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

import { CompoundEntityRef } from '@backstage/catalog-model';
import {
  PipelineExecutionsResponse,
  PipelineStateResponse,
} from '@alithya-oss/backstage-plugin-aws-codepipeline-common';
import { BackstageCredentials } from '@backstage/backend-plugin-api';

/** @public */
export interface AwsCodePipelineService {
  getPipelineExecutionsByEntity(options: {
    entityRef: CompoundEntityRef;
    credentials?: BackstageCredentials;
  }): Promise<PipelineExecutionsResponse>;

  getPipelineStateByEntity(options: {
    entityRef: CompoundEntityRef;
    credentials?: BackstageCredentials;
  }): Promise<PipelineStateResponse>;
}
