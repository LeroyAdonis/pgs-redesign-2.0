"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import type { NotificationType } from "@/lib/notifications/types";

/* ─── Toast data ─── */

interface Toast {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  /** Whether the dismiss animation is playing */
  dismissing: boolean;
}

/* ─── Toast store (module-scoped singleton) ─── */

let toasts: Toast[] = [];
let nextId = 0;
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Toast[] {
  return toasts;
}

function addToast(
  type: NotificationType,
  title: string,
  message: string,
): string {
  const id = String(++nextId);
  toasts = [...toasts, { id, type, title, message, dismissing: false }];
  emitChange();
  return id;
}

function dismissToast(id: string) {
  toasts = toasts.map((t) =>
    t.id === id ? { ...t, dismissing: true } : t,
  );
  emitChange();

  // Remove from store after exit animation (300ms)
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emitChange();
  }, 300);
}

/* ─── Public API ─── */

/**
 * Show a toast notification from anywhere in the app.
 *
 * @example
 * ```ts
 * import { showToast } from "@/components/notifications/NotificationToast";
 * showToast("success", "Post published!", "Your post is now live on Instagram.");
 * ```
 */
export function showToast(
  type: NotificationType,
  title: string,
  message: string,
): void {
  const id = addToast(type, title, message);

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    dismissToast(id);
  }, 5_000);
}

/* ─── Color bar mapping ─── */

const typeBarColor: Record<NotificationType, string> = {
  success: "bg-success",
  error: "bg-error",
  warning: "bg-warning",
  info: "bg-info",
  system: "bg-brand",
};

const typeIcon: Record<NotificationType, React.ReactNode> = {
  success: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8.5 6.5 11 12 5" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 5 6 6M11 5l-6 6" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 5v3M8 10.5v.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 13h9L8 3 3.5 13Z" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="8" cy="8" r="6" />
      <path strokeLinecap="round" d="M8 7v4M8 5.5v.5" />
    </svg>
  ),
  system: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M4 4l1 1M11 11l1 1M4 12l1-1M11 5l1-1" />
    </svg>
  ),
};

/* ─── Single toast card ─── */

function ToastCard({ toast }: { toast: Toast }) {
  return (
    <div
      className={cn(
        "pointer-events-auto relative flex w-80 overflow-hidden rounded-lg border border-border bg-surface-raised shadow-lg",
        toast.dismissing
          ? "animate-[toast-out_300ms_var(--ease-smooth)_forwards]"
          : "animate-[toast-in_300ms_var(--ease-smooth)]",
      )}
      role="alert"
      aria-live="assertive"
      data-testid={`toast-${toast.id}`}
    >
      {/* Color bar */}
      <div className={cn("w-1 shrink-0", typeBarColor[toast.type])} />

      {/* Content */}
      <div className="flex flex-1 items-start gap-2.5 px-3 py-3">
        <span className={cn("mt-0.5 shrink-0", `text-${toast.type === "system" ? "brand" : toast.type}`)}>
          {typeIcon[toast.type]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-text">
            {toast.title}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-text-muted">
            {toast.message}
          </p>
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={() => dismissToast(toast.id)}
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-text-muted transition-colors hover:text-text"
          aria-label="Close notification"
        >
          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m1 1 8 8M9 1l-8 8" />
          </svg>
        </button>
      </div>

      {/* Countdown bar */}
      {!toast.dismissing && (
        <div
          className={cn(
            "absolute bottom-0 left-0 h-0.5",
            typeBarColor[toast.type],
            "animate-[toast-countdown_5s_linear_forwards]",
          )}
        />
      )}
    </div>
  );
}

/* ─── Toast container ─── */

/**
 * ToastContainer — renders all active toasts.
 *
 * Mount once in the app layout (e.g. root layout).
 * Use `showToast()` to trigger toasts from anywhere.
 */
function ToastContainer() {
  const currentToasts = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  if (currentToasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-[var(--z-toast)] flex flex-col gap-2"
      aria-label="Notifications"
      data-testid="toast-container"
    >
      {currentToasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

export { ToastContainer };
export type { Toast };
