"use client";

import { Card } from "@/components/layout/Card";
import { cn } from "@/lib/utils";
import { useAnalyticsFetch } from "./useAnalyticsFetch";
import { AnalyticsShimmer, AnalyticsError, AnalyticsEmpty } from "./AnalyticsShimmer";
import type { PostAnalytics } from "@/lib/analytics/types";

// ─── Platform Colors ────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E4405F",
  facebook: "#1877F2",
  twitter: "#1DA1F2",
  linkedin: "#0A66C2",
  tiktok: "#000000",
};

function getPlatformColor(platform: string): string {
  return PLATFORM_COLORS[platform.toLowerCase()] ?? "#8b5cf6";
}

// ─── Helpers ────────────────────────────────────────────────────

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-ZA");
}

function formatDate(dateStr: string | Date | null): string {
  if (!dateStr) return "—";
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return d.toLocaleDateString("en-ZA", {
    month: "short",
    day: "numeric",
    timeZone: "Africa/Johannesburg",
  });
}

// ─── Component ──────────────────────────────────────────────────

/**
 * Top performing posts list.
 *
 * Shows top 10 posts with platform, content snippet, and engagement metrics.
 * Fetches from /api/analytics/posts?limit=10.
 */
export function TopPosts({ className }: { className?: string }) {
  const { data, loading, error, refetch } = useAnalyticsFetch<PostAnalytics[]>(
    "/api/analytics/posts?limit=10",
  );

  return (
    <Card as="section" padding="none" className={cn("overflow-hidden", className)}>
      {/* Header */}
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-display text-lg font-semibold text-text">
          Top Posts
        </h2>
      </div>

      {/* Content */}
      <div>
        {loading && (
          <div className="p-5" data-testid="top-posts-loading">
            <AnalyticsShimmer lines={6} />
          </div>
        )}

        {error && (
          <div className="p-5">
            <AnalyticsError message={error} onRetry={refetch} />
          </div>
        )}

        {!loading && !error && (!data || data.length === 0) && (
          <div className="p-5">
            <AnalyticsEmpty message="No post performance data available yet." />
          </div>
        )}

        {!loading && !error && data && data.length > 0 && (
          <ul className="divide-y divide-border" role="list" data-testid="top-posts">
            {data.map((post, idx) => {
              const platformColor = getPlatformColor(post.platform);
              return (
                <li
                  key={post.postId}
                  className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-surface-inset/50"
                >
                  {/* Rank */}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-surface font-mono text-xs font-semibold text-brand">
                    {idx + 1}
                  </span>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm text-text">
                      {post.contentSnippet || "Untitled post"}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {/* Platform badge */}
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium capitalize"
                        style={{
                          backgroundColor: `${platformColor}15`,
                          color: platformColor,
                        }}
                      >
                        {post.platform}
                      </span>

                      {/* AI badge */}
                      {post.aiGenerated && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-surface px-2 py-0.5 text-[0.6875rem] font-medium text-brand">
                          ✨ AI
                        </span>
                      )}

                      {/* Date */}
                      <span className="text-[0.6875rem] text-text-muted">
                        {formatDate(post.publishedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="shrink-0 text-right">
                    <div className="font-mono text-sm font-semibold text-text">
                      {post.metrics.engagementRate !== null
                        ? `${post.metrics.engagementRate.toFixed(1)}%`
                        : "—"}
                    </div>
                    <div className="mt-0.5 text-[0.625rem] text-text-muted">
                      {formatCompact(post.metrics.impressions)} imp
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}
