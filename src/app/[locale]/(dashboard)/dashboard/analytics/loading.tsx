/**
 * Analytics loading state
 *
 * Shown while the analytics page is loading.
 * Matches the analytics layout with overview, chart, and widget grids.
 */

export default function AnalyticsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Page heading skeleton */}
      <div>
        <div className="h-7 w-48 animate-pulse rounded bg-surface-raised" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-surface-raised" />
      </div>

      {/* KPI overview cards — 5 columns on desktop */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-surface p-5"
          >
            <div className="mb-3 h-9 w-9 animate-pulse rounded bg-surface-raised" />
            <div className="h-3 w-20 animate-pulse rounded bg-surface-raised mb-2" />
            <div className="h-7 w-16 animate-pulse rounded bg-surface-raised" />
          </div>
        ))}
      </div>

      {/* Engagement chart skeleton — full width */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-5 w-36 animate-pulse rounded bg-surface-raised" />
          <div className="flex gap-2">
            <div className="h-7 w-14 animate-pulse rounded bg-surface-raised" />
            <div className="h-7 w-14 animate-pulse rounded bg-surface-raised" />
          </div>
        </div>
        <div className="h-64 w-full animate-pulse rounded bg-surface-raised" />
      </div>

      {/* Platform comparison + Heatmap */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="h-5 w-36 animate-pulse rounded bg-surface-raised mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 animate-pulse rounded bg-surface-raised" />
                <div className="flex-1">
                  <div className="h-3 w-20 animate-pulse rounded bg-surface-raised mb-2" />
                  <div className="h-2 w-full animate-pulse rounded bg-surface-raised" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="h-5 w-28 animate-pulse rounded bg-surface-raised mb-4" />
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 49 }).map((_, i) => (
              <div key={i} className="h-6 w-full animate-pulse rounded bg-surface-raised" />
            ))}
          </div>
        </div>
      </div>

      {/* Content performance + Top posts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="h-5 w-36 animate-pulse rounded bg-surface-raised mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 w-full animate-pulse rounded bg-surface-raised" />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="h-5 w-24 animate-pulse rounded bg-surface-raised mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 animate-pulse rounded bg-surface-raised" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-surface-raised" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-surface-raised" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
