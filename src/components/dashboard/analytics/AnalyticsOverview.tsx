"use client";

import { Card } from "@/components/layout/Card";
import { cn } from "@/lib/utils";
import { useAnalyticsFetch } from "./useAnalyticsFetch";
import { StatCardShimmer, AnalyticsError, AnalyticsEmpty } from "./AnalyticsShimmer";
import type { OrgAnalyticsSummary } from "@/lib/analytics/types";

// ─── Icons (20×20) ──────────────────────────────────────────────

function ImpressionsIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z" />
      <circle cx="10" cy="10" r="3" />
    </svg>
  );
}

function ReachIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="10" cy="10" r="7" />
      <circle cx="10" cy="10" r="3" />
      <circle cx="10" cy="10" r="1" fill="currentColor" />
    </svg>
  );
}

function EngagementIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l4-6 3 4 4-8 3 5" />
    </svg>
  );
}

function PostsIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 3.5l3 3L7 16H4v-3L13.5 3.5Z" />
    </svg>
  );
}

function PlatformIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l2.4 4.8L20 8l-4 3.9.9 5.6L12 14.8 7.1 17.5l.9-5.6L4 8l5.6-1.2L12 2Z" />
    </svg>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-ZA");
}

function platformLabel(platform: string | null): string {
  if (!platform) return "—";
  return platform.charAt(0).toUpperCase() + platform.slice(1);
}

// ─── Component ──────────────────────────────────────────────────

/**
 * Analytics overview stat cards.
 *
 * Displays 5 KPI cards: impressions, reach, avg engagement rate,
 * total posts analysed, and top-performing platform.
 *
 * Fetches from /api/analytics/overview.
 */
export function AnalyticsOverview({ className }: { className?: string }) {
  const { data, loading, error, refetch } = useAnalyticsFetch<OrgAnalyticsSummary>(
    "/api/analytics/overview",
  );

  if (loading) {
    return (
      <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-5", className)} data-testid="analytics-overview-loading">
        {Array.from({ length: 5 }, (_, i) => (
          <StatCardShimmer key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Card>
          <AnalyticsError message={error} onRetry={refetch} />
        </Card>
      </div>
    );
  }

  if (!data || data.totalPosts === 0) {
    return (
      <div className={className}>
        <Card>
          <AnalyticsEmpty />
        </Card>
      </div>
    );
  }

  const stats = [
    {
      icon: <ImpressionsIcon />,
      label: "Total Impressions",
      value: formatCompact(data.totalImpressions),
    },
    {
      icon: <ReachIcon />,
      label: "Total Reach",
      value: formatCompact(data.totalReach),
    },
    {
      icon: <EngagementIcon />,
      label: "Avg Engagement",
      value: `${data.avgEngagementRate.toFixed(1)}%`,
    },
    {
      icon: <PostsIcon />,
      label: "Posts Analysed",
      value: formatCompact(data.totalPosts),
    },
    {
      icon: <PlatformIcon />,
      label: "Top Platform",
      value: platformLabel(data.topPlatform),
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-5", className)} data-testid="analytics-overview">
      {stats.map((stat) => (
        <div key={stat.label}>
          <Card interactive>
            {/* Top accent bar */}
            <div
              aria-hidden="true"
              className="absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-brand to-brand-vivid opacity-0 transition-opacity group-hover:opacity-100"
            />
            {/* Icon */}
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-brand-surface text-brand">
              {stat.icon}
            </div>
            {/* Label */}
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">
              {stat.label}
            </div>
            {/* Value */}
            <div className="font-display text-3xl leading-none tracking-tight text-text">
              {stat.value}
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}
