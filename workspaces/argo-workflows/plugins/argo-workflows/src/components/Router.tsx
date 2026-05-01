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

import { useEntity } from '@backstage/plugin-catalog-react';
import {
  isArgoWorkflowsAvailable,
  ARGO_WORKFLOWS_LABEL_SELECTOR_ANNOTATION,
  ARGO_WORKFLOWS_INSTANCE_ANNOTATION,
} from '@backstage-community/plugin-argo-workflows-common';
import { WorkflowRunsTable } from './WorkflowRunsTable';

/**
 * Router component for the Argo Workflows plugin.
 *
 * Uses the entity context to check if the Argo Workflows annotation is present.
 * If the annotation is present, renders the workflow runs table with inline
 * expandable DAG views. Returns null if the annotation is absent.
 */
export const Router = () => {
  const { entity } = useEntity();

  if (!isArgoWorkflowsAvailable(entity)) {
    return null;
  }

  const labelSelector =
    entity.metadata.annotations?.[ARGO_WORKFLOWS_LABEL_SELECTOR_ANNOTATION] ??
    '';
  const instanceName =
    entity.metadata.annotations?.[ARGO_WORKFLOWS_INSTANCE_ANNOTATION];

  return (
    <WorkflowRunsTable
      labelSelector={labelSelector}
      instanceName={instanceName}
    />
  );
};
