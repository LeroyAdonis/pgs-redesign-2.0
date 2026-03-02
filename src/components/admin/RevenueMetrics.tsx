/**
 * Revenue metrics stat cards
 *
 * Displays premium-sized cards for key revenue KPIs:
 * MRR, Active Subscriptions, Churn Rate, and Credit Revenue.
 *
 * Fetches data from /api/admin/revenue and renders with
 * ZAR currency formatting and trend indicators.
 */

"use client";

import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RevenueMetricsData {
  mrr: number;
  mrrChange: number;
  totalActiveSubs: number;
  subsChange: number;
  churnRate: number;
  churnChange: number;
  creditRevenue: number;
  creditRevenueChange: number;
}

interface RevenueMetricsProps {
  /** Initial data from server for instant render (optional) */
  initialData?: RevenueMetricsData;
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/** Format a number as ZAR currency: R 1,234.56 */
function formatZAR(amount: number): string {
  // Use explicit en-US style formatting for consistent period-decimal display
  // since en-ZA locale uses comma-decimal which can confuse international readers
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `R ${formatted}`;
}

/** Format a percentage change with sign: +12.3% or -5.1% */
function formatChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TrendArrow({ direction }: { direction: "up" | "down" }) {
  if (direction === "up") {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        className="inline-block"
        aria-hidden="true"
        data-testid="trend-arrow-up"
      >
        <path
          d="M7 2.5L11.5 7.5H8.5V11.5H5.5V7.5H2.5L7 2.5Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="inline-block"
      aria-hidden="true"
      data-testid="trend-arrow-down"
    >
      <path
        d="M7 11.5L2.5 6.5H5.5V2.5H8.5V6.5H11.5L7 11.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  change: number;
  /** For churn, positive change is bad (inverted) */
  invertTrend?: boolean;
  icon: React.ReactNode;
  testId: string;
}

function MetricCard({
  label,
  value,
  change,
  invertTrend = false,
  icon,
  testId,
}: MetricCardProps) {
  const isPositive = invertTrend ? change <= 0 : change >= 0;
  const direction = change >= 0 ? "up" : "down";
  const trendColor = isPositive ? "text-emerald-400" : "text-red-400";

  return (
    <div
      className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-6 transition-colors hover:border-slate-600/50"
      data-testid={testId}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[0.8125rem] font-medium text-slate-400">
            {label}
          </p>
          <p
            className="mt-2 text-3xl font-bold tracking-tight text-slate-100"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {value}
          </p>
          <p
            className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${trendColor}`}
            data-testid={`${testId}-trend`}
          >
            <TrendArrow direction={direction} />
            <span>{formatChange(change)} from last month</span>
          </p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
          {icon}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icons (inline SVGs, 22×22)
// ---------------------------------------------------------------------------

function MRRIcon() {
  return (
    <svg
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 17V7l5.5 4L11 5l4 8 4-6v10H3Z"
      />
    </svg>
  );
}

function SubsIcon() {
  return (
    <svg
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <circle cx="8" cy="7" r="3" />
      <path strokeLinecap="round" d="M2 19c0-3.5 2.5-5.5 6-5.5s6 2 6 5.5" />
      <circle cx="16" cy="7" r="2.5" />
      <path strokeLinecap="round" d="M16 12c2.5 0 4.5 1.5 4.5 4.5" />
    </svg>
  );
}

function ChurnIcon() {
  return (
    <svg
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 4L5 18M5 4l14 14"
      />
      <circle cx="11" cy="11" r="8" />
    </svg>
  );
}

function CreditIcon() {
  return (
    <svg
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 8.5H9.5a1.5 1.5 0 100 3h3a1.5 1.5 0 010 3H8M11 6v1.5m0 7V16"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

function RevenueMetrics({ initialData }: RevenueMetricsProps) {
  const [data, setData] = useState<RevenueMetricsData | null>(
    initialData ?? null,
  );
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) return;

    async function fetchRevenue() {
      try {
        const res = await fetch("/api/admin/revenue");
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error ?? "Unknown error");
        }
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load revenue data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchRevenue();
  }, [initialData]);

  if (isLoading) {
    return (
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        data-testid="revenue-metrics-loading"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-6"
          >
            <div className="space-y-3">
              <div className="h-3 w-20 animate-pulse rounded bg-slate-800" />
              <div className="h-9 w-28 animate-pulse rounded bg-slate-800" />
              <div className="h-3 w-32 animate-pulse rounded bg-slate-800/60" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-xl border border-red-500/20 bg-slate-900/50 p-6 text-center"
        data-testid="revenue-metrics-error"
      >
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      data-testid="revenue-metrics"
    >
      <MetricCard
        label="Monthly Recurring Revenue"
        value={formatZAR(data.mrr)}
        change={data.mrrChange}
        icon={<MRRIcon />}
        testId="metric-mrr"
      />
      <MetricCard
        label="Active Subscriptions"
        value={data.totalActiveSubs.toLocaleString("en-ZA")}
        change={data.subsChange}
        icon={<SubsIcon />}
        testId="metric-subs"
      />
      <MetricCard
        label="Churn Rate"
        value={`${data.churnRate.toFixed(1)}%`}
        change={data.churnChange}
        invertTrend
        icon={<ChurnIcon />}
        testId="metric-churn"
      />
      <MetricCard
        label="Credit Revenue"
        value={formatZAR(data.creditRevenue)}
        change={data.creditRevenueChange}
        icon={<CreditIcon />}
        testId="metric-credit"
      />
    </div>
  );
}

export { RevenueMetrics, formatZAR, formatChange };
export type { RevenueMetricsData, RevenueMetricsProps };
