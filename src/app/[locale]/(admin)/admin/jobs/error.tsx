/**
 * Job monitoring error boundary
 *
 * Catches errors in the jobs page and displays a recovery UI.
 * Must be a client component as error boundaries require client-side JS.
 */

"use client";

import { useEffect } from "react";

interface JobsErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function JobsError({ error, reset }: JobsErrorProps) {
  useEffect(() => {
    console.error("[Admin Jobs Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-red-500/20 bg-slate-900/50 p-6 text-center">
        {/* Error icon */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
          <svg
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-red-400"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h2 className="text-lg font-semibold text-slate-100">
          Job monitoring unavailable
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Failed to load job monitoring data. The Inngest service may be
          unavailable. This has been logged for investigation.
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-slate-600">
            Error ID: {error.digest}
          </p>
        )}

        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-lg bg-purple-500/20 px-4 py-2 text-sm font-medium text-purple-300 transition-colors hover:bg-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
