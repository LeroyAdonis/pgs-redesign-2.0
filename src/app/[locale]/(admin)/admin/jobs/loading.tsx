/**
 * Job monitoring loading state
 *
 * Shown while the admin jobs page is loading (Suspense boundary).
 * Uses skeleton cards + table rows to match the job monitoring layout.
 */

export default function JobsLoading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-7 w-44 animate-pulse rounded bg-slate-800" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-800/60" />
        </div>
        <div className="h-10 w-44 animate-pulse rounded-lg bg-slate-800/60" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div className="h-3 w-16 animate-pulse rounded bg-slate-800" />
                <div className="h-7 w-10 animate-pulse rounded bg-slate-800" />
              </div>
              <div className="h-10 w-10 animate-pulse rounded-lg bg-slate-800/60" />
            </div>
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4 md:p-5">
        <div className="mb-4">
          <div className="h-5 w-32 animate-pulse rounded bg-slate-800" />
          <div className="mt-1.5 h-3 w-64 animate-pulse rounded bg-slate-800/60" />
        </div>

        {/* Filter bar skeleton */}
        <div className="mb-4 flex gap-3">
          <div className="h-8 w-32 animate-pulse rounded-lg bg-slate-800" />
          <div className="h-8 w-32 animate-pulse rounded-lg bg-slate-800" />
        </div>

        {/* Table rows skeleton */}
        <div className="overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-900/50">
          <div className="divide-y divide-slate-700/30">
            {/* Header */}
            <div className="flex gap-4 px-4 py-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-3 w-20 animate-pulse rounded bg-slate-800"
                />
              ))}
            </div>
            {/* Rows */}
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="h-4 w-32 animate-pulse rounded bg-slate-800/60" />
                <div className="h-5 w-20 animate-pulse rounded-full bg-slate-800/60" />
                <div className="h-4 w-28 animate-pulse rounded bg-slate-800/60" />
                <div className="h-4 w-16 animate-pulse rounded bg-slate-800/60" />
                <div className="h-4 w-8 animate-pulse rounded bg-slate-800/60" />
                <div className="h-4 w-16 animate-pulse rounded bg-slate-800/60" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
