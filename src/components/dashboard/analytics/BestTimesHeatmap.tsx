"use client";

import { Card } from "@/components/layout/Card";
import { cn } from "@/lib/utils";
import { useAnalyticsFetch } from "./useAnalyticsFetch";
import { AnalyticsShimmer, AnalyticsError, AnalyticsEmpty } from "./AnalyticsShimmer";
import type { BestPostingTime } from "@/lib/analytics/types";

// ─── Constants ──────────────────────────────────────────────────

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Purple intensity scale (light → dark)
const INTENSITY_CLASSES = [
  "bg-surface-inset",       // 0 — no data
  "bg-purple-100",          // 1
  "bg-purple-200",          // 2
  "bg-purple-300",          // 3
  "bg-purple-400",          // 4
  "bg-purple-500",          // 5
  "bg-purple-600",          // 6 — max
] as const;

// ─── Helpers ────────────────────────────────────────────────────

function buildHeatmapGrid(data: BestPostingTime[]): Map<string, BestPostingTime> {
  const map = new Map<string, BestPostingTime>();
  for (const entry of data) {
    map.set(`${entry.dayOfWeek}-${entry.hour}`, entry);
  }
  return map;
}

function getIntensityClass(value: number, maxValue: number): string {
  if (value === 0 || maxValue === 0) return INTENSITY_CLASSES[0];
  const ratio = value / maxValue;
  if (ratio <= 0.15) return INTENSITY_CLASSES[1];
  if (ratio <= 0.3) return INTENSITY_CLASSES[2];
  if (ratio <= 0.45) return INTENSITY_CLASSES[3];
  if (ratio <= 0.6) return INTENSITY_CLASSES[4];
  if (ratio <= 0.8) return INTENSITY_CLASSES[5];
  return INTENSITY_CLASSES[6];
}

function formatHour(hour: number): string {
  if (hour === 0) return "12am";
  if (hour === 12) return "12pm";
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
}

// ─── Component ──────────────────────────────────────────────────

/**
 * Best posting times heatmap.
 *
 * 7×24 grid (days × hours) with purple intensity indicating
 * average engagement level. Hours are in SAST (UTC+2).
 *
 * Fetches from /api/analytics/best-times.
 */
export function BestTimesHeatmap({ className }: { className?: string }) {
  const { data, loading, error, refetch } = useAnalyticsFetch<BestPostingTime[]>(
    "/api/analytics/best-times",
  );

  return (
    <Card as="section" padding="none" className={cn("overflow-hidden", className)}>
      {/* Header */}
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-display text-lg font-semibold text-text">
          Best Posting Times
        </h2>
        <p className="mt-0.5 text-xs text-text-muted">
          SAST (UTC+2) · Engagement by hour
        </p>
      </div>

      {/* Content */}
      <div className="p-5">
        {loading && (
          <div data-testid="best-times-loading">
            <AnalyticsShimmer lines={4} />
          </div>
        )}

        {error && <AnalyticsError message={error} onRetry={refetch} />}

        {!loading && !error && (!data || data.length === 0) && (
          <AnalyticsEmpty message="Not enough data to determine best posting times yet." />
        )}

        {!loading && !error && data && data.length > 0 && (
          <HeatmapGrid data={data} />
        )}
      </div>
    </Card>
  );
}

/**
 * The actual heatmap grid, extracted for clarity.
 */
function HeatmapGrid({ data }: { data: BestPostingTime[] }) {
  const grid = buildHeatmapGrid(data);
  const maxEngagement = Math.max(...data.map((d) => d.avgEngagement), 1);

  // Show every 3rd hour label to avoid crowding
  const visibleHours = HOURS.filter((h) => h % 3 === 0);

  return (
    <div className="overflow-x-auto" data-testid="best-times-heatmap">
      <div className="min-w-[500px]">
        {/* Hour labels */}
        <div className="mb-1 flex">
          <div className="w-10 shrink-0" /> {/* Spacer for day labels */}
          <div className="flex flex-1">
            {HOURS.map((hour) => (
              <div key={hour} className="flex-1 text-center">
                {visibleHours.includes(hour) && (
                  <span className="text-[0.6rem] text-text-muted">
                    {formatHour(hour)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Grid rows */}
        {DAYS.map((dayLabel, dayIndex) => (
          <div key={dayLabel} className="mb-0.5 flex items-center">
            <div className="w-10 shrink-0 text-[0.6875rem] text-text-muted">
              {dayLabel}
            </div>
            <div className="flex flex-1 gap-0.5">
              {HOURS.map((hour) => {
                const entry = grid.get(`${dayIndex}-${hour}`);
                const engagement = entry?.avgEngagement ?? 0;
                return (
                  <div
                    key={hour}
                    className={cn(
                      "aspect-square flex-1 rounded-[3px] transition-colors",
                      getIntensityClass(engagement, maxEngagement),
                    )}
                    title={`${dayLabel} ${formatHour(hour)}: ${engagement.toFixed(1)} avg engagement${entry ? ` (${entry.postCount} posts)` : ""}`}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className="mt-3 flex items-center justify-end gap-1">
          <span className="mr-1 text-[0.6rem] text-text-muted">Less</span>
          {INTENSITY_CLASSES.map((cls, i) => (
            <div
              key={i}
              className={cn("h-3 w-3 rounded-[2px]", cls)}
            />
          ))}
          <span className="ml-1 text-[0.6rem] text-text-muted">More</span>
        </div>
      </div>
    </div>
  );
}
