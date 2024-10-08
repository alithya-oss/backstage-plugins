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

import { Cluster, Service, Task } from '@aws-sdk/client-ecs';

/** @public */
export const AWS_ECS_SERVICE_ARN_ANNOTATION =
  'aws.amazon.com/amazon-ecs-service-arn';

/** @public */
export const AWS_ECS_SERVICE_TAGS_ANNOTATION =
  'aws.amazon.com/amazon-ecs-service-tags';

/** @public */
export interface ServicesResponse {
  clusters: Array<ClusterResponse>;
}

/** @public */
export interface ClusterResponse {
  services: Array<ServiceResponse>;
  cluster: Cluster;
}

/** @public */
export interface ServiceResponse {
  tasks: Array<Task>;
  service: Service;
}
