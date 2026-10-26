import { useCallback, useEffect, useRef, useState } from "react";

interface UseGuardedRequestResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /**
   * For caller-initiated errors outside the request lifecycle (e.g. a failed
   * export). Any new request clears it, like the original local state did.
   */
  setError: (error: string | null) => void;
}

/**
 * Runs an async request on mount and whenever `deps` change, guarding against
 * out-of-order responses: only the newest request may write data, error or
 * loading, so a slow response for an older set of parameters can never
 * overwrite the result of a newer one.
 */
export function useGuardedRequest<T>(
  fetcher: () => Promise<T>,
  errorMessage: string,
  deps: readonly unknown[],
): UseGuardedRequestResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guard against out-of-order responses: only the newest request may write state.
  const requestIdRef = useRef(0);

  // Keep the latest fetcher without adding it to the request effect's deps.
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const request = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      if (requestId !== requestIdRef.current) return;
      setData(result);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setError(errorMessage);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [errorMessage]);

  useEffect(() => {
    request();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are caller-supplied, like useEffect itself
  }, deps);

  return { data, loading, error, refetch: request, setError };
}
