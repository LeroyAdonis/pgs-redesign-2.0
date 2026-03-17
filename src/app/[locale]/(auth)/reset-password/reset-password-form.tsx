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
  resetting: string;
  passwordResetSuccess: string;
  backToLogin: string;
  passwordsMustMatch: string;
  invalidResetToken: string;
}

interface ResetPasswordFormProps {
  labels: ResetPasswordFormLabels;
}

/** Inline spinner SVG for button loading states */
function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
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
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mt-6 space-y-6">
        {/* Success state */}
        <div className="bg-green-50 p-4 text-center dark:bg-green-950">
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
          className="flex w-full justify-center bg-brand px-4 py-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
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
          <div className="bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="new-password"
            className="block font-mono text-[10px] uppercase tracking-widest text-text-muted"
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
            className="mt-1 block w-full border border-border bg-surface px-5 py-4 text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="block font-mono text-[10px] uppercase tracking-widest text-text-muted"
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
            className="mt-1 block w-full border border-border bg-surface px-5 py-4 text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          className="flex w-full items-center justify-center gap-2 bg-brand px-4 py-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50"
        >
          {loading ? (
            <>
              <Spinner className="h-4 w-4" />
              {labels.resetting}
            </>
          ) : (
            labels.resetPassword
          )}
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
