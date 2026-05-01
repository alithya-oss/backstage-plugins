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

import { useState, useEffect, useCallback } from 'react';
import {
  useApi,
  fetchApiRef,
  discoveryApiRef,
} from '@backstage/core-plugin-api';
import { parseWorkflow } from '@backstage-community/plugin-argo-workflows-common';
import type { Workflow } from '@backstage-community/plugin-argo-workflows-common';

/**
 * Hook to fetch the list of Argo Workflows filtered by label selector.
 *
 * Calls `GET /api/argo-workflows/workflows` with the provided parameters.
 *
 * @param options - The query options
 * @param options.labelSelector - Kubernetes label selector to filter workflows
 * @param options.instanceName - Optional Argo Workflows instance name
 * @returns An object with workflows, loading state, error, and retry function
 *
 * @public
 */
export function useArgoWorkflows(options: {
  labelSelector: string;
  instanceName?: string;
}): {
  workflows: Workflow[];
  loading: boolean;
  error: Error | undefined;
  retry: () => void;
} {
  const { labelSelector, instanceName } = options;
  const fetchApi = useApi(fetchApiRef);
  const discoveryApi = useApi(discoveryApiRef);

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [retryCount, setRetryCount] = useState<number>(0);

  const retry = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchWorkflows() {
      setLoading(true);
      setError(undefined);

      try {
        const baseUrl = await discoveryApi.getBaseUrl('argo-workflows');
        const params = new URLSearchParams();
        params.set('labelSelector', labelSelector);
        if (instanceName) {
          params.set('instanceName', instanceName);
        }

        const response = await fetchApi.fetch(
          `${baseUrl}/workflows?${params.toString()}`,
        );

        if (!response.ok) {
          const body = await response.text();
          throw new Error(
            `Failed to fetch workflows: ${response.status} ${
              response.statusText
            }${body ? ` - ${body}` : ''}`,
          );
        }

        const data = await response.json();
        const rawWorkflows: Record<string, unknown>[] = Array.isArray(
          data.workflows,
        )
          ? data.workflows
          : [];

        const parsed = rawWorkflows.map(raw => parseWorkflow(raw));

        if (!cancelled) {
          setWorkflows(parsed);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setWorkflows([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchWorkflows();

    return () => {
      cancelled = true;
    };
  }, [labelSelector, instanceName, fetchApi, discoveryApi, retryCount]);

  return { workflows, loading, error, retry };
}
