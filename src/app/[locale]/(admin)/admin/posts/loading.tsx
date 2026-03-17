/**
 * Loading state for admin posts page
 *
 * Skeleton UI matching the post moderation page layout:
 * stat cards + table rows.
 */

export default function AdminPostsLoading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div>
        <div className="h-7 w-44 animate-pulse rounded bg-slate-800" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-800/60" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4"
          >
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 animate-pulse rounded bg-slate-800/60" />
              <div className="h-3 w-16 animate-pulse rounded bg-slate-800" />
            </div>
            <div className="mt-2 h-8 w-12 animate-pulse rounded bg-slate-800" />
          </div>
        ))}
      </div>

      {/* Filters skeleton */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="h-9 w-48 animate-pulse rounded-lg bg-slate-800" />
          <div className="h-9 w-32 animate-pulse rounded-lg bg-slate-800" />
          <div className="h-9 w-32 animate-pulse rounded-lg bg-slate-800" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50">
        {/* Table header */}
        <div className="border-b border-slate-700/50 px-4 py-3">
          <div className="flex gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-4 w-20 animate-pulse rounded bg-slate-800"
              />
            ))}
          </div>
        </div>
        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="border-b border-slate-800/50 px-4 py-3"
          >
            <div className="flex items-center gap-6">
              <div className="h-4 w-4 animate-pulse rounded bg-slate-800/60" />
              <div className="h-4 w-48 animate-pulse rounded bg-slate-800" />
              <div className="h-4 w-24 animate-pulse rounded bg-slate-800/80" />
              <div className="h-4 w-20 animate-pulse rounded bg-slate-800/60" />
              <div className="h-5 w-16 animate-pulse rounded-full bg-slate-800" />
              <div className="h-4 w-28 animate-pulse rounded bg-slate-800/60" />
              <div className="h-4 w-24 animate-pulse rounded bg-slate-800/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
