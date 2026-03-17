/**
 * Analytics service types
 *
 * Shared types for the analytics service layer, API routes,
 * and dashboard UI components.
 */

/** Raw engagement metrics for a single post */
export interface EngagementMetrics {
  impressions: number;
  reach: number;
  likes: number;
  shares: number;
  comments: number;
  clicks: number;
  engagementRate: number | null;
}

/** Engagement metrics enriched with post context */
export interface PostAnalytics {
  metrics: EngagementMetrics;
  postId: string;
  platform: string;
  /** First 120 characters of post content */
  contentSnippet: string;
  publishedAt: Date | null;
  aiGenerated: boolean;
}

/** Aggregated analytics summary for an organisation over a period */
export interface OrgAnalyticsSummary {
  totalImpressions: number;
  totalReach: number;
  totalEngagement: number;
  avgEngagementRate: number;
  topPlatform: string | null;
  totalPosts: number;
  periodDays: number;
}

/** Per-platform aggregate metrics */
export interface PlatformComparison {
  platform: string;
  impressions: number;
  reach: number;
  likes: number;
  shares: number;
  comments: number;
  clicks: number;
  avgEngagementRate: number;
  postCount: number;
}

/** Optimal posting time slot derived from historical data */
export interface BestPostingTime {
  /** 0 = Sunday, 1 = Monday, … 6 = Saturday */
  dayOfWeek: number;
  /** Hour of day (0-23) in SAST (UTC+2) */
  hour: number;
  avgEngagement: number;
  postCount: number;
}

/** AI-generated vs manually-created content comparison */
export interface ContentPerformance {
  aiGenerated: boolean;
  avgEngagement: number;
  avgReach: number;
  postCount: number;
}

/** Single data point in a daily engagement time-series */
export interface EngagementTrend {
  /** ISO date string, e.g. "2025-03-01" */
  date: string;
  impressions: number;
  reach: number;
  engagement: number;
  posts: number;
}

/** Date range filter for analytics queries */
export interface DateRange {
  from: Date;
  to: Date;
}
