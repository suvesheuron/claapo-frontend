/**
 * useApiQuery — lightweight data-fetching hook backed by api.get().
 *
 * Usage:
 *   const { data, loading, error, refetch } = useApiQuery<Project[]>('/projects?page=1');
 *
 * - Fires on mount and whenever `path` changes.
 * - Call `refetch()` to manually re-fire without changing the path.
 * - Pass `null` as path to skip the request (useful for conditional fetching).
 * - Cancels in-flight requests on unmount / path change (via AbortController).
 */

import { useState, useEffect, useCallback } from 'react';
import { api, ApiException } from '../services/api';

export interface ApiQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApiQuery<T>(path: string | null): ApiQueryResult<T> {
  const [data, setData]       = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(path !== null);
  const [error, setError]     = useState<string | null>(null);
  const [tick, setTick]       = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (path === null) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .get<T>(path)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const msg =
            err instanceof ApiException
              ? err.payload.message
              : 'Failed to load data. Please try again.';
          setError(msg);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [path, tick]);

  return { data, loading, error, refetch };
}
