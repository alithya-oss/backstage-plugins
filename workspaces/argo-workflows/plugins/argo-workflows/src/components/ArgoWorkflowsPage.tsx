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

import React from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import {
  ARGO_WORKFLOWS_NAMESPACE_ANNOTATION,
  ARGO_WORKFLOWS_LABEL_SELECTOR_ANNOTATION,
} from '@backstage-community/plugin-argo-workflows-common';
import { useArgoWorkflows } from '../hooks';
import { WorkflowTable } from './WorkflowTable';
import { WorkflowEmptyState } from './EmptyState';
import { ErrorBoundary } from './ErrorBoundary';

function PageErrorFallback() {
  return (
    <div data-testid="page-error-fallback">
      <p>Something went wrong loading Argo Workflows.</p>
      <button type="button" onClick={() => window.location.reload()}>
        Try refreshing the page
      </button>
    </div>
  );
}

/** @public */
export const ArgoWorkflowsPage = () => {
  const { entity } = useEntity();
  const { workflows, loading, error, lastUpdated } = useArgoWorkflows(entity);

  const namespace =
    entity.metadata.annotations?.[ARGO_WORKFLOWS_NAMESPACE_ANNOTATION]?.trim() ||
    undefined;
  const labelSelector =
    entity.metadata.annotations?.[ARGO_WORKFLOWS_LABEL_SELECTOR_ANNOTATION]?.trim() ||
    undefined;

  if (error) {
    return (
      <ErrorBoundary fallback={<PageErrorFallback />}>
        <WorkflowEmptyState
          error={error}
          namespace={namespace}
          labelSelector={labelSelector}
        />
      </ErrorBoundary>
    );
  }

  if (!loading && workflows.length === 0) {
    return (
      <ErrorBoundary fallback={<PageErrorFallback />}>
        <WorkflowEmptyState
          workflowCount={0}
          namespace={namespace}
          labelSelector={labelSelector}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary fallback={<PageErrorFallback />}>
      <WorkflowTable
        workflows={workflows}
        loading={loading}
        lastUpdated={lastUpdated}
      />
    </ErrorBoundary>
  );
};
