/**
 * Inngest functions — analytics metric fetching pipeline
 *
 * Background jobs for periodically fetching engagement metrics
 * from social platforms and recording them in the analytics table.
 *
 * Functions:
 * - analytics/fetch-initial: Event-driven, fetches first metrics 1hr after publish
 * - analytics/refresh-recent: Hourly cron, refreshes metrics for posts < 48hr old
 * - analytics/refresh-daily: Daily cron at 2am SAST (midnight UTC), refreshes 2–30 day old posts
 * - analytics/weekly-digest: Weekly cron Mon 8am SAST (6am UTC), compiles org digests
 *
 * All functions share `fetchAndRecordMetrics()` which handles the full
 * lookup → decrypt → fetch → record pipeline for a single postSchedule.
 */

import { inngest } from "./client";
import { db } from "@/db";
import {
  organization,
  organizationMember,
  postSchedule,
  socialAccount,
} from "@/db/schema";
import { eq, and, gte, lte, isNotNull } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { decrypt } from "@/lib/crypto";
import { getPublisher } from "@/lib/publishers";
import {
  recordMetrics,
  getOrgAnalytics,
  getTopPosts,
  getPlatformComparison,
} from "@/lib/analytics/analytics-service";
import { notifyWeeklyDigest } from "@/lib/notifications/notification-triggers";
import type { Platform } from "@/lib/social/types";

// ── Event type declarations ─────────────────────────────────────

type AnalyticsFetchInitialEvent = {
  name: "analytics/fetch-initial";
  data: {
    postScheduleId: string;
  };
};

// Suppress lint — type used for documentation/cast only
void (undefined as unknown as AnalyticsFetchInitialEvent);

// ── Shared helper ───────────────────────────────────────────────

/**
 * Fetch engagement metrics from the platform and record them
 * for a single postSchedule entry. Returns true on success.
 *
 * Gracefully handles missing data, disconnected accounts, and
 * platform API errors — logs warnings but never throws.
 */
async function fetchAndRecordMetrics(
  postScheduleId: string,
): Promise<boolean> {
  // 1. Look up postSchedule → socialAccountId, platformPostId
  const [schedule] = await db
    .select({
      socialAccountId: postSchedule.socialAccountId,
      platformPostId: postSchedule.platformPostId,
    })
    .from(postSchedule)
    .where(eq(postSchedule.id, postScheduleId))
    .limit(1);

  if (!schedule) {
    logger.warn("Analytics: postSchedule not found", { postScheduleId });
    return false;
  }

  if (!schedule.platformPostId) {
    logger.warn("Analytics: no platformPostId stored", { postScheduleId });
    return false;
  }

  // 2. Look up socialAccount → platform, accessTokenEncrypted
  const [account] = await db
    .select({
      platform: socialAccount.platform,
      accessTokenEncrypted: socialAccount.accessTokenEncrypted,
      isActive: socialAccount.isActive,
    })
    .from(socialAccount)
    .where(eq(socialAccount.id, schedule.socialAccountId))
    .limit(1);

  if (!account) {
    logger.warn("Analytics: social account not found", {
      postScheduleId,
      socialAccountId: schedule.socialAccountId,
    });
    return false;
  }

  if (!account.isActive || !account.accessTokenEncrypted) {
    logger.warn("Analytics: account inactive or missing token", {
      postScheduleId,
      isActive: account.isActive,
    });
    return false;
  }

  // 3. Decrypt access token
  const accessToken = decrypt(account.accessTokenEncrypted);

  // 4. Fetch metrics from platform
  const platform = account.platform as Platform;
  const publisher = getPublisher(platform);

  const metrics = await publisher.fetchMetrics({
    platformPostId: schedule.platformPostId,
    accessToken,
  });

  if (!metrics) {
    logger.warn("Analytics: platform returned no metrics", {
      postScheduleId,
      platform,
    });
    return false;
  }

  // 5. Record metrics (publisher EngagementMetrics → analytics EngagementMetrics)
  //    Pass engagementRate as null so recordMetrics auto-calculates it.
  await recordMetrics(postScheduleId, {
    ...metrics,
    engagementRate: null,
  });

  logger.info("Analytics: metrics recorded", {
    postScheduleId,
    platform,
    impressions: metrics.impressions,
  });

  return true;
}

// ── analytics/fetch-initial ─────────────────────────────────────

/**
 * Triggered after a post is successfully published.
 * Waits 1 hour for metrics to accumulate on the platform,
 * then fetches and records the initial engagement snapshot.
 */
export const fetchInitialMetrics = inngest.createFunction(
  {
    id: "analytics-fetch-initial",
    retries: 2,
  },
  { event: "analytics/fetch-initial" },
  async ({ event, step }) => {
    const { postScheduleId } =
      event.data as AnalyticsFetchInitialEvent["data"];

    // Wait 1 hour for platform metrics to accumulate
    await step.sleep("wait-1h", "1h");

    // Fetch and record metrics
    await step.run("fetch-metrics", async () => {
      const success = await fetchAndRecordMetrics(postScheduleId);

      if (!success) {
        logger.warn("analytics/fetch-initial: no metrics recorded", {
          postScheduleId,
        });
      }
    });
  },
);

// ── analytics/refresh-recent (hourly cron) ──────────────────────

const RECENT_BATCH_SIZE = 50;

/**
 * Hourly cron: refreshes metrics for all posts published
 * in the last 48 hours. Processes in batches of 50 to avoid
 * Inngest step timeouts.
 */
export const refreshRecentMetrics = inngest.createFunction(
  {
    id: "analytics-refresh-recent",
    retries: 1,
  },
  { cron: "0 * * * *" },
  async ({ step }) => {
    // Find all recently published postSchedules with a platformPostId
    const scheduleIds = await step.run("find-recent-posts", async () => {
      const now = new Date();
      const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      const rows = await db
        .select({ id: postSchedule.id })
        .from(postSchedule)
        .where(
          and(
            isNotNull(postSchedule.publishedAt),
            gte(postSchedule.publishedAt, cutoff),
            isNotNull(postSchedule.platformPostId),
          ),
        );

      logger.info("analytics/refresh-recent: found posts", {
        count: rows.length,
      });

      return rows.map((r) => r.id);
    });

    if (scheduleIds.length === 0) return;

    // Process in batches of RECENT_BATCH_SIZE
    const batchCount = Math.ceil(scheduleIds.length / RECENT_BATCH_SIZE);

    for (let i = 0; i < batchCount; i++) {
      const batch = scheduleIds.slice(
        i * RECENT_BATCH_SIZE,
        (i + 1) * RECENT_BATCH_SIZE,
      );

      await step.run(`refresh-batch-${i}`, async () => {
        let succeeded = 0;
        let failed = 0;

        for (const id of batch) {
          try {
            const ok = await fetchAndRecordMetrics(id);
            if (ok) succeeded++;
            else failed++;
          } catch (error) {
            failed++;
            logger.error("analytics/refresh-recent: batch item failed", {
              postScheduleId: id,
              error:
                error instanceof Error ? error.message : "Unknown error",
            });
          }
        }

        logger.info("analytics/refresh-recent: batch complete", {
          batchIndex: i,
          succeeded,
          failed,
          total: batch.length,
        });
      });
    }
  },
);

// ── Weekly digest types ──────────────────────────────────────────

interface WeeklyDigest {
  orgId: string;
  orgName: string;
  /** ISO date strings — Inngest serialises step returns via JSON */
  period: { from: string; to: string };
  summary: {
    totalImpressions: number;
    totalReach: number;
    avgEngagementRate: number;
    totalPostsPublished: number;
  };
  topPosts: Array<{
    content: string;
    platform: string;
    engagement: number;
  }>;
  platformBreakdown: Array<{
    platform: string;
    impressions: number;
    engagement: number;
  }>;
  trend: "up" | "down" | "stable"; // compare this week vs previous
}

// ── analytics/refresh-daily (daily cron at 2am SAST) ────────────

const DAILY_BATCH_SIZE = 100;

/**
 * Daily cron at 2am SAST (midnight UTC): refreshes metrics for
 * posts published 2–30 days ago. Older posts change more slowly
 * so daily granularity is sufficient.
 * Processes in batches of 100.
 */
export const refreshDailyMetrics = inngest.createFunction(
  {
    id: "analytics-refresh-daily",
    retries: 1,
  },
  { cron: "0 0 * * *" }, // Midnight UTC = 2am SAST (UTC+2)
  async ({ step }) => {
    // Find postSchedules published 2–30 days ago with a platformPostId
    const scheduleIds = await step.run("find-older-posts", async () => {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(
        now.getTime() - 30 * 24 * 60 * 60 * 1000,
      );

      const rows = await db
        .select({ id: postSchedule.id })
        .from(postSchedule)
        .where(
          and(
            isNotNull(postSchedule.publishedAt),
            lte(postSchedule.publishedAt, twoDaysAgo),
            gte(postSchedule.publishedAt, thirtyDaysAgo),
            isNotNull(postSchedule.platformPostId),
          ),
        );

      logger.info("analytics/refresh-daily: found posts", {
        count: rows.length,
      });

      return rows.map((r) => r.id);
    });

    if (scheduleIds.length === 0) return;

    // Process in batches of DAILY_BATCH_SIZE
    const batchCount = Math.ceil(scheduleIds.length / DAILY_BATCH_SIZE);

    for (let i = 0; i < batchCount; i++) {
      const batch = scheduleIds.slice(
        i * DAILY_BATCH_SIZE,
        (i + 1) * DAILY_BATCH_SIZE,
      );

      await step.run(`refresh-batch-${i}`, async () => {
        let succeeded = 0;
        let failed = 0;

        for (const id of batch) {
          try {
            const ok = await fetchAndRecordMetrics(id);
            if (ok) succeeded++;
            else failed++;
          } catch (error) {
            failed++;
            logger.error("analytics/refresh-daily: batch item failed", {
              postScheduleId: id,
              error:
                error instanceof Error ? error.message : "Unknown error",
            });
          }
        }

        logger.info("analytics/refresh-daily: batch complete", {
          batchIndex: i,
          succeeded,
          failed,
          total: batch.length,
        });
      });
    }
  },
);

// ── analytics/weekly-digest (Monday 8am SAST = 6am UTC) ────────

/** Engagement trend direction threshold (% change) */
const TREND_THRESHOLD = 5;

/**
 * Determine trend direction by comparing this week's total engagement
 * against the previous week.
 */
function determineTrend(
  currentWeekEngagement: number,
  previousWeekEngagement: number,
): "up" | "down" | "stable" {
  if (previousWeekEngagement === 0) {
    return currentWeekEngagement > 0 ? "up" : "stable";
  }

  const changePercent =
    ((currentWeekEngagement - previousWeekEngagement) /
      previousWeekEngagement) *
    100;

  if (changePercent > TREND_THRESHOLD) return "up";
  if (changePercent < -TREND_THRESHOLD) return "down";
  return "stable";
}

/**
 * Weekly cron: compiles an analytics digest for every organisation.
 *
 * Runs every Monday at 6:00 AM UTC (8:00 AM SAST) so teams get a
 * performance summary at the start of the South African work week.
 *
 * Each org's digest is compiled inside its own `step.run()` for
 * proper error isolation — one failing org does not block others.
 */
export const weeklyAnalyticsDigest = inngest.createFunction(
  {
    id: "analytics-weekly-digest",
    retries: 1,
  },
  { cron: "0 6 * * 1" }, // Monday 6am UTC = 8am SAST (UTC+2)
  async ({ step }) => {
    // 1. Fetch all organisations
    const orgs = await step.run("fetch-orgs", async () => {
      const rows = await db
        .select({ id: organization.id, name: organization.name })
        .from(organization);

      logger.info("analytics/weekly-digest: found organisations", {
        count: rows.length,
      });

      return rows;
    });

    if (orgs.length === 0) return;

    // 2. Compile digest for each org (each in its own step for isolation)
    const digests: WeeklyDigest[] = [];

    for (const org of orgs) {
      const digest = await step.run(
        `digest-${org.id}`,
        async (): Promise<WeeklyDigest | null> => {
          try {
            const now = new Date();
            const thisWeekFrom = new Date(
              now.getTime() - 7 * 24 * 60 * 60 * 1000,
            );
            const prevWeekFrom = new Date(
              now.getTime() - 14 * 24 * 60 * 60 * 1000,
            );

            const thisWeekRange = { from: thisWeekFrom, to: now };
            const prevWeekRange = { from: prevWeekFrom, to: thisWeekFrom };

            // Fetch this week's analytics
            const [orgAnalytics, topPosts, platformComparison] =
              await Promise.all([
                getOrgAnalytics(org.id, thisWeekRange),
                getTopPosts(org.id, 5, thisWeekRange),
                getPlatformComparison(org.id, thisWeekRange),
              ]);

            // Skip orgs with no data
            if (orgAnalytics.totalPosts === 0) {
              return null;
            }

            // Fetch previous week's analytics for trend comparison
            const prevAnalytics = await getOrgAnalytics(
              org.id,
              prevWeekRange,
            );

            const trend = determineTrend(
              orgAnalytics.totalEngagement,
              prevAnalytics.totalEngagement,
            );

            const weeklyDigest: WeeklyDigest = {
              orgId: org.id,
              orgName: org.name,
              period: {
                from: thisWeekRange.from.toISOString(),
                to: thisWeekRange.to.toISOString(),
              },
              summary: {
                totalImpressions: orgAnalytics.totalImpressions,
                totalReach: orgAnalytics.totalReach,
                avgEngagementRate: orgAnalytics.avgEngagementRate,
                totalPostsPublished: orgAnalytics.totalPosts,
              },
              topPosts: topPosts.map((p) => ({
                content: p.contentSnippet,
                platform: p.platform,
                engagement:
                  p.metrics.likes + p.metrics.shares + p.metrics.comments,
              })),
              platformBreakdown: platformComparison.map((pc) => ({
                platform: pc.platform,
                impressions: pc.impressions,
                engagement:
                  pc.likes + pc.shares + pc.comments,
              })),
              trend,
            };

            return weeklyDigest;
          } catch (error) {
            logger.warn("analytics/weekly-digest: org digest failed", {
              orgId: org.id,
              orgName: org.name,
              error:
                error instanceof Error ? error.message : "Unknown error",
            });
            return null;
          }
        },
      );

      if (digest) {
        digests.push(digest);
      }
    }

    // 3. Send digest notifications to all members of each org
    await step.run("send-digest-notifications", async () => {
      for (const digest of digests) {
        try {
          // Find all members of this organisation
          const members = await db
            .select({ userId: organizationMember.userId })
            .from(organizationMember)
            .where(eq(organizationMember.orgId, digest.orgId));

          for (const member of members) {
            await notifyWeeklyDigest(member.userId, {
              totalImpressions: digest.summary.totalImpressions,
              topPostId: digest.topPosts[0]
                ? undefined // topPosts has content not IDs; omit
                : undefined,
              trend:
                digest.trend === "stable"
                  ? "flat"
                  : digest.trend,
            });
          }

          logger.info("analytics/weekly-digest: notifications sent", {
            orgId: digest.orgId,
            memberCount: members.length,
          });
        } catch (error) {
          logger.warn(
            "analytics/weekly-digest: notification send failed",
            {
              orgId: digest.orgId,
              error:
                error instanceof Error ? error.message : "Unknown error",
            },
          );
        }
      }

      // Log summary
      for (const digest of digests) {
        logger.info("analytics/weekly-digest: digest compiled", {
          orgId: digest.orgId,
          orgName: digest.orgName,
          period: digest.period,
          summary: digest.summary,
          topPostCount: digest.topPosts.length,
          platformCount: digest.platformBreakdown.length,
          trend: digest.trend,
        });
      }

      logger.info("analytics/weekly-digest: run complete", {
        totalOrgs: orgs.length,
        digestsCompiled: digests.length,
        skipped: orgs.length - digests.length,
      });
    });
  },
);
