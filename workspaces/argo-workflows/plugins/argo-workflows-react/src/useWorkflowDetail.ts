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

import { useCallback } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import {
  argoWorkflowsApiRef,
  type WorkflowDetail,
} from '@alithya-oss/backstage-plugin-argo-workflows-common';
import { usePolling } from './usePolling';

const DETAIL_POLL_INTERVAL_MS = 5000;
const TERMINAL_PHASES = new Set(['Succeeded', 'Failed', 'Error']);

/**
 * Hook that fetches a single Argo Workflow's full detail with polling.
 *
 * Polls at 5-second intervals while the workflow is running.
 * Polling stops automatically when the workflow reaches a terminal state.
 *
 * @public
 */
export function useWorkflowDetail(
  namespace: string,
  name: string,
): {
  workflow: WorkflowDetail | null;
  loading: boolean;
  error: Error | null;
} {
  const api = useApi(argoWorkflowsApiRef);

  const fetchFn = useCallback(
    () => api.getWorkflow(namespace, name),
    [api, namespace, name],
  );

  const { data, loading, error } = usePolling<WorkflowDetail>(
    fetchFn,
    DETAIL_POLL_INTERVAL_MS,
    { stopWhen: d => TERMINAL_PHASES.has(d.phase) },
  );

  return { workflow: data, loading, error };
}
