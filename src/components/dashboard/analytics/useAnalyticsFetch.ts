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

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);

    fetch(url)
      .then((res) => {
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

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch } as const;
}
