/**
 * Loading skeleton for admin accounts page
 *
 * Shown while the server component fetches account data.
 * Mirrors the page layout with pulsing placeholder blocks.
 */

export default function AdminAccountsLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading accounts">
      {/* Page header skeleton */}
      <div>
        <div className="h-7 w-48 rounded bg-slate-800" />
        <div className="mt-2 h-4 w-80 rounded bg-slate-800/60" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 rounded bg-slate-800" />
                <div className="h-8 w-16 rounded bg-slate-800" />
                <div className="h-3 w-32 rounded bg-slate-800/60" />
              </div>
              <div className="h-10 w-10 rounded-lg bg-slate-800" />
            </div>
          </div>
        ))}
      </div>

      {/* Distribution + Table skeleton */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Distribution skeleton */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-5 xl:col-span-1">
          <div className="mb-4 h-4 w-36 rounded bg-slate-800" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-slate-800" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-20 rounded bg-slate-800" />
                  <div className="h-2 w-full rounded-full bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Table skeleton */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 xl:col-span-2">
          <div className="flex gap-3 border-b border-slate-700/50 p-4">
            <div className="h-9 flex-1 rounded-lg bg-slate-800" />
            <div className="h-9 w-32 rounded-lg bg-slate-800" />
            <div className="h-9 w-28 rounded-lg bg-slate-800" />
          </div>
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 w-20 rounded bg-slate-800" />
                <div className="h-4 w-32 rounded bg-slate-800" />
                <div className="h-4 w-28 rounded bg-slate-800" />
                <div className="h-5 w-20 rounded-full bg-slate-800" />
                <div className="h-4 w-24 rounded bg-slate-800" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
