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
 *
 * Optional `{ swr: true }`: stale-while-revalidate. On mount, seeds data
 * + loading=false from a tiny module-level cache keyed by `path` if present,
 * then refreshes in the background. Use for screens that reopen often
 * (conversations list, dashboards) so back-navigation feels instant.
 */

import { useState, useEffect, useCallback } from 'react';
import { api, ApiException } from '../services/api';

export interface ApiQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseApiQueryOptions {
  /**
   * When true, the response is cached in memory by `path`. On subsequent
   * mounts with the same `path`, the cached value is returned synchronously
   * (loading=false) and a fresh fetch is fired in the background to update
   * the cache + state. Bounded LRU to prevent unbounded growth.
   */
  swr?: boolean;
}

// Module-level SWR cache. Bounded LRU — newest writes go to the end of the
// Map's insertion order; we evict from the front when we exceed MAX_ENTRIES.
const swrCache = new Map<string, unknown>();
const MAX_ENTRIES = 50;

function readSwr<T>(path: string): T | undefined {
  if (!swrCache.has(path)) return undefined;
  // Touch for LRU.
  const value = swrCache.get(path) as T;
  swrCache.delete(path);
  swrCache.set(path, value);
  return value;
}

function writeSwr<T>(path: string, value: T): void {
  if (swrCache.has(path)) swrCache.delete(path);
  swrCache.set(path, value);
  while (swrCache.size > MAX_ENTRIES) {
    const oldest = swrCache.keys().next().value;
    if (oldest == null) break;
    swrCache.delete(oldest);
  }
}

/** Clear all SWR-cached responses. Call on logout. */
export function clearApiQueryCache(): void {
  swrCache.clear();
}

/**
 * Direct cache read. Use this from pages that fetch via raw api.get (i.e.
 * not via useApiQuery) so they can still benefit from the shared SWR cache.
 * Returns undefined on miss.
 */
export function readApiQueryCache<T>(path: string): T | undefined {
  return readSwr<T>(path);
}

/**
 * Direct cache write. Use after a successful raw api.get so the next consumer
 * of this URL (whether useApiQuery({ swr: true }) or another raw call) gets
 * an instant hit. No-op on falsy value.
 */
export function writeApiQueryCache<T>(path: string, value: T): void {
  if (value === undefined || value === null) return;
  writeSwr<T>(path, value);
}

export function useApiQuery<T>(
  path: string | null,
  options?: UseApiQueryOptions,
): ApiQueryResult<T> {
  const swr = options?.swr ?? false;

  // Lazy initializer reads the cache once on mount. Subsequent renders use
  // existing state — no per-render cache reads.
  const [data, setData] = useState<T | null>(() =>
    swr && path ? (readSwr<T>(path) ?? null) : null,
  );
  const initialFromCache = swr && path && readSwr<T>(path) !== undefined;
  const [loading, setLoading] = useState<boolean>(
    path !== null && !initialFromCache,
  );
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (path === null) {
      setLoading(false);
      return;
    }

    // SWR: if we have a cached value, render it immediately and refresh in
    // the background. Don't flip loading=true mid-flight — that would replace
    // the cached content with a spinner, defeating the point.
    const cached = swr ? readSwr<T>(path) : undefined;
    if (cached !== undefined) {
      setData(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);

    let cancelled = false;
    api
      .get<T>(path)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setLoading(false);
        if (swr) writeSwr(path, res);
      })
      .catch((err) => {
        if (cancelled) return;
        // On error, keep showing the cached value if we have one — the user
        // sees stale data instead of a flash of error chrome.
        if (cached === undefined) {
          const msg =
            err instanceof ApiException
              ? err.payload.message
              : 'Failed to load data. Please try again.';
          setError(msg);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [path, tick, swr]);

  return { data, loading, error, refetch };
}
