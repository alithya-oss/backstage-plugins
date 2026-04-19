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

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Generic polling hook that fetches data at a configurable interval.
 *
 * @public
 */
export function usePolling<T>(
  fetchFn: () => Promise<T>,
  intervalMs: number,
  options?: { enabled?: boolean; stopWhen?: (data: T) => boolean },
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
} {
  // Validate interval
  if (intervalMs <= 0 || !Number.isFinite(intervalMs)) {
    throw new Error('intervalMs must be a positive finite number');
  }

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchFnRef = useRef(fetchFn);
  const stopWhenRef = useRef(options?.stopWhen);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  const initialFetchDoneRef = useRef(false);
  const stoppedRef = useRef(false);

  // Keep refs in sync with latest values
  fetchFnRef.current = fetchFn;
  stopWhenRef.current = options?.stopWhen;

  const enabled = options?.enabled ?? true;

  const clearPollingInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const executeFetch = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      const result = await fetchFnRef.current();
      if (!isMountedRef.current) return;

      setData(result);
      setLastUpdated(new Date());
      setError(null);

      if (stopWhenRef.current?.(result)) {
        stoppedRef.current = true;
        clearPollingInterval();
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [clearPollingInterval]);

  const startPolling = useCallback(() => {
    if (stoppedRef.current) return;
    clearPollingInterval();

    intervalRef.current = setInterval(() => {
      if (document.hidden) return;
      executeFetch();
    }, intervalMs);
  }, [intervalMs, executeFetch, clearPollingInterval]);

  // Initial fetch and polling setup
  useEffect(() => {
    isMountedRef.current = true;
    initialFetchDoneRef.current = false;
    stoppedRef.current = false;

    if (!enabled) {
      setLoading(false);
      return () => {
        isMountedRef.current = false;
        clearPollingInterval();
      };
    }

    setLoading(true);

    const doInitialFetch = async () => {
      try {
        const result = await fetchFnRef.current();
        if (!isMountedRef.current) return;

        setData(result);
        setLastUpdated(new Date());
        setError(null);
        setLoading(false);
        initialFetchDoneRef.current = true;

        if (stopWhenRef.current?.(result)) {
          stoppedRef.current = true;
          return;
        }

        startPolling();
      } catch (err) {
        if (!isMountedRef.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
        initialFetchDoneRef.current = true;
        startPolling();
      }
    };

    doInitialFetch();

    return () => {
      isMountedRef.current = false;
      clearPollingInterval();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Visibility change handler — fetch immediately when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        !document.hidden &&
        initialFetchDoneRef.current &&
        !stoppedRef.current &&
        enabled
      ) {
        executeFetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [executeFetch, enabled]);

  return { data, loading, error, lastUpdated };
}
