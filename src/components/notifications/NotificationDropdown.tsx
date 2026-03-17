"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { NotificationItem } from "./NotificationItem";
import type {
  ClientNotification,
  NotificationsResponse,
  MarkReadResponse,
  MarkAllReadResponse,
  DeleteNotificationResponse,
} from "./notification-types";

/* ─── Types ─── */

interface NotificationDropdownProps {
  /** Whether the dropdown is visible */
  isOpen: boolean;
  /** Callback after the unread count changes (mark-read / delete / mark-all) */
  onCountChange: () => void;
}

/* ─── Shimmer placeholder ─── */

function ShimmerItem() {
  return (
    <div className="flex items-start gap-3 px-4 py-3" aria-hidden="true">
      <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-none bg-surface-inset">
        <div className="absolute inset-0 animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="relative h-3 w-3/4 overflow-hidden rounded bg-surface-inset">
          <div className="absolute inset-0 animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
        <div className="relative h-2.5 w-full overflow-hidden rounded bg-surface-inset">
          <div className="absolute inset-0 animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
        <div className="relative h-2 w-1/4 overflow-hidden rounded bg-surface-inset">
          <div className="absolute inset-0 animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      </div>
    </div>
  );
}

/* ─── Component ─── */

function NotificationDropdown({
  isOpen,
  onCountChange,
}: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  // ── Fetch notifications ──
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=10");
      if (!res.ok) return;
      const data: NotificationsResponse = await res.json();
      setNotifications(data.notifications);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Re-fetch whenever dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // ── Mark single as read ──
  async function handleMarkRead(id: string) {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
      ),
    );

    const res = await fetch(`/api/notifications/${id}/read`, {
      method: "PATCH",
    });
    const data: MarkReadResponse = await res.json();

    if (!data.success) {
      // Revert on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: null } : n)),
      );
      return;
    }

    onCountChange();
  }

  // ── Mark all as read ──
  async function handleMarkAllRead() {
    setIsMarkingAll(true);

    // Optimistic update
    const previousNotifications = notifications;
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
    );

    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "POST",
      });
      const data: MarkAllReadResponse = await res.json();

      if (!data.success) {
        setNotifications(previousNotifications);
        return;
      }

      onCountChange();
    } finally {
      setIsMarkingAll(false);
    }
  }

  // ── Delete notification ──
  async function handleDelete(id: string) {
    // Optimistic removal
    const previousNotifications = notifications;
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    const res = await fetch(`/api/notifications/${id}`, {
      method: "DELETE",
    });
    const data: DeleteNotificationResponse = await res.json();

    if (!data.success) {
      setNotifications(previousNotifications);
      return;
    }

    onCountChange();
  }

  if (!isOpen) return null;

  const hasUnread = notifications.some((n) => !n.readAt);

  return (
    <div
      className={cn(
        "absolute right-0 top-full mt-2",
        "w-[380px] max-sm:fixed max-sm:left-2 max-sm:right-2 max-sm:top-16 max-sm:w-auto",
        "z-[var(--z-overlay)]",
        "rounded-xl border border-border bg-surface-raised/95 backdrop-blur-xl",
        "shadow-lg",
        "animate-[modal-enter_200ms_var(--ease-smooth)]",
      )}
      role="menu"
      aria-label="Notifications"
      data-testid="notification-dropdown"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-text">Notifications</h2>
        {hasUnread && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={isMarkingAll}
            className={cn(
              "text-xs font-medium text-brand transition-colors hover:text-brand-vivid",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
            aria-label="Mark all notifications as read"
          >
            {isMarkingAll ? "Marking…" : "Mark all as read"}
          </button>
        )}
      </div>

      {/* ── List ── */}
      <div
        className="max-h-[400px] overflow-y-auto overscroll-contain"
        role="list"
      >
        {isLoading ? (
          <>
            <ShimmerItem />
            <ShimmerItem />
            <ShimmerItem />
          </>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-2xl" role="img" aria-label="Bell">
              🔔
            </span>
            <p className="mt-2 text-sm text-text-muted">
              No notifications yet
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationItem
              key={n.id}
              id={n.id}
              type={n.type}
              title={n.title}
              message={n.message}
              createdAt={n.createdAt}
              isRead={n.readAt !== null}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* ── Footer ── */}
      {!isLoading && notifications.length > 0 && (
        <div className="border-t border-border px-4 py-2.5">
          <button
            type="button"
            className="w-full text-center text-xs font-medium text-brand transition-colors hover:text-brand-vivid"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}

export { NotificationDropdown };
export type { NotificationDropdownProps };
