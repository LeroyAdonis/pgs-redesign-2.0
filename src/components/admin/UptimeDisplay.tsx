/**
 * Uptime display component
 *
 * Shows uptime percentage and a 90-day visual bar for each service.
 * Green pixels = up, red pixels = down. Also displays the current
 * uptime streak in days.
 *
 * Client component — receives data via props.
 */

"use client";

import type { UptimeRecord } from "@/types/admin-system";

/* ─── Component ─── */

interface UptimeDisplayProps {
  initialData: UptimeRecord[];
}

export function UptimeDisplay({ initialData }: UptimeDisplayProps) {
  return (
    <div
      className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-5"
      data-testid="uptime-display"
    >
      <h3 className="text-sm font-semibold text-slate-200">Service Uptime</h3>
      <p className="mt-1 text-xs text-slate-500">90-day uptime history</p>

      <div className="mt-4 space-y-4">
        {initialData.map((record) => {
          const uptimeColor =
            record.uptimePercent >= 99.9
              ? "text-emerald-400"
              : record.uptimePercent >= 99.0
                ? "text-amber-400"
                : "text-red-400";

          return (
            <div
              key={record.service}
              className="rounded-lg border border-slate-700/30 bg-slate-800/30 px-4 py-3"
              data-testid={`uptime-service-${record.service.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
            >
              {/* Service header */}
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium text-slate-200">
                  {record.service}
                </p>
                <div className="flex items-baseline gap-3">
                  <span className={`text-sm font-bold ${uptimeColor}`}>
                    {record.uptimePercent.toFixed(2)}%
                  </span>
                  <span className="text-xs text-slate-500">
                    {record.currentStreakDays}d streak
                  </span>
                </div>
              </div>

              {/* 90-day visual bar */}
              <div
                className="mt-2 flex gap-px"
                role="img"
                aria-label={`${record.service}: ${record.uptimePercent.toFixed(2)}% uptime over 90 days`}
              >
                {record.dailyStatus.map((isUp, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`h-3 flex-1 rounded-[1px] ${
                      isUp ? "bg-emerald-500/80" : "bg-red-500/80"
                    }`}
                    title={`Day ${dayIndex + 1}: ${isUp ? "Up" : "Down"}`}
                  />
                ))}
              </div>

              {/* Scale labels */}
              <div className="mt-1 flex justify-between text-[0.625rem] text-slate-600">
                <span>90 days ago</span>
                <span>Today</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
