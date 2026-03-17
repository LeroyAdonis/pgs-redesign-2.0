"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * Lightweight data-fetching hook for analytics widgets.
 *
 * Returns typed data, loading, and error state. Fetches once on mount.
 * Each widget uses this instead of duplicating the fetch/state boilerplate.
 */
export function useAnalyticsFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Core fetch logic — only uses async callbacks so it's safe inside effects. */
  const doFetch = useCallback(() => {
    fetch(url, { credentials: "include" })
      .then((res) => {
        if (res.status === 401) {
          throw new Error("Please log in to view analytics.");
        }
        if (!res.ok) throw new Error(`Failed to fetch analytics (${res.status})`);
        return res.json() as Promise<{ success: boolean; data: T; error?: string }>;
      })
      .then((json) => {
        if (!json.success) throw new Error(json.error ?? "Unknown error");
        setData(json.data);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Failed to load data";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [url]);

  /** Public refetch — resets loading/error state then fetches. */
  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    doFetch();
  }, [doFetch]);

  // Initial fetch on mount — loading & error already have correct initial values
  useEffect(() => {
    doFetch();
  }, [doFetch]);

  return { data, loading, error, refetch } as const;
}
