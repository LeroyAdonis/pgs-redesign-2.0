/**
 * Platform distribution chart
 *
 * Visual horizontal bar chart showing social account count per platform.
 * Color-coded by platform brand identity.
 *
 * Client component for interactive hover/tooltip states.
 */

"use client";

import { useMemo } from "react";

// ─── Platform metadata ───

const PLATFORM_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; barColor: string }
> = {
  instagram: {
    label: "Instagram",
    color: "text-fuchsia-400",
    bgColor: "bg-fuchsia-500/10",
    barColor: "bg-fuchsia-500",
  },
  facebook: {
    label: "Facebook",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    barColor: "bg-blue-500",
  },
  twitter: {
    label: "Twitter / X",
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
    barColor: "bg-sky-500",
  },
  linkedin: {
    label: "LinkedIn",
    color: "text-blue-300",
    bgColor: "bg-blue-400/10",
    barColor: "bg-blue-400",
  },
  tiktok: {
    label: "TikTok",
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
    barColor: "bg-pink-500",
  },
  whatsapp: {
    label: "WhatsApp",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    barColor: "bg-emerald-500",
  },
  google_business: {
    label: "Google Business",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    barColor: "bg-amber-500",
  },
};

// ─── Types ───

interface PlatformCount {
  platform: string;
  count: number;
}

interface PlatformDistributionProps {
  /** Array of platform name + count pairs */
  data: PlatformCount[];
}

// ─── Platform icon SVGs (20×20) ───

function PlatformIcon({ platform }: { platform: string }) {
  const config = PLATFORM_CONFIG[platform];
  if (!config) return null;

  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bgColor} ${config.color}`}
      aria-hidden="true"
    >
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        {platform === "instagram" && (
          <>
            <rect x="2" y="2" width="12" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="12" cy="4" r="1" />
          </>
        )}
        {platform === "facebook" && (
          <path d="M9 2H7a3 3 0 00-3 3v2H2v2.5h2V14h2.5V9.5H9l.5-2.5H6.5V5a1 1 0 011-1H9V2z" />
        )}
        {platform === "twitter" && (
          <path d="M13.5 3.5l-4 4.5 4.5 5h-3l-2.5-3L5 13H2l4.5-5L2.5 3.5h3l2 2.5L10.5 3.5h3z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        )}
        {platform === "linkedin" && (
          <>
            <rect x="2" y="6" width="2.5" height="7" rx="0.5" />
            <circle cx="3.25" cy="3.5" r="1.5" />
            <path d="M7 6h2.2v1h.03A2.5 2.5 0 0114 8.5V13h-2.5V9a1.25 1.25 0 00-2.5 0v4H7V6z" />
          </>
        )}
        {platform === "tiktok" && (
          <path d="M10 2v8a3 3 0 11-2-2.83V5a5 5 0 003 1V2h-1z" fill="none" stroke="currentColor" strokeWidth="1.2" />
        )}
        {platform === "whatsapp" && (
          <>
            <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <path d="M5.5 9.5L5 12l2.5-.5M6 7a4 4 0 003 3" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </>
        )}
        {platform === "google_business" && (
          <>
            <rect x="3" y="6" width="10" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <path d="M3 8l5 3 5-3" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6 3h4v3H6z" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </>
        )}
      </svg>
    </span>
  );
}

// ─── Component ───

function PlatformDistribution({ data }: PlatformDistributionProps) {
  const { total, maxCount, sorted } = useMemo(() => {
    const t = data.reduce((sum, d) => sum + d.count, 0);
    const m = Math.max(...data.map((d) => d.count), 1);
    const s = [...data].sort((a, b) => b.count - a.count);
    return { total: t, maxCount: m, sorted: s };
  }, [data]);

  if (data.length === 0) {
    return (
      <div
        className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-5"
        data-testid="platform-distribution"
      >
        <h3 className="text-sm font-semibold text-slate-200">
          Platform Distribution
        </h3>
        <p className="mt-3 text-sm text-slate-500">
          No social accounts connected yet.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-5"
      data-testid="platform-distribution"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">
          Platform Distribution
        </h3>
        <span className="text-xs text-slate-500">
          {total} total {total === 1 ? "account" : "accounts"}
        </span>
      </div>

      <div className="space-y-3" role="list" aria-label="Platform distribution">
        {sorted.map(({ platform, count }) => {
          const config = PLATFORM_CONFIG[platform];
          const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
          const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

          return (
            <div
              key={platform}
              className="group flex items-center gap-3"
              role="listitem"
              data-testid={`platform-${platform}`}
            >
              <PlatformIcon platform={platform} />

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between">
                  <span className={`text-sm font-medium ${config?.color ?? "text-slate-300"}`}>
                    {config?.label ?? platform}
                  </span>
                  <span className="ml-2 text-xs tabular-nums text-slate-400">
                    {count} ({percentage}%)
                  </span>
                </div>

                {/* Bar */}
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${config?.barColor ?? "bg-slate-500"}`}
                    style={{ width: `${barWidth}%` }}
                    role="progressbar"
                    aria-valuenow={count}
                    aria-valuemin={0}
                    aria-valuemax={maxCount}
                    aria-label={`${config?.label ?? platform}: ${count} accounts, ${percentage}%`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { PlatformDistribution };
export type { PlatformCount, PlatformDistributionProps };
