/**
 * System health loading state
 *
 * Shown while the system health page is loading (Suspense boundary).
 * Skeletons match the page layout: banner, 2-column grid, uptime, error log.
 */

export default function SystemHealthLoading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div>
        <div className="h-7 w-40 animate-pulse rounded bg-slate-800" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-800/60" />
      </div>

      {/* Status banner skeleton */}
      <div className="flex items-center gap-4 rounded-xl border border-slate-700/50 bg-slate-900/50 p-5">
        <div className="h-4 w-4 animate-pulse rounded-full bg-slate-800" />
        <div className="space-y-2">
          <div className="h-4 w-48 animate-pulse rounded bg-slate-800" />
          <div className="h-3 w-32 animate-pulse rounded bg-slate-800/60" />
        </div>
      </div>

      {/* 2-column grid skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* API Health skeleton */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-5">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-800" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-slate-700/30 bg-slate-800/30 px-4 py-3"
              >
                <div className="h-6 w-6 animate-pulse rounded bg-slate-800" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-24 animate-pulse rounded bg-slate-800" />
                  <div className="h-3 w-20 animate-pulse rounded bg-slate-800/60" />
                </div>
                <div className="h-3.5 w-12 animate-pulse rounded bg-slate-800" />
                <div className="h-3 w-3 animate-pulse rounded-full bg-slate-800" />
              </div>
            ))}
          </div>
        </div>

        {/* Rate Limits skeleton */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-5">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-800" />
          <div className="mt-1.5 h-3 w-56 animate-pulse rounded bg-slate-800/60" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-slate-700/30 bg-slate-800/30 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <div className="h-3.5 w-24 animate-pulse rounded bg-slate-800" />
                  <div className="h-3 w-16 animate-pulse rounded bg-slate-800/60" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Uptime skeleton */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-5">
        <div className="h-4 w-28 animate-pulse rounded bg-slate-800" />
        <div className="mt-1.5 h-3 w-40 animate-pulse rounded bg-slate-800/60" />
        <div className="mt-4 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-slate-700/30 bg-slate-800/30 px-4 py-3"
            >
              <div className="flex items-baseline justify-between">
                <div className="h-3.5 w-32 animate-pulse rounded bg-slate-800" />
                <div className="h-3.5 w-16 animate-pulse rounded bg-slate-800" />
              </div>
              <div className="mt-2 h-3 w-full animate-pulse rounded bg-slate-800/60" />
            </div>
          ))}
        </div>
      </div>

      {/* Error log skeleton */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-5">
        <div className="h-4 w-20 animate-pulse rounded bg-slate-800" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-full animate-pulse rounded bg-slate-800/30"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
