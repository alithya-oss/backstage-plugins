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

import { useCallback, useMemo } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import type { Entity } from '@backstage/catalog-model';
import {
  argoWorkflowsApiRef,
  ARGO_WORKFLOWS_NAMESPACE_ANNOTATION,
  ARGO_WORKFLOWS_LABEL_SELECTOR_ANNOTATION,
} from '@backstage-community/plugin-argo-workflows-common';
import type { WorkflowSummary } from '@backstage-community/plugin-argo-workflows-common';
import { usePolling } from './usePolling';

const POLL_INTERVAL_MS = 30000;

/**
 * Hook that fetches Argo Workflows for a Backstage entity based on its annotations.
 *
 * @public
 */
export function useArgoWorkflows(entity: Entity): {
  workflows: WorkflowSummary[];
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
} {
  const api = useApi(argoWorkflowsApiRef);

  const rawNamespace =
    entity.metadata.annotations?.[ARGO_WORKFLOWS_NAMESPACE_ANNOTATION];
  const rawLabelSelector =
    entity.metadata.annotations?.[ARGO_WORKFLOWS_LABEL_SELECTOR_ANNOTATION];

  // Trim and validate - empty/whitespace strings are treated as missing
  const namespace = rawNamespace?.trim() || undefined;
  const labelSelector = rawLabelSelector?.trim() || undefined;

  const fetchFn = useCallback(
    () => api.listWorkflows(namespace!, labelSelector),
    [api, namespace, labelSelector],
  );

  const missingNamespaceError = useMemo(
    () =>
      !namespace
        ? new Error(
            `Missing ${ARGO_WORKFLOWS_NAMESPACE_ANNOTATION} annotation on entity ${entity.metadata.name}`,
          )
        : null,
    [namespace, entity.metadata.name],
  );

  const { data, loading, error, lastUpdated } = usePolling<WorkflowSummary[]>(
    fetchFn,
    POLL_INTERVAL_MS,
    { enabled: !!namespace },
  );

  return {
    workflows: data ?? [],
    loading,
    error: missingNamespaceError ?? error,
    lastUpdated,
  };
}
