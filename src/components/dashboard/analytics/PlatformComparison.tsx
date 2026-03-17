"use client";

import { Card } from "@/components/layout/Card";
import { cn } from "@/lib/utils";
import { useAnalyticsFetch } from "./useAnalyticsFetch";
import { AnalyticsShimmer, AnalyticsError, AnalyticsEmpty } from "./AnalyticsShimmer";
import type { PlatformComparison as PlatformComparisonType } from "@/lib/analytics/types";

// ─── Platform Config ────────────────────────────────────────────

interface PlatformMeta {
  color: string;
  icon: React.ReactNode;
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="2" y="2" width="12" height="12" rx="3" />
      <circle cx="8" cy="8" r="3" />
      <circle cx="12" cy="4" r="0.5" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="2" y="2" width="12" height="12" rx="2" />
      <path d="M9 14V9h2l.5-2H9V6c0-.5.5-1 1-1h1.5V3H10c-1.5 0-2.5 1-2.5 2.5V7H6v2h1.5v5" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 13.5c1.5 1 3.5 1 5-.5 3 0 5-2 6-5 .5-1.5.5-3 0-4-.5.5-1.5 1-2.5.5-.5-1-2-1.5-3-.5-1 1-1 2.5-.5 4-2.5-.5-5-2-6.5-4-.5 1-.5 2.5.5 3.5-1 0-1.5-.5-1.5-.5s0 1.5 1.5 2.5c-.5 0-1.5 0-1.5 0s.5 1.5 2 2" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="2" y="2" width="12" height="12" rx="2" />
      <path d="M5 7v4M5 5v.01M8 11V8.5a1.5 1.5 0 1 1 3 0V11" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M8 3v8a2.5 2.5 0 1 1-2-2.45" />
      <path d="M8 5c1.5 0 3 .5 4 2" />
    </svg>
  );
}

function DefaultPlatformIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 5v6M5 8h6" />
    </svg>
  );
}

const PLATFORM_META: Record<string, PlatformMeta> = {
  instagram: { color: "#E4405F", icon: <InstagramIcon /> },
  facebook: { color: "#1877F2", icon: <FacebookIcon /> },
  twitter: { color: "#1DA1F2", icon: <TwitterIcon /> },
  linkedin: { color: "#0A66C2", icon: <LinkedInIcon /> },
  tiktok: { color: "#000000", icon: <TikTokIcon /> },
};

function getPlatformMeta(platform: string): PlatformMeta {
  return PLATFORM_META[platform.toLowerCase()] ?? { color: "#8b5cf6", icon: <DefaultPlatformIcon /> };
}

// ─── Helpers ────────────────────────────────────────────────────

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-ZA");
}

// ─── Component ──────────────────────────────────────────────────

/**
 * Platform comparison widget with horizontal bars.
 *
 * Compares total impressions per platform using proportional bars,
 * plus average engagement rate and post count.
 *
 * Fetches from /api/analytics/platforms.
 */
export function PlatformComparison({ className }: { className?: string }) {
  const { data, loading, error, refetch } = useAnalyticsFetch<PlatformComparisonType[]>(
    "/api/analytics/platforms",
  );

  return (
    <Card as="section" padding="none" className={cn("overflow-hidden", className)}>
      {/* Header */}
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-display text-lg font-semibold text-text">
          Platform Comparison
        </h2>
      </div>

      {/* Content */}
      <div className="p-5">
        {loading && (
          <div data-testid="platform-comparison-loading">
            <AnalyticsShimmer lines={4} />
          </div>
        )}

        {error && <AnalyticsError message={error} onRetry={refetch} />}

        {!loading && !error && (!data || data.length === 0) && (
          <AnalyticsEmpty message="Connect social accounts to compare platform performance." />
        )}

        {!loading && !error && data && data.length > 0 && (
          <div className="space-y-4" data-testid="platform-comparison">
            {(() => {
              const maxImpressions = Math.max(...data.map((p) => p.impressions), 1);
              return data.map((platform) => {
                const meta = getPlatformMeta(platform.platform);
                const barWidth = (platform.impressions / maxImpressions) * 100;
                return (
                  <div key={platform.platform} className="space-y-1.5">
                    {/* Platform header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-7 w-7 items-center justify-center rounded-none"
                          style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
                        >
                          {meta.icon}
                        </span>
                        <span className="text-sm font-medium capitalize text-text">
                          {platform.platform}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-muted">
                        <span>{formatCompact(platform.impressions)} impressions</span>
                        <span className="font-mono">{platform.avgEngagementRate.toFixed(1)}%</span>
                      </div>
                    </div>
                    {/* Bar */}
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-inset">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: meta.color,
                        }}
                      />
                    </div>
                    {/* Subtext */}
                    <div className="flex gap-4 text-[0.6875rem] text-text-muted">
                      <span>{platform.postCount} posts</span>
                      <span>{formatCompact(platform.reach)} reach</span>
                      <span>{formatCompact(platform.likes)} likes</span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
    </Card>
  );
}
