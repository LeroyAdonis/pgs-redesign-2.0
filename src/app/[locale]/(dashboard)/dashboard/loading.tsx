/**
 * Dashboard loading state
 *
 * Shown while dashboard overview page is loading.
 * Matches the dashboard layout: header, stats grid, two-column, posts list.
 */

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Welcome header skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-7 w-56 animate-pulse rounded bg-surface-raised" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-surface-raised" />
        </div>
        <div className="h-10 w-36 animate-pulse rounded bg-surface-raised" />
      </div>

      {/* Quick stats skeleton — 4 KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
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

      {/* Middle row: Upcoming posts + Credits */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upcoming posts skeleton — 2/3 */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface">
          <div className="border-b border-border px-5 py-4">
            <div className="h-5 w-40 animate-pulse rounded bg-surface-raised" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-start gap-3 border-b border-border px-5 py-3.5 last:border-0"
            >
              <div className="h-8 w-8 shrink-0 animate-pulse rounded bg-surface-raised" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-surface-raised" />
                <div className="h-3 w-32 animate-pulse rounded bg-surface-raised" />
              </div>
            </div>
          ))}
        </div>

        {/* Credits skeleton — 1/3 */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-5 flex items-center justify-between">
            <div className="h-5 w-28 animate-pulse rounded bg-surface-raised" />
            <div className="h-3 w-16 animate-pulse rounded bg-surface-raised" />
          </div>
          <div className="mb-6">
            <div className="h-3 w-24 animate-pulse rounded bg-surface-raised mb-2" />
            <div className="h-9 w-12 animate-pulse rounded bg-surface-raised" />
          </div>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <div className="h-3 w-20 animate-pulse rounded bg-surface-raised mb-2" />
              <div className="h-5 w-10 animate-pulse rounded bg-surface-raised" />
            </div>
            <div>
              <div className="h-3 w-24 animate-pulse rounded bg-surface-raised mb-2" />
              <div className="h-5 w-10 animate-pulse rounded bg-surface-raised" />
            </div>
          </div>
          <div className="h-2 w-full animate-pulse rounded-full bg-surface-raised" />
        </div>
      </div>

      {/* Recent posts skeleton */}
      <div className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <div className="h-5 w-32 animate-pulse rounded bg-surface-raised" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 border-b border-border px-5 py-3.5 last:border-0"
          >
            <div className="h-8 w-8 shrink-0 animate-pulse rounded bg-surface-raised" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 animate-pulse rounded bg-surface-raised" />
              <div className="flex items-center gap-2">
                <div className="h-4 w-14 animate-pulse rounded bg-surface-raised" />
                <div className="h-3 w-12 animate-pulse rounded bg-surface-raised" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
