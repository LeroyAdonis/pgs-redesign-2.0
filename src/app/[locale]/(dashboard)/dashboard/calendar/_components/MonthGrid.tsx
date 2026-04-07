"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { CalendarEvent } from "./CalendarEvent";
import { useDragDrop } from "./DragDropContext";
import type { CalendarSchedule } from "./types";

/* ─── Helpers ─── */

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface DayCell {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  dateKey: string; // YYYY-MM-DD
}

/** Build a 6-week grid of day cells for the given month */
function buildMonthGrid(year: number, month: number): DayCell[] {
  const today = new Date();
  const todayKey = toDateKey(today);

  // First day of the month
  const firstDay = new Date(year, month, 1);
  // Start grid from the Sunday of the week containing firstDay
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());

  const cells: DayCell[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    const key = toDateKey(date);
    cells.push({
      date,
      isCurrentMonth: date.getMonth() === month,
      isToday: key === todayKey,
      dateKey: key,
    });
  }
  return cells;
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ─── Props ─── */

interface MonthGridProps {
  currentDate: Date;
  schedules: CalendarSchedule[];
  onDayClick: (date: Date) => void;
}

/* ─── Component ─── */

function MonthGrid({ currentDate, schedules, onDayClick }: MonthGridProps) {
  const { draggingId, onDragStart, onDragEnd, onDrop } = useDragDrop();

  const cells = buildMonthGrid(
    currentDate.getFullYear(),
    currentDate.getMonth(),
  );

  // Group schedules by date key
  const schedulesByDate = new Map<string, CalendarSchedule[]>();
  for (const s of schedules) {
    const key = toDateKey(new Date(s.scheduledAt));
    const arr = schedulesByDate.get(key) ?? [];
    arr.push(s);
    schedulesByDate.set(key, arr);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: React.DragEvent, dateKey: string) {
    e.preventDefault();
    onDrop(dateKey);
  }

  return (
    <div data-testid="month-grid">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {DAY_HEADERS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-text-muted"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((cell) => {
          const daySchedules = schedulesByDate.get(cell.dateKey) ?? [];
          return (
            <div
              key={cell.dateKey}
              className={cn(
                "min-h-[5rem] border-b border-r border-border p-1 transition-colors sm:min-h-[6rem]",
                !cell.isCurrentMonth && "bg-surface-inset",
                cell.isToday && "bg-brand-surface/30",
                draggingId && "hover:bg-brand-surface/50",
              )}
              onClick={() => onDayClick(cell.date)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, cell.dateKey)}
              data-testid={`day-cell-${cell.dateKey}`}
              role="button"
              tabIndex={0}
              aria-label={`${cell.date.toLocaleDateString("en-ZA", { weekday: "long", month: "long", day: "numeric" })}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onDayClick(cell.date);
                }
              }}
            >
              {/* Date number */}
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                  cell.isToday
                    ? "bg-brand font-semibold text-white"
                    : cell.isCurrentMonth
                      ? "text-text"
                      : "text-text-muted",
                )}
              >
                {cell.date.getDate()}
              </span>

              {/* Events */}
              <div className="mt-0.5 space-y-0.5">
                {daySchedules.slice(0, 3).map((s) => (
                  <CalendarEvent
                    key={s.id}
                    schedule={s}
                    compact
                    draggable
                    onDragStart={(e) => {
                      onDragStart(s.id);
                      e.dataTransfer.setData("text/plain", s.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                  />
                ))}
                {daySchedules.length > 3 && (
                  <span className="block text-[0.625rem] text-text-muted">
                    +{daySchedules.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { MonthGrid };
export type { MonthGridProps };
