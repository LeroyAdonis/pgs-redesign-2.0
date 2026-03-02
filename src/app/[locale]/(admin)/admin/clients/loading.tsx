/**
 * Admin clients loading state
 *
 * Shown while the clients page is loading (Suspense boundary).
 * Uses skeleton elements to match the clients page layout.
 */

export default function AdminClientsLoading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div>
        <div className="h-7 w-48 animate-pulse rounded bg-slate-800" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-800/60" />
      </div>

      {/* Summary stat cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-5"
          >
            <div className="h-3 w-20 animate-pulse rounded bg-slate-800" />
            <div className="mt-3 h-7 w-16 animate-pulse rounded bg-slate-800" />
          </div>
        ))}
      </div>

      {/* Toolbar skeleton (search + filters) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-slate-800/50" />
        <div className="flex items-center gap-2">
          <div className="h-10 w-28 animate-pulse rounded-lg bg-slate-800/50" />
          <div className="h-10 w-28 animate-pulse rounded-lg bg-slate-800/50" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/50">
        {/* Header row */}
        <div className="flex border-b border-slate-700/50 px-4 py-3">
          {["w-24", "w-28", "w-16", "w-16", "w-20", "w-12"].map(
            (width, i) => (
              <div key={i} className="flex-1 px-2">
                <div
                  className={`h-3 ${width} animate-pulse rounded bg-slate-800`}
                />
              </div>
            ),
          )}
        </div>

        {/* Data rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center border-b border-slate-700/30 px-4 py-3"
          >
            <div className="flex flex-1 items-center gap-3 px-2">
              <div className="h-8 w-8 animate-pulse rounded-full bg-slate-800" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-28 animate-pulse rounded bg-slate-800" />
                <div className="h-2.5 w-16 animate-pulse rounded bg-slate-800/60" />
              </div>
            </div>
            <div className="flex-1 space-y-1.5 px-2">
              <div className="h-3.5 w-24 animate-pulse rounded bg-slate-800" />
              <div className="h-2.5 w-32 animate-pulse rounded bg-slate-800/60" />
            </div>
            <div className="flex-1 px-2">
              <div className="h-5 w-16 animate-pulse rounded-full bg-slate-800" />
            </div>
            <div className="flex-1 px-2">
              <div className="h-5 w-14 animate-pulse rounded-full bg-slate-800" />
            </div>
            <div className="flex-1 px-2">
              <div className="h-3.5 w-20 animate-pulse rounded bg-slate-800" />
            </div>
            <div className="flex-1 px-2">
              <div className="h-6 w-6 animate-pulse rounded bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
