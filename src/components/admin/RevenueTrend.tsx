/**
 * Revenue trend chart (CSS-only, no external chart library)
 *
 * Renders a vertical bar chart showing monthly revenue over
 * the last 12 months. Uses pure CSS/HTML with gradient fills
 * matching the Purple Glow brand. Current month is highlighted.
 */

"use client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MonthlyTrendItem {
  month: string;
  year: number;
  revenueZAR: number;
  label: string;
}

interface RevenueTrendProps {
  data: MonthlyTrendItem[];
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function formatCompactZAR(amount: number): string {
  if (amount >= 1_000_000) {
    return `R ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `R ${(amount / 1_000).toFixed(1)}K`;
  }
  return `R ${amount.toFixed(0)}`;
}

function formatFullZAR(amount: number): string {
  return `R ${amount.toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

function RevenueTrend({ data }: RevenueTrendProps) {
  const maxRevenue = Math.max(...data.map((d) => d.revenueZAR), 1);
  const currentIndex = data.length - 1;

  // Generate Y-axis labels (5 ticks)
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const value = (maxRevenue / 4) * (4 - i);
    return { value, label: formatCompactZAR(value) };
  });

  return (
    <div
      className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-6"
      data-testid="revenue-trend"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">
            Revenue Trend
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Monthly recurring revenue — last 12 months
          </p>
        </div>
        {data.length > 0 && (
          <div className="text-right">
            <p
              className="text-lg font-bold text-slate-100"
              style={{ fontVariantNumeric: "tabular-nums" }}
              data-testid="trend-current-value"
            >
              {formatFullZAR(data[currentIndex].revenueZAR)}
            </p>
            <p className="text-xs text-slate-500">this month</p>
          </div>
        )}
      </div>

      {/* Chart area */}
      <div className="mt-6 flex gap-2" data-testid="trend-chart">
        {/* Y-axis labels */}
        <div
          className="flex w-14 shrink-0 flex-col justify-between pb-7 text-right"
          aria-hidden="true"
        >
          {yTicks.map((tick) => (
            <span
              key={tick.value}
              className="text-[0.625rem] text-slate-600"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {tick.label}
            </span>
          ))}
        </div>

        {/* Bars */}
        <div className="flex flex-1 items-end gap-1">
          {data.map((item, index) => {
            const heightPercent = (item.revenueZAR / maxRevenue) * 100;
            const isCurrent = index === currentIndex;

            return (
              <div
                key={`${item.month}-${item.year}`}
                className="group flex flex-1 flex-col items-center"
                data-testid={`trend-bar-${index}`}
              >
                {/* Tooltip on hover */}
                <div className="relative mb-1">
                  <div className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-[0.625rem] text-slate-300 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                    <span style={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatFullZAR(item.revenueZAR)}
                    </span>
                    <br />
                    <span className="text-slate-500">{item.label}</span>
                  </div>
                </div>

                {/* Bar */}
                <div
                  className="relative w-full overflow-hidden rounded-t-sm"
                  style={{
                    height: `${Math.max(heightPercent, 2)}%`,
                    minHeight: "4px",
                    maxHeight: "200px",
                  }}
                >
                  <div
                    className={`absolute inset-0 transition-colors ${
                      isCurrent
                        ? "bg-purple-500"
                        : "bg-purple-500/40 group-hover:bg-purple-500/60"
                    }`}
                  />
                  {/* Gradient overlay for depth */}
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
                </div>

                {/* Month label */}
                <span
                  className={`mt-1.5 text-[0.5625rem] ${
                    isCurrent
                      ? "font-semibold text-purple-400"
                      : "text-slate-600"
                  }`}
                >
                  {item.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart wrapper with fixed height */}
      <style>{`
        [data-testid="trend-chart"] .group {
          height: 220px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }
        [data-testid="trend-chart"] > div:first-child {
          height: 200px;
        }
      `}</style>
    </div>
  );
}

export { RevenueTrend };
export type { MonthlyTrendItem, RevenueTrendProps };
