"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarToolbar } from "./CalendarToolbar";
import { MonthGrid } from "./MonthGrid";
import { WeekView } from "./WeekView";
import { DayView } from "./DayView";
import { DragDropProvider } from "./DragDropContext";
import type { CalendarSchedule, CalendarViewMode } from "./types";

/* ─── Helpers ─── */

/** Build the start/end date range for a given date + view mode */
function getDateRange(
  date: Date,
  mode: CalendarViewMode,
): { startDate: string; endDate: string } {
  const y = date.getFullYear();
  const m = date.getMonth();

  if (mode === "month") {
    // First day of month to last day of month (including overflow for grid)
    const first = new Date(y, m, 1);
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - first.getDay());

    const last = new Date(y, m + 1, 0);
    const gridEnd = new Date(last);
    gridEnd.setDate(last.getDate() + (6 - last.getDay()));

    return { startDate: toISODate(gridStart), endDate: toISODate(gridEnd) };
  }

  if (mode === "week") {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return { startDate: toISODate(weekStart), endDate: toISODate(weekEnd) };
  }

  // day
  return { startDate: toISODate(date), endDate: toISODate(date) };
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ─── Component ─── */

function CalendarView() {
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [schedules, setSchedules] = useState<CalendarSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Fetch schedules for the visible date range */
  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { startDate, endDate } = getDateRange(currentDate, viewMode);

    try {
      const res = await fetch(
        `/api/schedule?startDate=${startDate}&endDate=${endDate}`,
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch schedules (${res.status})`);
      }
      const data: CalendarSchedule[] = await res.json();
      setSchedules(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load schedules",
      );
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode]);

  useEffect(() => {
    void fetchSchedules();
  }, [fetchSchedules]);

  /** Navigate prev/next/today */
  function handleNavigate(direction: "prev" | "next" | "today") {
    setCurrentDate((prev) => {
      if (direction === "today") return new Date();

      const d = new Date(prev);
      const delta = direction === "prev" ? -1 : 1;

      if (viewMode === "month") {
        d.setMonth(d.getMonth() + delta);
      } else if (viewMode === "week") {
        d.setDate(d.getDate() + delta * 7);
      } else {
        d.setDate(d.getDate() + delta);
      }
      return d;
    });
  }

  /** Switch to day view on a specific date */
  function handleDayClick(date: Date) {
    setCurrentDate(date);
    setViewMode("day");
  }

  /** Handle drag-and-drop rescheduling */
  function handleReschedule(scheduleId: string, newDate: string) {
    // Optimistically update local state
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === scheduleId ? { ...s, scheduledAt: newDate } : s,
      ),
    );

    // Fire-and-forget PATCH (error handling would go here in production)
    void fetch(`/api/schedule/${scheduleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt: newDate }),
    });
  }

  return (
    <div className="space-y-4 p-4" data-testid="calendar-view">
      {/* Header */}
      <div className="flex items-center gap-3">
        <svg
          className="h-6 w-6 text-brand"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M3 9h18M8 4V2M16 4V2" />
        </svg>
        <h1 className="text-lg font-semibold text-text">Calendar</h1>
      </div>

      {/* Toolbar */}
      <CalendarToolbar
        currentDate={currentDate}
        viewMode={viewMode}
        onNavigate={handleNavigate}
        onViewModeChange={setViewMode}
      />

      {/* Content area */}
      <div className="rounded-lg border border-border bg-surface">
        {loading && (
          <div
            className="flex h-64 items-center justify-center"
            data-testid="calendar-loading"
          >
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <svg
                className="h-5 w-5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
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
              Loading schedules…
            </div>
          </div>
        )}

        {error && (
          <div
            className="flex h-64 items-center justify-center"
            data-testid="calendar-error"
          >
            <div className="text-center">
              <p className="text-sm text-red-500">{error}</p>
              <button
                type="button"
                onClick={() => void fetchSchedules()}
                className="mt-2 text-xs text-brand hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <DragDropProvider onReschedule={handleReschedule}>
            {viewMode === "month" && (
              <MonthGrid
                currentDate={currentDate}
                schedules={schedules}
                onDayClick={handleDayClick}
              />
            )}
            {viewMode === "week" && (
              <WeekView
                currentDate={currentDate}
                schedules={schedules}
              />
            )}
            {viewMode === "day" && (
              <DayView
                currentDate={currentDate}
                schedules={schedules}
              />
            )}
          </DragDropProvider>
        )}
      </div>
    </div>
  );
}

export { CalendarView };
