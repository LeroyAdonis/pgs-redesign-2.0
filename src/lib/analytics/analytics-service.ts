/**
 * Analytics service
 *
 * Core operations: record metrics from social platforms, query
 * aggregated analytics by org / platform / time, and compare
 * AI-generated vs manual content performance.
 *
 * All time-based grouping uses SAST (Africa/Johannesburg, UTC+2)
 * so dashboards reflect South African business hours.
 *
 * Atomicity note: the Neon HTTP driver does not support interactive
 * transactions — every mutation here is a single atomic statement
 * or a safe check-then-write sequence.
 */

import { db } from "@/db";
import { analytic, post, postSchedule } from "@/db/schema";
import {
  eq,
  and,
  gte,
  lte,
  desc,
  sql,
  isNotNull,
} from "drizzle-orm";
import { logger } from "@/lib/logger";
import type {
  EngagementMetrics,
  PostAnalytics,
  OrgAnalyticsSummary,
  PlatformComparison,
  BestPostingTime,
  ContentPerformance,
  EngagementTrend,
  DateRange,
} from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SAST_TZ = "Africa/Johannesburg";
const CONTENT_SNIPPET_LENGTH = 120;

/** Default date range: last 30 days up to now. */
function defaultDateRange(): DateRange {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 30);
  return { from, to };
}

/**
 * Shared WHERE conditions for org-level analytics queries.
 * Filters by orgId, published posts only, and optional date range.
 */
function orgFilters(orgId: string, range: DateRange) {
  return and(
    eq(post.orgId, orgId),
    isNotNull(postSchedule.publishedAt),
    gte(postSchedule.publishedAt, range.from),
    lte(postSchedule.publishedAt, range.to),
  );
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Record (upsert) engagement metrics for a published post.
 *
 * If metrics already exist for the given postScheduleId they are
 * overwritten; otherwise a new row is inserted. Engagement rate is
 * calculated automatically when not explicitly provided.
 */
export async function recordMetrics(
  postScheduleId: string,
  metrics: EngagementMetrics,
): Promise<void> {
  const engagementRate =
    metrics.engagementRate ??
    (metrics.impressions > 0
      ? ((metrics.likes + metrics.shares + metrics.comments) /
          metrics.impressions) *
        100
      : 0);

  const values = {
    impressions: metrics.impressions,
    reach: metrics.reach,
    likes: metrics.likes,
    shares: metrics.shares,
    comments: metrics.comments,
    clicks: metrics.clicks,
    engagementRate,
    fetchedAt: new Date(),
  };

  // Try update first; if no row existed, insert.
  const updated = await db
    .update(analytic)
    .set(values)
    .where(eq(analytic.postScheduleId, postScheduleId))
    .returning({ id: analytic.id });

  if (updated.length === 0) {
    await db
      .insert(analytic)
      .values({ postScheduleId, ...values });

    logger.info("Analytics recorded (insert)", { postScheduleId });
  } else {
    logger.info("Analytics recorded (update)", { postScheduleId });
  }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Retrieve engagement metrics for a single scheduled post,
 * enriched with post context (platform, content snippet, etc.).
 */
export async function getPostAnalytics(
  postScheduleId: string,
): Promise<PostAnalytics | null> {
  const rows = await db
    .select({
      impressions: analytic.impressions,
      reach: analytic.reach,
      likes: analytic.likes,
      shares: analytic.shares,
      comments: analytic.comments,
      clicks: analytic.clicks,
      engagementRate: analytic.engagementRate,
      postId: post.id,
      platform: post.platform,
      content: post.content,
      publishedAt: postSchedule.publishedAt,
      aiGenerated: post.aiGenerated,
    })
    .from(analytic)
    .innerJoin(postSchedule, eq(analytic.postScheduleId, postSchedule.id))
    .innerJoin(post, eq(postSchedule.postId, post.id))
    .where(eq(analytic.postScheduleId, postScheduleId))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    metrics: {
      impressions: row.impressions,
      reach: row.reach,
      likes: row.likes,
      shares: row.shares,
      comments: row.comments,
      clicks: row.clicks,
      engagementRate: row.engagementRate,
    },
    postId: row.postId,
    platform: row.platform,
    contentSnippet: row.content.slice(0, CONTENT_SNIPPET_LENGTH),
    publishedAt: row.publishedAt,
    aiGenerated: row.aiGenerated,
  };
}

/**
 * Aggregated analytics summary for an organisation over a period.
 *
 * Returns totals for impressions, reach and engagement, the average
 * engagement rate, the top-performing platform, post count, and the
 * period length in days.
 */
export async function getOrgAnalytics(
  orgId: string,
  dateRange?: DateRange,
): Promise<OrgAnalyticsSummary> {
  const range = dateRange ?? defaultDateRange();

  const summaryRows = await db
    .select({
      totalImpressions: sql<number>`COALESCE(SUM(${analytic.impressions}), 0)`,
      totalReach: sql<number>`COALESCE(SUM(${analytic.reach}), 0)`,
      totalEngagement: sql<number>`COALESCE(SUM(${analytic.likes} + ${analytic.shares} + ${analytic.comments}), 0)`,
      avgEngagementRate: sql<number>`COALESCE(AVG(${analytic.engagementRate}), 0)`,
      totalPosts: sql<number>`COUNT(DISTINCT ${post.id})`,
    })
    .from(analytic)
    .innerJoin(postSchedule, eq(analytic.postScheduleId, postSchedule.id))
    .innerJoin(post, eq(postSchedule.postId, post.id))
    .where(orgFilters(orgId, range));

  const summary = summaryRows[0];

  // Find the platform with the highest total engagement
  const topPlatformRows = await db
    .select({
      platform: post.platform,
    })
    .from(analytic)
    .innerJoin(postSchedule, eq(analytic.postScheduleId, postSchedule.id))
    .innerJoin(post, eq(postSchedule.postId, post.id))
    .where(orgFilters(orgId, range))
    .groupBy(post.platform)
    .orderBy(
      desc(
        sql`SUM(${analytic.likes} + ${analytic.shares} + ${analytic.comments})`,
      ),
    )
    .limit(1);

  const periodDays = Math.max(
    1,
    Math.ceil(
      (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24),
    ),
  );

  return {
    totalImpressions: Number(summary?.totalImpressions ?? 0),
    totalReach: Number(summary?.totalReach ?? 0),
    totalEngagement: Number(summary?.totalEngagement ?? 0),
    avgEngagementRate:
      Math.round(Number(summary?.avgEngagementRate ?? 0) * 100) / 100,
    topPlatform: topPlatformRows[0]?.platform ?? null,
    totalPosts: Number(summary?.totalPosts ?? 0),
    periodDays,
  };
}

/**
 * Per-platform breakdown of engagement metrics.
 *
 * Returns one entry per platform that has published analytics data
 * for the organisation within the given date range.
 */
export async function getPlatformComparison(
  orgId: string,
  dateRange?: DateRange,
): Promise<PlatformComparison[]> {
  const range = dateRange ?? defaultDateRange();

  const rows = await db
    .select({
      platform: post.platform,
      impressions: sql<number>`COALESCE(SUM(${analytic.impressions}), 0)`,
      reach: sql<number>`COALESCE(SUM(${analytic.reach}), 0)`,
      likes: sql<number>`COALESCE(SUM(${analytic.likes}), 0)`,
      shares: sql<number>`COALESCE(SUM(${analytic.shares}), 0)`,
      comments: sql<number>`COALESCE(SUM(${analytic.comments}), 0)`,
      clicks: sql<number>`COALESCE(SUM(${analytic.clicks}), 0)`,
      avgEngagementRate: sql<number>`COALESCE(AVG(${analytic.engagementRate}), 0)`,
      postCount: sql<number>`COUNT(DISTINCT ${post.id})`,
    })
    .from(analytic)
    .innerJoin(postSchedule, eq(analytic.postScheduleId, postSchedule.id))
    .innerJoin(post, eq(postSchedule.postId, post.id))
    .where(orgFilters(orgId, range))
    .groupBy(post.platform)
    .orderBy(
      desc(
        sql`SUM(${analytic.likes} + ${analytic.shares} + ${analytic.comments})`,
      ),
    );

  return rows.map((row) => ({
    platform: row.platform,
    impressions: Number(row.impressions),
    reach: Number(row.reach),
    likes: Number(row.likes),
    shares: Number(row.shares),
    comments: Number(row.comments),
    clicks: Number(row.clicks),
    avgEngagementRate: Math.round(Number(row.avgEngagementRate) * 100) / 100,
    postCount: Number(row.postCount),
  }));
}

/**
 * Analyse historical posting data to find the best day/hour
 * combinations ranked by average engagement.
 *
 * Day-of-week and hour are extracted in SAST (Africa/Johannesburg)
 * so the results align with South African business hours.
 */
export async function getBestPostingTimes(
  orgId: string,
): Promise<BestPostingTime[]> {
  const rows = await db
    .select({
      dayOfWeek: sql<number>`EXTRACT(DOW FROM ${postSchedule.publishedAt} AT TIME ZONE ${SAST_TZ})`,
      hour: sql<number>`EXTRACT(HOUR FROM ${postSchedule.publishedAt} AT TIME ZONE ${SAST_TZ})`,
      avgEngagement: sql<number>`AVG(${analytic.likes} + ${analytic.shares} + ${analytic.comments})`,
      postCount: sql<number>`COUNT(*)`,
    })
    .from(analytic)
    .innerJoin(postSchedule, eq(analytic.postScheduleId, postSchedule.id))
    .innerJoin(post, eq(postSchedule.postId, post.id))
    .where(
      and(eq(post.orgId, orgId), isNotNull(postSchedule.publishedAt)),
    )
    .groupBy(
      sql`EXTRACT(DOW FROM ${postSchedule.publishedAt} AT TIME ZONE ${SAST_TZ})`,
      sql`EXTRACT(HOUR FROM ${postSchedule.publishedAt} AT TIME ZONE ${SAST_TZ})`,
    )
    .orderBy(
      desc(
        sql`AVG(${analytic.likes} + ${analytic.shares} + ${analytic.comments})`,
      ),
    );

  return rows.map((row) => ({
    dayOfWeek: Number(row.dayOfWeek),
    hour: Number(row.hour),
    avgEngagement: Math.round(Number(row.avgEngagement) * 100) / 100,
    postCount: Number(row.postCount),
  }));
}

/**
 * Compare performance of AI-generated vs manually-created content.
 *
 * Returns two entries: one for `aiGenerated = true` and one for
 * `aiGenerated = false`, each with average engagement, average
 * reach, and post count. Returns an empty array if no data exists.
 */
export async function getContentPerformance(
  orgId: string,
  dateRange?: DateRange,
): Promise<ContentPerformance[]> {
  const range = dateRange ?? defaultDateRange();

  const rows = await db
    .select({
      aiGenerated: post.aiGenerated,
      avgEngagement: sql<number>`AVG(${analytic.likes} + ${analytic.shares} + ${analytic.comments})`,
      avgReach: sql<number>`AVG(${analytic.reach})`,
      postCount: sql<number>`COUNT(DISTINCT ${post.id})`,
    })
    .from(analytic)
    .innerJoin(postSchedule, eq(analytic.postScheduleId, postSchedule.id))
    .innerJoin(post, eq(postSchedule.postId, post.id))
    .where(orgFilters(orgId, range))
    .groupBy(post.aiGenerated);

  return rows.map((row) => ({
    aiGenerated: row.aiGenerated,
    avgEngagement: Math.round(Number(row.avgEngagement) * 100) / 100,
    avgReach: Math.round(Number(row.avgReach) * 100) / 100,
    postCount: Number(row.postCount),
  }));
}

/**
 * Daily engagement time-series for dashboard trend charts.
 *
 * Returns one data point per day (in SAST) for the requested
 * number of days (default 30), ordered chronologically.
 */
export async function getEngagementTrends(
  orgId: string,
  days = 30,
): Promise<EngagementTrend[]> {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - days);

  const rows = await db
    .select({
      date: sql<string>`(${postSchedule.publishedAt} AT TIME ZONE ${SAST_TZ})::date`,
      impressions: sql<number>`COALESCE(SUM(${analytic.impressions}), 0)`,
      reach: sql<number>`COALESCE(SUM(${analytic.reach}), 0)`,
      engagement: sql<number>`COALESCE(SUM(${analytic.likes} + ${analytic.shares} + ${analytic.comments}), 0)`,
      posts: sql<number>`COUNT(DISTINCT ${post.id})`,
    })
    .from(analytic)
    .innerJoin(postSchedule, eq(analytic.postScheduleId, postSchedule.id))
    .innerJoin(post, eq(postSchedule.postId, post.id))
    .where(orgFilters(orgId, { from, to }))
    .groupBy(
      sql`(${postSchedule.publishedAt} AT TIME ZONE ${SAST_TZ})::date`,
    )
    .orderBy(
      sql`(${postSchedule.publishedAt} AT TIME ZONE ${SAST_TZ})::date`,
    );

  return rows.map((row) => ({
    date: String(row.date),
    impressions: Number(row.impressions),
    reach: Number(row.reach),
    engagement: Number(row.engagement),
    posts: Number(row.posts),
  }));
}

/**
 * Top-performing posts for an organisation ranked by total
 * engagement (likes + shares + comments), descending.
 */
export async function getTopPosts(
  orgId: string,
  limit = 10,
  dateRange?: DateRange,
): Promise<PostAnalytics[]> {
  const range = dateRange ?? defaultDateRange();

  const rows = await db
    .select({
      impressions: analytic.impressions,
      reach: analytic.reach,
      likes: analytic.likes,
      shares: analytic.shares,
      comments: analytic.comments,
      clicks: analytic.clicks,
      engagementRate: analytic.engagementRate,
      postId: post.id,
      platform: post.platform,
      content: post.content,
      publishedAt: postSchedule.publishedAt,
      aiGenerated: post.aiGenerated,
    })
    .from(analytic)
    .innerJoin(postSchedule, eq(analytic.postScheduleId, postSchedule.id))
    .innerJoin(post, eq(postSchedule.postId, post.id))
    .where(orgFilters(orgId, range))
    .orderBy(
      desc(
        sql`${analytic.likes} + ${analytic.shares} + ${analytic.comments}`,
      ),
    )
    .limit(Math.min(limit, 100));

  return rows.map((row) => ({
    metrics: {
      impressions: row.impressions,
      reach: row.reach,
      likes: row.likes,
      shares: row.shares,
      comments: row.comments,
      clicks: row.clicks,
      engagementRate: row.engagementRate,
    },
    postId: row.postId,
    platform: row.platform,
    contentSnippet: row.content.slice(0, CONTENT_SNIPPET_LENGTH),
    publishedAt: row.publishedAt,
    aiGenerated: row.aiGenerated,
  }));
}
