/**
 * Optimal posting time suggestions
 *
 * Analyzes existing analytics data to suggest the best posting times
 * per platform. Falls back to sensible SA timezone defaults (SAST, UTC+2)
 * when no analytics data exists.
 */

import { db } from "@/db";
import { analytic, postSchedule, post } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "@/lib/logger";
import type { OptimalTimeSlot, Platform } from "./types";

// ── Default optimal times (SAST, UTC+2) ─────────────────────────

/**
 * Default optimal posting times when no analytics data is available.
 * Based on general SA social media engagement patterns:
 * - 8:00 AM  — morning commute / start of day
 * - 12:00 PM — lunch break
 * - 5:00 PM  — end of workday
 * - 7:00 PM  — evening browsing
 */
const DEFAULT_HOURS = [8, 12, 17, 19];

/** Days with typically higher engagement (Mon–Fri, with Wed peak) */
const DEFAULT_DAYS = [1, 2, 3, 4, 5]; // Mon–Fri

function getDefaultSlots(platform: Platform): OptimalTimeSlot[] {
  const slots: OptimalTimeSlot[] = [];

  for (const day of DEFAULT_DAYS) {
    for (const hour of DEFAULT_HOURS) {
      // Score is higher for mid-week, mid-day
      const dayScore = day === 3 ? 0.8 : day >= 2 && day <= 4 ? 0.7 : 0.5;
      const hourScore =
        hour === 12 ? 0.85 : hour === 17 ? 0.8 : hour === 19 ? 0.75 : 0.6;
      const engagementScore = (dayScore + hourScore) / 2;

      slots.push({
        dayOfWeek: day,
        hour,
        engagementScore: Math.round(engagementScore * 100) / 100,
        platform,
      });
    }
  }

  // Sort by engagement score descending
  return slots.sort((a, b) => b.engagementScore - a.engagementScore);
}

// ── Analytics-based optimal times ───────────────────────────────

/**
 * Get optimal posting times for a platform based on historical analytics.
 * Falls back to default SAST-based times when insufficient data exists.
 */
export async function getOptimalTimes(
  orgId: string,
  platform: string,
): Promise<OptimalTimeSlot[]> {
  try {
    // Fetch analytics data joined with schedule and post
    const rows = await db
      .select({
        scheduledAt: postSchedule.scheduledAt,
        engagementRate: analytic.engagementRate,
        impressions: analytic.impressions,
        likes: analytic.likes,
        comments: analytic.comments,
        shares: analytic.shares,
      })
      .from(analytic)
      .innerJoin(postSchedule, eq(analytic.postScheduleId, postSchedule.id))
      .innerJoin(post, eq(postSchedule.postId, post.id))
      .where(
        and(
          eq(post.orgId, orgId),
          eq(
            post.platform,
            platform as "instagram" | "facebook" | "twitter" | "linkedin" | "tiktok" | "whatsapp" | "google_business",
          ),
        ),
      )
      .orderBy(desc(analytic.fetchedAt))
      .limit(200);

    // Need at least 10 data points for meaningful analysis
    if (rows.length < 10) {
      logger.info("Insufficient analytics data, using defaults", {
        orgId,
        platform,
        dataPoints: rows.length,
      });
      return getDefaultSlots(platform as Platform);
    }

    // Aggregate engagement by day-of-week + hour
    const slotMap = new Map<
      string,
      { totalScore: number; count: number; dayOfWeek: number; hour: number }
    >();

    for (const row of rows) {
      const date = new Date(row.scheduledAt);
      const dayOfWeek = date.getUTCDay();
      // Adjust to SAST (UTC+2) for hour calculation
      const hour = (date.getUTCHours() + 2) % 24;
      const key = `${dayOfWeek}-${hour}`;

      const engagement =
        row.engagementRate ??
        (row.impressions > 0
          ? (row.likes + row.comments + row.shares) / row.impressions
          : 0);

      const existing = slotMap.get(key);
      if (existing) {
        existing.totalScore += engagement;
        existing.count += 1;
      } else {
        slotMap.set(key, {
          totalScore: engagement,
          count: 1,
          dayOfWeek,
          hour,
        });
      }
    }

    // Convert to OptimalTimeSlot array
    const slots: OptimalTimeSlot[] = [];
    const maxScore = Math.max(
      ...Array.from(slotMap.values()).map((v) => v.totalScore / v.count),
      1,
    );

    for (const [, value] of slotMap) {
      const avgEngagement = value.totalScore / value.count;
      slots.push({
        dayOfWeek: value.dayOfWeek,
        hour: value.hour,
        // Normalize to 0–1 range
        engagementScore:
          Math.round((avgEngagement / maxScore) * 100) / 100,
        platform: platform as Platform,
      });
    }

    return slots.sort((a, b) => b.engagementScore - a.engagementScore);
  } catch (error) {
    logger.error("Failed to compute optimal times, using defaults", {
      error: error instanceof Error ? error.message : "Unknown error",
      orgId,
      platform,
    });
    return getDefaultSlots(platform as Platform);
  }
}

/**
 * Suggest the next optimal posting time after a given date.
 * Picks the highest-engagement slot that falls after `afterDate`.
 */
export async function suggestNextSlot(
  orgId: string,
  platform: string,
  afterDate: Date,
): Promise<Date> {
  const slots = await getOptimalTimes(orgId, platform);

  // Sort by engagement score (should already be sorted, but be explicit)
  const sorted = [...slots].sort(
    (a, b) => b.engagementScore - a.engagementScore,
  );

  // Try each slot, find the earliest occurrence after afterDate
  for (const slot of sorted) {
    const candidate = getNextOccurrence(afterDate, slot.dayOfWeek, slot.hour);
    if (candidate > afterDate) {
      return candidate;
    }
  }

  // Fallback: schedule for the next day at noon SAST
  const fallback = new Date(afterDate);
  fallback.setDate(fallback.getDate() + 1);
  fallback.setUTCHours(10, 0, 0, 0); // 10 UTC = 12 SAST
  return fallback;
}

/**
 * Get the next occurrence of a specific day-of-week + hour (SAST)
 * after the given date.
 */
function getNextOccurrence(
  after: Date,
  targetDay: number,
  targetHourSAST: number,
): Date {
  // Convert SAST hour to UTC
  const targetHourUTC = (targetHourSAST - 2 + 24) % 24;

  const result = new Date(after);
  result.setUTCHours(targetHourUTC, 0, 0, 0);

  // Find the next occurrence of the target day
  const currentDay = result.getUTCDay();
  let daysAhead = targetDay - currentDay;

  if (daysAhead < 0) {
    daysAhead += 7;
  } else if (daysAhead === 0 && result <= after) {
    daysAhead = 7;
  }

  result.setUTCDate(result.getUTCDate() + daysAhead);
  return result;
}

// Export for testing
export { getDefaultSlots, getNextOccurrence };
