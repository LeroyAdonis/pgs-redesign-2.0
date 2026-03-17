/**
 * Autonomous scheduling service
 *
 * Handles autonomous mode configuration, weekly batch generation,
 * auto-scheduling at optimal times, and tier-based limit checking.
 *
 * Note: The actual AI content generation happens client-side via Puter.js.
 * This service handles the server-side DB entries and scheduling logic.
 */

import { db } from "@/db";
import { post, organization } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { getScheduleCount, getOrgTier } from "./scheduling-service";
import { suggestNextSlot } from "./optimal-times";
import { createSchedule } from "./scheduling-service";
import {
  TIER_SCHEDULING_LIMITS,
  type AutonomousConfig,
  type Platform,
  type Tier,
} from "./types";

// ── Autonomous config ───────────────────────────────────────────

/**
 * Get the autonomous scheduling config for an org.
 * Returns null since no autonomous_config DB table exists yet.
 * This is a placeholder for future autonomous scheduling.
 */
export async function getAutonomousConfig(
  orgId: string,
): Promise<AutonomousConfig | null> {
  // Placeholder — no autonomous_config table exists yet.
  // When we add the table, this will query it.
  logger.debug("getAutonomousConfig called (placeholder)", { orgId });
  return null;
}

// ── Weekly batch generation ─────────────────────────────────────

/**
 * Create draft post entries for a weekly batch.
 *
 * This creates DB records with placeholder content. The actual AI-generated
 * content is filled in client-side via Puter.js, then the posts are
 * updated via PATCH /api/posts/[id].
 */
export async function generateWeeklyBatch(
  orgId: string,
  platforms: string[],
  language: string,
): Promise<{ postIds: string[] }> {
  // Check tier limits before creating
  const limitCheck = await checkTierLimits(orgId, platforms.length);
  if (!limitCheck.allowed) {
    throw new Error(limitCheck.reason ?? "Tier limit exceeded");
  }

  // Get the org owner to set as createdById
  const [org] = await db
    .select({ ownerId: organization.ownerId })
    .from(organization)
    .where(eq(organization.id, orgId))
    .limit(1);

  if (!org) {
    throw new Error(`Organization ${orgId} not found`);
  }

  const postIds: string[] = [];

  for (const platform of platforms) {
    const [newPost] = await db
      .insert(post)
      .values({
        orgId,
        createdById: org.ownerId,
        content: `[Pending AI generation for ${platform}]`,
        contentLanguage: language,
        platform: platform as Platform,
        status: "draft",
        aiGenerated: true,
      })
      .returning({ id: post.id });

    if (newPost) {
      postIds.push(newPost.id);
    }
  }

  logger.info("Weekly batch created", {
    orgId,
    platforms,
    postCount: postIds.length,
  });

  return { postIds };
}

// ── Auto-schedule batch ─────────────────────────────────────────

/**
 * Auto-schedule posts at optimal times across platforms.
 * Uses the optimal time suggestion engine to space out posts.
 */
export async function autoScheduleBatch(
  orgId: string,
  postIds: string[],
  platforms: string[],
  socialAccountId: string,
): Promise<(typeof import("@/db/schema").postSchedule.$inferSelect)[]> {
  const schedules: (typeof import("@/db/schema").postSchedule.$inferSelect)[] = [];
  let afterDate = new Date();

  for (const postId of postIds) {
    // Use the first platform for optimal time calculation
    const platform = platforms[0] ?? "instagram";
    const suggestedTime = await suggestNextSlot(orgId, platform, afterDate);

    const schedule = await createSchedule({
      postId,
      socialAccountId,
      scheduledAt: suggestedTime,
    });

    schedules.push(schedule);
    // Move the cursor forward so next post gets a later slot
    afterDate = suggestedTime;
  }

  logger.info("Auto-scheduled batch", {
    orgId,
    count: schedules.length,
  });

  return schedules;
}

// ── Tier limit checking ─────────────────────────────────────────

/**
 * Check whether an org can schedule more posts based on their tier.
 */
export async function checkTierLimits(
  orgId: string,
  requestedCount: number,
): Promise<{
  allowed: boolean;
  reason?: string;
  currentCount: number;
  maxAllowed: number;
}> {
  const tierString = await getOrgTier(orgId);
  const tier = tierString as Tier;
  const limits = TIER_SCHEDULING_LIMITS[tier] ?? TIER_SCHEDULING_LIMITS.seedling;
  const currentCount = await getScheduleCount(orgId);

  // -1 means unlimited
  if (limits.maxScheduledPosts === -1) {
    return {
      allowed: true,
      currentCount,
      maxAllowed: -1,
    };
  }

  const totalAfter = currentCount + requestedCount;

  if (totalAfter > limits.maxScheduledPosts) {
    return {
      allowed: false,
      reason: `Scheduling ${requestedCount} post(s) would exceed your ${tier} tier limit of ${limits.maxScheduledPosts} scheduled posts (currently ${currentCount})`,
      currentCount,
      maxAllowed: limits.maxScheduledPosts,
    };
  }

  return {
    allowed: true,
    currentCount,
    maxAllowed: limits.maxScheduledPosts,
  };
}
