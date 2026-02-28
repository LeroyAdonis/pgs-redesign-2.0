/**
 * Reset password form — client component
 *
 * Handles setting a new password using the token from the reset email.
 * Uses Better-auth client resetPassword API.
 */

"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";

interface ResetPasswordFormLabels {
  newPassword: string;
  confirmPassword: string;
  resetPassword: string;
  passwordResetSuccess: string;
  backToLogin: string;
  passwordsMustMatch: string;
  invalidResetToken: string;
}

interface ResetPasswordFormProps {
  labels: ResetPasswordFormLabels;
}

export function ResetPasswordForm({ labels }: ResetPasswordFormProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    const urlError = params.get("error");

    if (urlError === "INVALID_TOKEN") {
      setError(labels.invalidResetToken);
    } else if (urlToken) {
      setToken(urlToken);
    } else {
      setError(labels.invalidResetToken);
    }
  }, [labels.invalidResetToken]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError(labels.passwordsMustMatch);
      return;
    }

    if (!token) {
      setError(labels.invalidResetToken);
      return;
    }

    setLoading(true);

    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword,
        token,
      });

      if (resetError) {
        setError(resetError.message ?? "Password reset failed");
      } else {
        setSuccess(true);
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
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
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
          <p className="mt-3 text-sm font-semibold text-green-800 dark:text-green-200">
            {labels.passwordResetSuccess}
          </p>
        </div>

        <a
          href="login"
          className="flex w-full justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
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
            htmlFor="new-password"
            className="block text-sm font-medium text-text"
          >
            {labels.newPassword}
          </label>
          <input
            id="new-password"
            name="new-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="block text-sm font-medium text-text"
          >
            {labels.confirmPassword}
          </label>
          <input
            id="confirm-password"
            name="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          className="flex w-full justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50"
        >
          {loading ? "..." : labels.resetPassword}
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
