/**
 * AI feedback service — server-side
 *
 * Collects user feedback on AI-generated content (thumbs up/down, edits),
 * aggregates statistics, and adjusts brand profiles based on patterns.
 */

import { eq, and, desc, sql, count } from "drizzle-orm";
import { db } from "@/db";
import { aiFeedback, brandProfile } from "@/db/schema";
import { logger } from "@/lib/logger";
import type { AIFeedback, FeedbackStats, ContentRating } from "./types";

// ── Types ───────────────────────────────────────────────────────

/** A feedback row from the database */
export type FeedbackRow = typeof aiFeedback.$inferSelect;

// ── Public API ──────────────────────────────────────────────────

/**
 * Submit user feedback on AI-generated content.
 */
export async function submitFeedback(
  feedback: AIFeedback,
): Promise<FeedbackRow> {
  const inserted = await db
    .insert(aiFeedback)
    .values({
      orgId: feedback.orgId,
      postId: feedback.postId ?? null,
      userId: feedback.userId,
      rating: feedback.rating,
      originalContent: feedback.originalContent,
      editedContent: feedback.editedContent ?? null,
      aiModel: feedback.aiModel,
      aiPrompt: feedback.aiPrompt,
      platform: feedback.platform,
      contentType: feedback.contentType,
    })
    .returning();

  const row = inserted[0];

  logger.info("AI feedback submitted", {
    feedbackId: row.id,
    orgId: feedback.orgId,
    rating: feedback.rating,
    contentType: feedback.contentType,
  });

  return row;
}

/**
 * Get aggregated feedback statistics for an organization.
 */
export async function getFeedbackStats(
  orgId: string,
): Promise<FeedbackStats> {
  const results = await db
    .select({
      rating: aiFeedback.rating,
      count: count(),
    })
    .from(aiFeedback)
    .where(eq(aiFeedback.orgId, orgId))
    .groupBy(aiFeedback.rating);

  let total = 0;
  let thumbsUp = 0;
  let thumbsDown = 0;
  let edited = 0;

  for (const row of results) {
    const c = Number(row.count);
    total += c;

    switch (row.rating as ContentRating) {
      case "thumbs_up":
        thumbsUp = c;
        break;
      case "thumbs_down":
        thumbsDown = c;
        break;
      case "edited":
        edited = c;
        break;
    }
  }

  const improvementScore = total > 0 ? (thumbsUp + edited) / total : 0;

  return {
    total,
    thumbsUp,
    thumbsDown,
    edited,
    improvementScore: Math.round(improvementScore * 100) / 100,
  };
}

/**
 * Get recent feedback entries for an organization.
 */
export async function getRecentFeedback(
  orgId: string,
  limit: number = 20,
): Promise<FeedbackRow[]> {
  const rows = await db
    .select()
    .from(aiFeedback)
    .where(eq(aiFeedback.orgId, orgId))
    .orderBy(desc(aiFeedback.createdAt))
    .limit(limit);

  return rows;
}

/**
 * Analyze feedback patterns and adjust brand profile weights.
 *
 * This looks at:
 * - "edited" feedback to understand what the user changed
 * - "thumbs_down" patterns to reduce unwanted tone/style
 * - "thumbs_up" patterns to reinforce good tone/style
 *
 * Adjusts the brand profile tone fingerprint based on aggregate signals.
 */
export async function updateBrandProfileFromFeedback(
  orgId: string,
): Promise<boolean> {
  // Fetch recent feedback with sufficient volume
  const feedbackRows = await db
    .select()
    .from(aiFeedback)
    .where(eq(aiFeedback.orgId, orgId))
    .orderBy(desc(aiFeedback.createdAt))
    .limit(100);

  if (feedbackRows.length < 5) {
    logger.info("Insufficient feedback for brand profile update", {
      orgId,
      feedbackCount: feedbackRows.length,
    });
    return false;
  }

  // Calculate positive signal ratio
  const positiveCount = feedbackRows.filter(
    (f) => f.rating === "thumbs_up" || f.rating === "edited",
  ).length;
  const negativeCount = feedbackRows.filter(
    (f) => f.rating === "thumbs_down",
  ).length;

  const positiveRatio = positiveCount / feedbackRows.length;

  // Only adjust if there's a clear signal (>60% positive or >40% negative)
  if (positiveRatio >= 0.4 && positiveRatio <= 0.6) {
    logger.info("Feedback signals inconclusive, skipping profile update", {
      orgId,
      positiveRatio,
    });
    return false;
  }

  // Fetch the org's brand profiles
  const profiles = await db
    .select()
    .from(brandProfile)
    .where(eq(brandProfile.orgId, orgId));

  if (profiles.length === 0) {
    logger.warn("No brand profiles found for feedback update", { orgId });
    return false;
  }

  // Adjust tone fingerprint weights
  // If positive feedback is high, reinforce current tone
  // If negative feedback is high, moderate extreme tones
  const adjustmentFactor = positiveRatio > 0.6 ? 0.05 : -0.05;

  for (const profile of profiles) {
    if (!profile.toneFingerprint) continue;

    const tone = { ...profile.toneFingerprint };
    const toneKeys = [
      "formal",
      "casual",
      "humorous",
      "professional",
      "inspirational",
      "educational",
    ] as const;

    for (const key of toneKeys) {
      // Nudge scores toward the middle if negative, reinforce if positive
      const current = tone[key];
      tone[key] = Math.max(0, Math.min(1, current + adjustmentFactor));
    }

    await db
      .update(brandProfile)
      .set({
        toneFingerprint: tone,
        updatedAt: new Date(),
      })
      .where(eq(brandProfile.id, profile.id));
  }

  logger.info("Brand profile updated from feedback", {
    orgId,
    profileCount: profiles.length,
    positiveRatio,
    adjustmentFactor,
  });

  return true;
}
