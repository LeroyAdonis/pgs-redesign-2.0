"use client";

import { Card } from "@/components/layout/Card";
import { cn } from "@/lib/utils";
import { useAnalyticsFetch } from "./useAnalyticsFetch";
import { AnalyticsShimmer, AnalyticsError, AnalyticsEmpty } from "./AnalyticsShimmer";
import type { EngagementTrend } from "@/lib/analytics/types";

// ─── Helpers ────────────────────────────────────────────────────

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-ZA", { month: "short", day: "numeric" });
}

// ─── SVG Line Chart ─────────────────────────────────────────────

interface LineData {
  label: string;
  color: string;
  values: number[];
}

const CHART_HEIGHT = 200;
const CHART_PADDING = { top: 10, right: 10, bottom: 30, left: 50 };

function SvgLineChart({
  lines,
  labels,
}: {
  lines: LineData[];
  labels: string[];
}) {
  const allValues = lines.flatMap((l) => l.values);
  const maxValue = Math.max(...allValues, 1);
  const minValue = 0;

  const innerWidth = 100; // percentage-based
  const innerHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

  // Only show ~6 date labels to avoid overcrowding
  const labelStep = Math.max(1, Math.floor(labels.length / 6));

  return (
    <div className="relative w-full" style={{ height: CHART_HEIGHT }}>
      <svg
        viewBox={`0 0 ${innerWidth + CHART_PADDING.left + CHART_PADDING.right} ${CHART_HEIGHT}`}
        preserveAspectRatio="none"
        className="h-full w-full"
        role="img"
        aria-label="Engagement trends chart"
      >
        {/* Y-axis gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = CHART_PADDING.top + innerHeight * (1 - frac);
          const val = minValue + (maxValue - minValue) * frac;
          return (
            <g key={frac}>
              <line
                x1={CHART_PADDING.left}
                y1={y}
                x2={CHART_PADDING.left + innerWidth}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.08}
                strokeWidth={0.3}
              />
              <text
                x={CHART_PADDING.left - 4}
                y={y + 1}
                textAnchor="end"
                className="fill-text-muted"
                style={{ fontSize: "3.5px" }}
              >
                {formatCompact(Math.round(val))}
              </text>
            </g>
          );
        })}

        {/* Lines */}
        {lines.map((line) => {
          const points = line.values
            .map((val, i) => {
              const x =
                CHART_PADDING.left + (i / Math.max(line.values.length - 1, 1)) * innerWidth;
              const y =
                CHART_PADDING.top +
                innerHeight * (1 - (val - minValue) / (maxValue - minValue || 1));
              return `${x},${y}`;
            })
            .join(" ");

          return (
            <g key={line.label}>
              {/* Area fill */}
              <polygon
                points={`${CHART_PADDING.left},${CHART_PADDING.top + innerHeight} ${points} ${CHART_PADDING.left + innerWidth},${CHART_PADDING.top + innerHeight}`}
                fill={line.color}
                fillOpacity={0.05}
              />
              {/* Line */}
              <polyline
                points={points}
                fill="none"
                stroke={line.color}
                strokeWidth={0.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          );
        })}

        {/* X-axis labels */}
        {labels.map((label, i) => {
          if (i % labelStep !== 0 && i !== labels.length - 1) return null;
          const x =
            CHART_PADDING.left + (i / Math.max(labels.length - 1, 1)) * innerWidth;
          return (
            <text
              key={label}
              x={x}
              y={CHART_HEIGHT - 4}
              textAnchor="middle"
              className="fill-text-muted"
              style={{ fontSize: "3px" }}
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Legend ──────────────────────────────────────────────────────

function Legend({ lines }: { lines: LineData[] }) {
  return (
    <div className="flex flex-wrap gap-4">
      {lines.map((line) => (
        <div key={line.label} className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: line.color }}
            aria-hidden="true"
          />
          <span className="text-xs text-text-muted">{line.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────

/**
 * Engagement trend chart showing daily impressions, reach, and
 * engagement over the last 30 days.
 *
 * Uses pure SVG — no chart library dependency.
 * Fetches from /api/analytics/trends.
 */
export function EngagementChart({ className }: { className?: string }) {
  const { data, loading, error, refetch } = useAnalyticsFetch<EngagementTrend[]>(
    "/api/analytics/trends",
  );

  const lines: LineData[] = [
    { label: "Impressions", color: "#8b5cf6", values: data?.map((d) => d.impressions) ?? [] },
    { label: "Reach", color: "#a78bfa", values: data?.map((d) => d.reach) ?? [] },
    { label: "Engagement", color: "#6d28d9", values: data?.map((d) => d.engagement) ?? [] },
  ];

  const labels = data?.map((d) => formatDateLabel(d.date)) ?? [];

  return (
    <Card as="section" padding="none" className={cn("overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="font-display text-lg font-semibold text-text">
          Engagement Trends
        </h2>
        <span className="text-xs text-text-muted">Last 30 days</span>
      </div>

      {/* Content */}
      <div className="p-5">
        {loading && (
          <div data-testid="engagement-chart-loading">
            <AnalyticsShimmer lines={5} />
            <div className="mt-4 h-[200px] animate-pulse rounded-md bg-surface-inset" />
          </div>
        )}

        {error && <AnalyticsError message={error} onRetry={refetch} />}

        {!loading && !error && (!data || data.length === 0) && (
          <AnalyticsEmpty message="No engagement data yet. Publish some posts to see trends!" />
        )}

        {!loading && !error && data && data.length > 0 && (
          <>
            <Legend lines={lines} />
            <div className="mt-4">
              <SvgLineChart lines={lines} labels={labels} />
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
