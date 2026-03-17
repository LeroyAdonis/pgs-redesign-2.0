/**
 * Error boundary for admin accounts page
 *
 * Displays an actionable error message when the accounts page
 * fails to load. Provides a retry button to re-attempt rendering.
 */

"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminAccountsError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to console in development; production errors are captured by the logger on the server
    console.error("Admin accounts page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="max-w-md rounded-xl border border-red-500/20 bg-slate-900/80 p-8 text-center">
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
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" d="M12 8v4M12 16h.01" />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-slate-100">
          Failed to load accounts
        </h3>
        <p className="mt-2 text-sm text-slate-400">
          Something went wrong while fetching social account data.
          This could be a temporary issue — try again or check the system status.
        </p>

        {error.digest && (
          <p className="mt-2 font-mono text-xs text-slate-600">
            Error ID: {error.digest}
          </p>
        )}

        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-slate-900"
          aria-label="Retry loading accounts"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
