"use client";

import { cn } from "@/lib/utils";
import { CalendarEvent } from "./CalendarEvent";
import { useDragDrop } from "./DragDropContext";
import type { CalendarSchedule } from "./types";

/* ─── Constants ─── */

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6am to 10pm
const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ─── Helpers ─── */

function getWeekDates(date: Date): Date[] {
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getHour(scheduledAt: string): number {
  return new Date(scheduledAt).getHours();
}

/** Check if date is today */
function isToday(d: Date): boolean {
  const now = new Date();
  return toDateKey(d) === toDateKey(now);
}

/** Current time position as fraction of the visible range (6am–10pm) */
function getCurrentTimeOffset(): number | null {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  if (hour < 6 || hour > 22) return null;
  return ((hour - 6) * 60 + minute) / (17 * 60);
}

/* ─── Props ─── */

interface WeekViewProps {
  currentDate: Date;
  schedules: CalendarSchedule[];
  onTimeSlotClick?: (date: Date, hour: number) => void;
}

/* ─── Component ─── */

function WeekView({ currentDate, schedules, onTimeSlotClick }: WeekViewProps) {
  const { draggingId, onDragStart, onDragEnd, onDrop } = useDragDrop();
  const weekDates = getWeekDates(currentDate);
  const timeOffset = getCurrentTimeOffset();

  // Group schedules by (dateKey, hour)
  const scheduleMap = new Map<string, CalendarSchedule[]>();
  for (const s of schedules) {
    const key = `${toDateKey(new Date(s.scheduledAt))}-${getHour(s.scheduledAt)}`;
    const arr = scheduleMap.get(key) ?? [];
    arr.push(s);
    scheduleMap.set(key, arr);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: React.DragEvent, dateKey: string, hour: number) {
    e.preventDefault();
    // Encode as ISO datetime: dateKey + hour
    onDrop(`${dateKey}T${String(hour).padStart(2, "0")}:00:00`);
  }

  return (
    <div className="overflow-x-auto" data-testid="week-view">
      <div className="min-w-[700px]">
        {/* Day headers */}
        <div className="grid grid-cols-[4rem_repeat(7,1fr)] border-b border-border">
          <div /> {/* Time gutter spacer */}
          {weekDates.map((d) => (
            <div
              key={toDateKey(d)}
              className={cn(
                "py-2 text-center text-xs font-medium",
                isToday(d) ? "text-brand" : "text-text-muted",
              )}
            >
              <span className="block">{DAY_HEADERS[d.getDay()]}</span>
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-sm",
                  isToday(d) && "bg-brand text-white",
                )}
              >
                {d.getDate()}
              </span>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="relative">
          {/* Current time indicator */}
          {timeOffset !== null && (
            <div
              className="pointer-events-none absolute left-0 right-0 z-10 border-t-2 border-red-500"
              style={{ top: `${timeOffset * 100}%` }}
              data-testid="current-time-indicator"
            >
              <span className="absolute -left-0 -top-1.5 h-3 w-3 rounded-full bg-red-500" />
            </div>
          )}

          {HOURS.map((hour) => (
            <div
              key={hour}
              className="grid grid-cols-[4rem_repeat(7,1fr)] border-b border-border"
              data-testid={`time-row-${hour}`}
            >
              {/* Time label */}
              <div className="border-r border-border py-3 pr-2 text-right text-[0.625rem] text-text-muted">
                {hour === 0
                  ? "12 AM"
                  : hour < 12
                    ? `${hour} AM`
                    : hour === 12
                      ? "12 PM"
                      : `${hour - 12} PM`}
              </div>

              {/* Day columns */}
              {weekDates.map((d) => {
                const dateKey = toDateKey(d);
                const cellKey = `${dateKey}-${hour}`;
                const cellSchedules = scheduleMap.get(cellKey) ?? [];

                return (
                  <div
                    key={cellKey}
                    className={cn(
                      "min-h-[3rem] border-r border-border p-0.5 transition-colors",
                      draggingId && "hover:bg-brand-surface/50",
                      isToday(d) && "bg-brand-surface/10",
                    )}
                    onClick={() => onTimeSlotClick?.(d, hour)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, dateKey, hour)}
                    data-testid={`week-slot-${dateKey}-${hour}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${DAY_HEADERS[d.getDay()]} ${hour}:00`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        onTimeSlotClick?.(d, hour);
                      }
                    }}
                  >
                    {cellSchedules.map((s) => (
                      <CalendarEvent
                        key={s.id}
                        schedule={s}
                        draggable
                        onDragStart={(e) => {
                          onDragStart(s.id);
                          e.dataTransfer.setData("text/plain", s.id);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { WeekView };
export type { WeekViewProps };
