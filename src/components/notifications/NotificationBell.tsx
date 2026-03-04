"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { NotificationDropdown } from "./NotificationDropdown";
import type { NotificationCountResponse } from "./notification-types";

/* ─── Constants ─── */

/** Polling interval for unread count (30 seconds) */
const POLL_INTERVAL_MS = 30_000;

/* ─── Component ─── */

/**
 * NotificationBell — self-contained bell icon with unread badge and dropdown.
 *
 * - Fetches unread count on mount and polls every 30s
 * - Toggles the NotificationDropdown on click
 * - Click outside / Escape closes the dropdown
 */
function NotificationBell() {
  const [count, setCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Fetch unread count ──
  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/count");
      if (!res.ok) return;
      const data: NotificationCountResponse = await res.json();
      setCount(data.count);
    } catch {
      // Silently ignore network errors — will retry on next poll
    }
  }, []);

  // Poll on mount + every 30 seconds
  useEffect(() => {
    // Defer initial fetch to avoid synchronous setState in effect
    const initialTimer = setTimeout(fetchCount, 0);
    const interval = setInterval(fetchCount, POLL_INTERVAL_MS);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [fetchCount]);

  // ── Click outside to close ──
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // ── Escape to close ──
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  // ── Re-fetch count when dropdown reports changes ──
  const handleCountChange = useCallback(() => {
    fetchCount();
  }, [fetchCount]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors",
          "hover:bg-brand-surface hover:text-text",
          isOpen && "bg-brand-surface text-text",
        )}
        aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ""}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        data-testid="notification-bell"
      >
        <svg
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10 3a5 5 0 0 0-5 5c0 4-2 5-2 5h14s-2-1-2-5a5 5 0 0 0-5-5ZM8.5 15.5a2.12 2.12 0 0 0 3 0"
          />
        </svg>
        {count > 0 && (
          <Badge
            variant="error"
            size="sm"
            className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center p-0 text-[0.5rem]"
          >
            {count > 99 ? "99+" : count}
          </Badge>
        )}
      </button>

      <NotificationDropdown
        isOpen={isOpen}
        onCountChange={handleCountChange}
      />
    </div>
  );
}

export { NotificationBell };
