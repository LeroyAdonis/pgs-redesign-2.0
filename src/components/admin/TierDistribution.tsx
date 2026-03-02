/**
 * Tier distribution visualization
 *
 * Shows subscriber distribution across subscription tiers
 * using horizontal bar segments with tier-specific colors.
 *
 * Colors:
 * - Seedling: green
 * - Hustler: amber
 * - Grower: blue
 * - Mogul: purple
 */

"use client";

import type { Tier } from "@/lib/payments/tier-config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TierDistributionItem {
  tier: Tier;
  displayName: string;
  count: number;
  percentage: number;
  revenueZAR: number;
}

interface TierDistributionProps {
  data: TierDistributionItem[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIER_COLORS: Record<
  Tier,
  { bg: string; bar: string; text: string; accent: string }
> = {
  seedling: {
    bg: "bg-emerald-500/10",
    bar: "bg-emerald-500",
    text: "text-emerald-400",
    accent: "border-emerald-500/30",
  },
  hustler: {
    bg: "bg-amber-500/10",
    bar: "bg-amber-500",
    text: "text-amber-400",
    accent: "border-amber-500/30",
  },
  grower: {
    bg: "bg-blue-500/10",
    bar: "bg-blue-500",
    text: "text-blue-400",
    accent: "border-blue-500/30",
  },
  mogul: {
    bg: "bg-purple-500/10",
    bar: "bg-purple-500",
    text: "text-purple-400",
    accent: "border-purple-500/30",
  },
};

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function formatZAR(amount: number): string {
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `R ${formatted}`;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

function TierDistribution({ data }: TierDistributionProps) {
  const totalSubscribers = data.reduce((sum, item) => sum + item.count, 0);
  const totalRevenue = data.reduce((sum, item) => sum + item.revenueZAR, 0);

  return (
    <div
      className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-6"
      data-testid="tier-distribution"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">
            Tier Distribution
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {totalSubscribers.toLocaleString("en-ZA")} total subscribers
          </p>
        </div>
        <div className="text-right">
          <p
            className="text-sm font-semibold text-slate-200"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {formatZAR(totalRevenue)}
          </p>
          <p className="text-xs text-slate-500">total MRR</p>
        </div>
      </div>

      {/* Stacked bar */}
      <div
        className="mt-5 flex h-4 overflow-hidden rounded-full bg-slate-800"
        data-testid="tier-stacked-bar"
        role="img"
        aria-label={`Tier distribution: ${data.map((d) => `${d.displayName} ${d.percentage.toFixed(0)}%`).join(", ")}`}
      >
        {data.map((item) => {
          if (item.percentage === 0) return null;
          const colors = TIER_COLORS[item.tier];
          return (
            <div
              key={item.tier}
              className={`${colors.bar} transition-all duration-500`}
              style={{ width: `${item.percentage}%` }}
              title={`${item.displayName}: ${item.count} (${item.percentage.toFixed(1)}%)`}
              data-testid={`tier-bar-${item.tier}`}
            />
          );
        })}
      </div>

      {/* Tier breakdown list */}
      <div className="mt-5 space-y-3" data-testid="tier-list">
        {data.map((item) => {
          const colors = TIER_COLORS[item.tier];
          return (
            <div
              key={item.tier}
              className={`flex items-center gap-3 rounded-lg border ${colors.accent} ${colors.bg} p-3`}
              data-testid={`tier-item-${item.tier}`}
            >
              {/* Color indicator */}
              <div className={`h-3 w-3 shrink-0 rounded-full ${colors.bar}`} />

              {/* Tier name */}
              <div className="flex-1">
                <p className={`text-sm font-medium ${colors.text}`}>
                  {item.displayName}
                </p>
              </div>

              {/* Count and percentage */}
              <div className="text-right">
                <p
                  className="text-sm font-semibold text-slate-200"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {item.count.toLocaleString("en-ZA")}
                </p>
                <p className="text-xs text-slate-500">
                  {item.percentage.toFixed(1)}%
                </p>
              </div>

              {/* Revenue */}
              <div className="w-28 text-right">
                <p
                  className="text-sm font-semibold text-slate-200"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {formatZAR(item.revenueZAR)}
                </p>
                <p className="text-xs text-slate-500">/ month</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { TierDistribution };
export type { TierDistributionItem, TierDistributionProps };
