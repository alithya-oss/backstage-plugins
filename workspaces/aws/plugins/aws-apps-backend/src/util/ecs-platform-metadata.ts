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

// This file is Amazon Web Services Content and may not be duplicated or distributed without permission.

import { parse } from '@aws-sdk/util-arn-parser';

const METADATA_ENDPOINT_V4 = process.env
  .ECS_CONTAINER_METADATA_URI_V4 as string;

/**
 * Get a value from the ECS Container metadata endpoint for a given key
 * See ECS metadata documentation for supported keys: @see https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-metadata-endpoint-v4-fargate.html
 */
export async function getECSContainerMetadata(key: string): Promise<any> {
  // return the value of the key from the metadata endpoint
  const response = await fetch(METADATA_ENDPOINT_V4);
  const json = await response.json();
  return json[key];
}

/**
 * Get a value from the ECS Task metadata endpoint for a given key
 * See ECS metadata documentation for supported keys: @see https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-metadata-endpoint-v4-fargate.html
 */
export async function getECSTaskMetadata(key: string): Promise<any> {
  // return the value of the key from the task metadata endpoint
  const response = await fetch(`${METADATA_ENDPOINT_V4}/task`);
  const json = await response.json();
  return json[key];
}

/**
 * Get the region for the current ECS task
 * @returns a string representing the AWS region where the task is running
 */
export async function getECSTaskRegion(): Promise<string> {
  const taskARN = await getECSTaskMetadata('TaskARN');
  const { region } = parse(taskARN);
  return region;
}
