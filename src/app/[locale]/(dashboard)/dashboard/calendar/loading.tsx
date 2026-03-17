/**
 * Calendar loading state
 *
 * Shown while the calendar page is loading.
 * Matches the calendar layout with toolbar and grid skeleton.
 */

export default function CalendarLoading() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="space-y-4 p-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-pulse rounded bg-surface-raised" />
          <div className="h-7 w-32 animate-pulse rounded bg-surface-raised" />
        </div>

        {/* Toolbar skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 animate-pulse rounded bg-surface-raised" />
            <div className="h-8 w-8 animate-pulse rounded bg-surface-raised" />
            <div className="h-8 w-20 animate-pulse rounded bg-surface-raised" />
          </div>
          <div className="flex items-center gap-1">
            <div className="h-8 w-14 animate-pulse rounded bg-surface-raised" />
            <div className="h-8 w-14 animate-pulse rounded bg-surface-raised" />
            <div className="h-8 w-14 animate-pulse rounded bg-surface-raised" />
          </div>
        </div>

        {/* Calendar grid skeleton */}
        <div className="rounded-xl border border-border bg-surface">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="px-3 py-2 text-center">
                <div className="mx-auto h-3 w-8 animate-pulse rounded bg-surface-raised" />
              </div>
            ))}
          </div>

          {/* Calendar cells — 5 rows × 7 cols */}
          <div className="grid grid-cols-7">
            {Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className="min-h-[80px] border-b border-r border-border p-2"
              >
                <div className="h-4 w-5 animate-pulse rounded bg-surface-raised mb-1" />
                {i % 5 === 0 && (
                  <div className="h-4 w-full animate-pulse rounded bg-brand/20 mt-1" />
                )}
                {i % 7 === 0 && (
                  <div className="h-4 w-3/4 animate-pulse rounded bg-brand/20 mt-1" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
