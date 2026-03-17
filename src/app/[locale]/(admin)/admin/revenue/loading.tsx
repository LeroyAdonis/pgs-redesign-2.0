/**
 * Revenue page loading state
 *
 * Skeleton UI shown while the revenue dashboard is loading.
 * Mirrors the layout of the revenue page: metric cards,
 * tier distribution panel, and trend chart.
 */

export default function RevenueLoading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div>
        <div className="h-7 w-52 animate-pulse rounded bg-slate-800" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-800/60" />
      </div>

      {/* Metric cards skeleton (4 large cards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div className="h-3 w-24 animate-pulse rounded bg-slate-800" />
                <div className="h-9 w-32 animate-pulse rounded bg-slate-800" />
                <div className="h-3 w-36 animate-pulse rounded bg-slate-800/60" />
              </div>
              <div className="h-12 w-12 animate-pulse rounded-lg bg-slate-800/60" />
            </div>
          </div>
        ))}
      </div>

      {/* Two-column skeleton: distribution + trend */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Tier distribution skeleton */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-4 w-32 animate-pulse rounded bg-slate-800" />
              <div className="h-3 w-40 animate-pulse rounded bg-slate-800/60" />
            </div>
            <div className="space-y-1 text-right">
              <div className="ml-auto h-4 w-24 animate-pulse rounded bg-slate-800" />
              <div className="ml-auto h-3 w-16 animate-pulse rounded bg-slate-800/60" />
            </div>
          </div>
          <div className="mt-5 h-4 animate-pulse rounded-full bg-slate-800" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-lg border border-slate-700/30 bg-slate-800/30"
              />
            ))}
          </div>
        </div>

        {/* Revenue trend skeleton */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-4 w-28 animate-pulse rounded bg-slate-800" />
              <div className="h-3 w-56 animate-pulse rounded bg-slate-800/60" />
            </div>
            <div className="space-y-1 text-right">
              <div className="ml-auto h-5 w-28 animate-pulse rounded bg-slate-800" />
              <div className="ml-auto h-3 w-16 animate-pulse rounded bg-slate-800/60" />
            </div>
          </div>
          <div className="mt-6 flex items-end gap-1">
            {[80, 120, 60, 140, 100, 50, 130, 90, 110, 70, 150, 85].map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center">
                <div
                  className="w-full animate-pulse rounded-t-sm bg-slate-800/40"
                  style={{ height: `${h}px` }}
                />
                <div className="mt-1.5 h-2 w-6 animate-pulse rounded bg-slate-800/40" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
