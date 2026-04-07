"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { PLATFORM_COLORS, STATUS_CLASSES } from "./types";
import type { CalendarSchedule } from "./types";

/* ─── Props ─── */

interface CalendarEventProps {
  schedule: CalendarSchedule;
  /** Compact mode for month grid (dot only) vs expanded for day/week */
  compact?: boolean;
  /** Enable dragging */
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, scheduleId: string) => void;
}

/* ─── Component ─── */

function CalendarEvent({
  schedule,
  compact = false,
  draggable = false,
  onDragStart,
}: CalendarEventProps) {
  const platformColor =
    PLATFORM_COLORS[schedule.platform.toLowerCase()] ?? "#6b7280";
  const statusClass = STATUS_CLASSES[schedule.status] ?? STATUS_CLASSES.draft;
  const contentPreview =
    schedule.content.length > 60
      ? schedule.content.slice(0, 57) + "…"
      : schedule.content;

  function handleDragStart(e: React.DragEvent) {
    if (onDragStart) {
      onDragStart(e, schedule.id);
    }
    e.dataTransfer.setData("text/plain", schedule.id);
    e.dataTransfer.effectAllowed = "move";
  }

  if (compact) {
    return (
      <div
        className="flex items-center gap-1 rounded px-1 py-0.5 text-[0.625rem] leading-tight text-text-muted transition-colors hover:bg-brand-surface"
        title={`${schedule.platform}: ${schedule.content}`}
        draggable={draggable}
        onDragStart={handleDragStart}
        data-testid="calendar-event"
        data-schedule-id={schedule.id}
      >
        <span
          className="inline-block h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: platformColor }}
          aria-hidden="true"
        />
        <span className="truncate">{contentPreview}</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-start gap-2 rounded-none border border-border bg-surface p-2 text-xs shadow-sm transition-shadow hover:shadow-md"
      draggable={draggable}
      onDragStart={handleDragStart}
      data-testid="calendar-event"
      data-schedule-id={schedule.id}
    >
      {/* Platform color bar */}
      <span
        className="mt-0.5 inline-block h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: platformColor }}
        aria-label={`Platform: ${schedule.platform}`}
        data-testid="platform-dot"
      />

      <div className="min-w-0 flex-1">
        {/* Platform + Status */}
        <div className="flex items-center gap-1.5">
          <span className="font-medium capitalize text-text">
            {schedule.platform}
          </span>
          <span
            className={cn(
              "inline-block h-1.5 w-1.5 rounded-full",
              statusClass,
            )}
            aria-label={`Status: ${schedule.status}`}
            data-testid="status-dot"
          />
        </div>
        {/* Content preview */}
        <p className="mt-0.5 truncate text-text-muted" data-testid="content-preview">
          {contentPreview}
        </p>
        {/* Time */}
        <span className="mt-1 block text-[0.625rem] text-text-muted">
          {new Date(schedule.scheduledAt).toLocaleTimeString("en-ZA", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Africa/Johannesburg",
          })}
        </span>
      </div>
    </div>
  );
}

export { CalendarEvent };
export type { CalendarEventProps };
