"use client";

import { cn } from "@/lib/utils";
import type { CalendarViewMode } from "./types";

/* ─── Helpers ─── */

/** Format the center date label based on view mode */
function formatDateLabel(date: Date, mode: CalendarViewMode): string {
  if (mode === "month") {
    return date.toLocaleDateString("en-ZA", {
      month: "long",
      year: "numeric",
    });
  }

  if (mode === "week") {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const startStr = weekStart.toLocaleDateString("en-ZA", {
      month: "short",
      day: "numeric",
    });
    const endStr = weekEnd.toLocaleDateString("en-ZA", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${startStr} – ${endStr}`;
  }

  // day mode
  return date.toLocaleDateString("en-ZA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/* ─── Props ─── */

interface CalendarToolbarProps {
  currentDate: Date;
  viewMode: CalendarViewMode;
  onNavigate: (direction: "prev" | "next" | "today") => void;
  onViewModeChange: (mode: CalendarViewMode) => void;
}

/* ─── Component ─── */

function CalendarToolbar({
  currentDate,
  viewMode,
  onNavigate,
  onViewModeChange,
}: CalendarToolbarProps) {
  const viewModes: { key: CalendarViewMode; label: string }[] = [
    { key: "month", label: "Month" },
    { key: "week", label: "Week" },
    { key: "day", label: "Day" },
  ];

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-none border border-border bg-surface p-3"
      data-testid="calendar-toolbar"
    >
      {/* Left: Navigation */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onNavigate("prev")}
          className="flex h-8 w-8 items-center justify-center rounded-none border border-border text-text-muted transition-colors hover:bg-brand-surface hover:text-text"
          aria-label="Previous"
          data-testid="nav-prev"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 3L5 8l5 5" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => onNavigate("today")}
          className="rounded-none border border-border px-3 py-1 text-xs font-medium text-text-muted transition-colors hover:bg-brand-surface hover:text-text"
          data-testid="nav-today"
        >
          Today
        </button>

        <button
          type="button"
          onClick={() => onNavigate("next")}
          className="flex h-8 w-8 items-center justify-center rounded-none border border-border text-text-muted transition-colors hover:bg-brand-surface hover:text-text"
          aria-label="Next"
          data-testid="nav-next"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 3l5 5-5 5" />
          </svg>
        </button>
      </div>

      {/* Center: Date label */}
      <h2
        className="text-sm font-semibold text-text sm:text-base"
        data-testid="date-label"
      >
        {formatDateLabel(currentDate, viewMode)}
      </h2>

      {/* Right: View mode buttons */}
      <div
        className="flex rounded-none border border-border"
        role="group"
        aria-label="Calendar view mode"
      >
        {viewModes.map((vm) => (
          <button
            key={vm.key}
            type="button"
            onClick={() => onViewModeChange(vm.key)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors first:rounded-l-lg last:rounded-r-lg",
              viewMode === vm.key
                ? "bg-brand-surface text-brand"
                : "text-text-muted hover:bg-brand-surface hover:text-text",
            )}
            aria-pressed={viewMode === vm.key}
            data-testid={`view-mode-${vm.key}`}
          >
            {vm.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export { CalendarToolbar };
export type { CalendarToolbarProps };
