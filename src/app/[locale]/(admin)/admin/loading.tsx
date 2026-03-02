/**
 * Admin loading state
 *
 * Shown while admin pages are loading (Suspense boundary).
 * Uses skeleton cards to match the overview page layout.
 */

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div>
        <div className="h-7 w-48 animate-pulse rounded bg-slate-800" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-800/60" />
      </div>

      {/* Stat cards skeleton grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div className="h-3 w-20 animate-pulse rounded bg-slate-800" />
                <div className="h-7 w-16 animate-pulse rounded bg-slate-800" />
                <div className="h-3 w-28 animate-pulse rounded bg-slate-800/60" />
              </div>
              <div className="h-10 w-10 animate-pulse rounded-lg bg-slate-800/60" />
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions skeleton */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-5">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-800" />
        <div className="mt-2 h-3 w-56 animate-pulse rounded bg-slate-800/60" />
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg border border-slate-700/30 bg-slate-800/30"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
