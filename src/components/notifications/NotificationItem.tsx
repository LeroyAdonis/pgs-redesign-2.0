"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { NotificationType } from "@/lib/notifications/types";
import { formatTimeAgo } from "./format-time-ago";

/* ─── Types ─── */

interface NotificationItemProps {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

/* ─── Type → icon/color mapping ─── */

const typeConfig: Record<
  NotificationType,
  { icon: React.ReactNode; colorClass: string; bgClass: string }
> = {
  success: {
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8.5 6.5 11 12 5" />
      </svg>
    ),
    colorClass: "text-success",
    bgClass: "bg-success-surface",
  },
  error: {
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="m5 5 6 6M11 5l-6 6" />
      </svg>
    ),
    colorClass: "text-error",
    bgClass: "bg-error-surface",
  },
  warning: {
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5v3M8 10.5v.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 13h9L8 3 3.5 13Z" />
      </svg>
    ),
    colorClass: "text-warning",
    bgClass: "bg-warning-surface",
  },
  info: {
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <circle cx="8" cy="8" r="6" />
        <path strokeLinecap="round" d="M8 7v4M8 5.5v.5" />
      </svg>
    ),
    colorClass: "text-info",
    bgClass: "bg-info-surface",
  },
  system: {
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <circle cx="8" cy="8" r="2.5" />
        <path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M4 4l1 1M11 11l1 1M4 12l1-1M11 5l1-1" />
      </svg>
    ),
    colorClass: "text-brand",
    bgClass: "bg-brand-surface",
  },
};

/* ─── Component ─── */

function NotificationItem({
  id,
  type,
  title,
  message,
  createdAt,
  isRead,
  onMarkRead,
  onDelete,
}: NotificationItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const config = typeConfig[type];

  function handleClick() {
    if (!isRead) {
      onMarkRead(id);
    }
  }

  function handleDelete(e: React.MouseEvent | React.KeyboardEvent) {
    e.stopPropagation();
    setIsDeleting(true);
    onDelete(id);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "group relative flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
        "hover:bg-brand-surface/60 focus-visible:bg-brand-surface/60",
        !isRead && "bg-brand-surface/30",
        isDeleting && "pointer-events-none opacity-50",
      )}
      aria-label={`${isRead ? "" : "Unread: "}${title}`}
      data-testid={`notification-item-${id}`}
    >
      {/* Unread dot */}
      {!isRead && (
        <span
          className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-brand"
          aria-hidden="true"
        />
      )}

      {/* Type icon */}
      <span
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-none",
          config.bgClass,
          config.colorClass,
        )}
      >
        {config.icon}
      </span>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm leading-snug", !isRead ? "font-semibold text-text" : "font-medium text-text")}>
          {title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-text-muted">
          {message}
        </p>
        <p className="mt-1 text-[0.625rem] font-medium text-text-muted">
          {formatTimeAgo(createdAt)}
        </p>
      </div>

      {/* Delete button */}
      <button
        type="button"
        onClick={handleDelete}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleDelete(e);
        }}
        className={cn(
          "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-none text-text-muted",
          "opacity-0 transition-all hover:bg-error-surface hover:text-error",
          "group-hover:opacity-100 group-focus-within:opacity-100",
          "focus-visible:opacity-100",
        )}
        aria-label={`Delete notification: ${title}`}
        tabIndex={0}
      >
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2 2 8 8M10 2l-8 8" />
        </svg>
      </button>
    </button>
  );
}

export { NotificationItem };
export type { NotificationItemProps };
