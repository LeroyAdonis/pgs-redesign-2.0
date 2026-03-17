"use client";

import { cn } from "@/lib/utils";
import { CalendarEvent } from "./CalendarEvent";
import { useDragDrop } from "./DragDropContext";
import type { CalendarSchedule } from "./types";

/* ─── Constants ─── */

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6am to 10pm

/* ─── Helpers ─── */

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getHour(scheduledAt: string): number {
  return new Date(scheduledAt).getHours();
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

interface DayViewProps {
  currentDate: Date;
  schedules: CalendarSchedule[];
  onTimeSlotClick?: (date: Date, hour: number) => void;
}

/* ─── Component ─── */

function DayView({ currentDate, schedules, onTimeSlotClick }: DayViewProps) {
  const { draggingId, onDragStart, onDragEnd, onDrop } = useDragDrop();
  const dateKey = toDateKey(currentDate);
  const timeOffset = getCurrentTimeOffset();

  // Filter schedules for this day and group by hour
  const schedulesByHour = new Map<number, CalendarSchedule[]>();
  for (const s of schedules) {
    const sKey = toDateKey(new Date(s.scheduledAt));
    if (sKey === dateKey) {
      const hour = getHour(s.scheduledAt);
      const arr = schedulesByHour.get(hour) ?? [];
      arr.push(s);
      schedulesByHour.set(hour, arr);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: React.DragEvent, hour: number) {
    e.preventDefault();
    onDrop(`${dateKey}T${String(hour).padStart(2, "0")}:00:00`);
  }

  const dayLabel = currentDate.toLocaleDateString("en-ZA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div data-testid="day-view">
      {/* Day header */}
      <div className="border-b border-border py-3 text-center">
        <h3 className="text-sm font-semibold text-text">{dayLabel}</h3>
      </div>

      {/* Time slots */}
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

        {HOURS.map((hour) => {
          const hourSchedules = schedulesByHour.get(hour) ?? [];

          return (
            <div
              key={hour}
              className="grid grid-cols-[4rem_1fr] border-b border-border"
              data-testid={`time-slot-${hour}`}
            >
              {/* Time label */}
              <div className="border-r border-border py-4 pr-2 text-right text-xs text-text-muted">
                {hour === 0
                  ? "12 AM"
                  : hour < 12
                    ? `${hour} AM`
                    : hour === 12
                      ? "12 PM"
                      : `${hour - 12} PM`}
              </div>

              {/* Content area */}
              <div
                className={cn(
                  "min-h-[4rem] p-1 transition-colors",
                  draggingId && "hover:bg-brand-surface/50",
                )}
                onClick={() => onTimeSlotClick?.(currentDate, hour)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, hour)}
                data-testid={`day-slot-${hour}`}
                role="button"
                tabIndex={0}
                aria-label={`${hour}:00 time slot`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    onTimeSlotClick?.(currentDate, hour);
                  }
                }}
              >
                <div className="space-y-1">
                  {hourSchedules.map((s) => (
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { DayView };
export type { DayViewProps };
