"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("[Billing Error Boundary]", error);

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
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
      <div className="text-center">
        <p className="font-medium text-text">Something went wrong</p>
        <p className="mt-1 text-sm text-text-muted">
          We couldn&apos;t load your billing information. Please try again.
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="rounded-none bg-brand-surface px-4 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand/20"
      >
        Try again
      </button>
    </div>
  );
}
