"use client";

import { cn } from "@/lib/utils";

/**
 * Shimmer loading placeholder for analytics widgets.
 *
 * Renders a pulsing block with a sliding shimmer gradient overlay,
 * matching the shimmer keyframe defined in globals.css.
 */
export function AnalyticsShimmer({
  className,
  lines = 1,
}: {
  className?: string;
  lines?: number;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-md bg-surface-inset"
          style={{ height: i === 0 ? "1.5rem" : "1rem", width: i === 0 ? "60%" : "80%" }}
        >
          <div
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
            style={{ animation: "shimmer 1.5s infinite" }}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Card-shaped shimmer for stat cards.
 */
export function StatCardShimmer() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface-raised p-5">
      <div className="relative mb-3 h-9 w-9 overflow-hidden rounded-md bg-surface-inset">
        <div
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
          style={{ animation: "shimmer 1.5s infinite" }}
        />
      </div>
      <AnalyticsShimmer lines={3} />
    </div>
  );
}

/**
 * Error state for analytics widgets.
 */
export function AnalyticsError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-surface">
        <svg
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-error"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" d="M12 8v4M12 16h.01" />
        </svg>
      </div>
      <p className="text-sm text-text-muted">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-brand-surface px-3 py-1.5 text-xs font-medium text-brand transition-colors hover:bg-brand/20"
        >
          Try again
        </button>
      )}
    </div>
  );
}

/**
 * Empty state for analytics widgets when no data is available.
 */
export function AnalyticsEmpty({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-surface">
        <svg
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-brand"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 17l4-6 3 4 4-8 3 5"
          />
        </svg>
      </div>
      <p className="max-w-xs text-sm text-text-muted">
        {message ?? "Start publishing posts to see analytics here!"}
      </p>
    </div>
  );
}
