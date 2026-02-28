/**
 * Forgot password form — client component
 *
 * Handles requesting a password reset link via email.
 * Uses Better-auth client requestPasswordReset API.
 */

"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

interface ForgotPasswordFormLabels {
  email: string;
  sendResetLink: string;
  resetLinkSent: string;
  resetLinkSentDescription: string;
  backToLogin: string;
}

interface ForgotPasswordFormProps {
  labels: ForgotPasswordFormLabels;
}

export function ForgotPasswordForm({ labels }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: resetError } = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });

      if (resetError) {
        setError(resetError.message ?? "Failed to send reset link");
      } else {
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-6 space-y-6">
        {/* Success state */}
        <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-950">
          <svg
            className="mx-auto h-8 w-8 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
            />
          </svg>
          <h2 className="mt-3 text-sm font-semibold text-green-800 dark:text-green-200">
            {labels.resetLinkSent}
          </h2>
          <p className="mt-1 text-sm text-green-700 dark:text-green-300">
            {labels.resetLinkSentDescription}
          </p>
        </div>

        <a
          href="login"
          className="flex w-full justify-center rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-surface-raised"
        >
          {labels.backToLogin}
        </a>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-text"
          >
            {labels.email}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50"
        >
          {loading ? "..." : labels.sendResetLink}
        </button>
      </form>

      <p className="text-center text-sm text-text-muted">
        <a
          href="login"
          className="font-medium text-brand hover:text-brand/80"
        >
          {labels.backToLogin}
        </a>
      </p>
    </div>
  );
}
