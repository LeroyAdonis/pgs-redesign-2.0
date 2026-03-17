"use client";

import { Card } from "@/components/layout/Card";
import { cn } from "@/lib/utils";
import { useAnalyticsFetch } from "./useAnalyticsFetch";
import { AnalyticsShimmer, AnalyticsError, AnalyticsEmpty } from "./AnalyticsShimmer";
import type { PostAnalytics } from "@/lib/analytics/types";

// ─── Types ──────────────────────────────────────────────────────

interface ContentStats {
  avgEngagement: number;
  avgReach: number;
  postCount: number;
}

// ─── Helpers ────────────────────────────────────────────────────

function deriveContentPerformance(posts: PostAnalytics[]): {
  ai: ContentStats;
  manual: ContentStats;
} {
  const ai: ContentStats = { avgEngagement: 0, avgReach: 0, postCount: 0 };
  const manual: ContentStats = { avgEngagement: 0, avgReach: 0, postCount: 0 };

  let aiEngTotal = 0;
  let aiReachTotal = 0;
  let manualEngTotal = 0;
  let manualReachTotal = 0;

  for (const post of posts) {
    if (post.aiGenerated) {
      ai.postCount++;
      aiEngTotal += post.metrics.engagementRate ?? 0;
      aiReachTotal += post.metrics.reach;
    } else {
      manual.postCount++;
      manualEngTotal += post.metrics.engagementRate ?? 0;
      manualReachTotal += post.metrics.reach;
    }
  }

  ai.avgEngagement = ai.postCount > 0 ? aiEngTotal / ai.postCount : 0;
  ai.avgReach = ai.postCount > 0 ? aiReachTotal / ai.postCount : 0;
  manual.avgEngagement = manual.postCount > 0 ? manualEngTotal / manual.postCount : 0;
  manual.avgReach = manual.postCount > 0 ? manualReachTotal / manual.postCount : 0;

  return { ai, manual };
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-ZA");
}

// ─── Sparkles Icon ──────────────────────────────────────────────

function SparklesIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 2l.6 2.4a3.5 3.5 0 0 0 2.5 2.5L15.5 7.5l-2.4.6a3.5 3.5 0 0 0-2.5 2.5L10 13l-.6-2.4a3.5 3.5 0 0 0-2.5-2.5L4.5 7.5l2.4-.6a3.5 3.5 0 0 0 2.5-2.5L10 2Z" />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 3.5l3 3L7 16H4v-3L13.5 3.5Z" />
    </svg>
  );
}

// ─── Stat Row ───────────────────────────────────────────────────

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="font-mono text-sm font-semibold text-text">{value}</span>
    </div>
  );
}

// ─── Comparison Card ────────────────────────────────────────────

function ComparisonCard({
  title,
  icon,
  stats,
  accent,
}: {
  title: string;
  icon: React.ReactNode;
  stats: ContentStats;
  accent: string;
}) {
  return (
    <div className="flex-1 rounded-none border border-border bg-surface-raised p-4">
      <div className="mb-3 flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-none"
          style={{ backgroundColor: `${accent}18`, color: accent }}
        >
          {icon}
        </div>
        <span className="text-sm font-semibold text-text">{title}</span>
      </div>
      <div className="divide-y divide-border">
        <StatRow label="Avg Engagement" value={`${stats.avgEngagement.toFixed(1)}%`} />
        <StatRow label="Avg Reach" value={formatCompact(stats.avgReach)} />
        <StatRow label="Posts" value={stats.postCount.toString()} />
      </div>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────

/**
 * AI vs manual content comparison.
 *
 * Side-by-side cards showing average engagement, reach, and post count
 * for AI-generated vs manually created content.
 *
 * Derives data from the posts endpoint to avoid an extra API call.
 * Fetches from /api/analytics/posts?limit=50.
 */
export function ContentPerformance({ className }: { className?: string }) {
  const { data, loading, error, refetch } = useAnalyticsFetch<PostAnalytics[]>(
    "/api/analytics/posts?limit=50",
  );

  return (
    <Card as="section" padding="none" className={cn("overflow-hidden", className)}>
      {/* Header */}
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-display text-lg font-semibold text-text">
          AI vs Manual Content
        </h2>
      </div>

      {/* Content */}
      <div className="p-5">
        {loading && (
          <div data-testid="content-performance-loading">
            <AnalyticsShimmer lines={4} />
          </div>
        )}

        {error && <AnalyticsError message={error} onRetry={refetch} />}

        {!loading && !error && (!data || data.length === 0) && (
          <AnalyticsEmpty message="Publish AI and manual posts to compare performance." />
        )}

        {!loading && !error && data && data.length > 0 && (() => {
          const { ai, manual } = deriveContentPerformance(data);
          const winner =
            ai.postCount > 0 && manual.postCount > 0
              ? ai.avgEngagement > manual.avgEngagement
                ? "ai"
                : "manual"
              : null;

          return (
            <div data-testid="content-performance">
              <div className="flex gap-3">
                <ComparisonCard
                  title="AI Generated"
                  icon={<SparklesIcon />}
                  stats={ai}
                  accent="#8b5cf6"
                />
                <ComparisonCard
                  title="Manual"
                  icon={<PenIcon />}
                  stats={manual}
                  accent="#64748b"
                />
              </div>
              {winner && (
                <p className="mt-3 text-center text-xs text-text-muted">
                  {winner === "ai" ? "✨ " : "✏️ "}
                  <span className="font-medium text-text">
                    {winner === "ai" ? "AI-generated" : "Manual"}
                  </span>{" "}
                  content has higher average engagement
                </p>
              )}
            </div>
          );
        })()}
      </div>
    </Card>
  );
}
