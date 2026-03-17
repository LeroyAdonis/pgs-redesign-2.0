/**
 * Draft persistence service — server-side
 *
 * Saves AI-generated content as drafts in the post table,
 * and retrieves generation history for review.
 */

import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { post, postMedia, type mediaTypeEnum } from "@/db/schema";
import { logger } from "@/lib/logger";
import type { ContentPlatform } from "./types";

// ── Types ───────────────────────────────────────────────────────

/** Media to attach to a generated draft */
export interface DraftMedia {
  mediaType: (typeof mediaTypeEnum.enumValues)[number];
  url: string;
  altText?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
}

/** Result of saving a generated draft */
export interface SaveDraftResult {
  postId: string;
  mediaIds: string[];
}

// ── Platform mapping ────────────────────────────────────────────

/** Map ContentPlatform to the platformEnum values used in the DB */
const PLATFORM_MAP: Record<ContentPlatform, (typeof post.$inferInsert)["platform"]> = {
  instagram: "instagram",
  facebook: "facebook",
  twitter: "twitter",
  linkedin: "linkedin",
  tiktok: "tiktok",
};

// ── Public API ──────────────────────────────────────────────────

/**
 * Save AI-generated content as a draft post.
 *
 * Inserts into the `post` table with `aiGenerated: true` and
 * optionally inserts associated media into `postMedia`.
 */
export async function saveGeneratedDraft(
  orgId: string,
  userId: string,
  content: string,
  platform: ContentPlatform,
  media?: DraftMedia[],
  aiPrompt?: string,
  aiModel?: string,
): Promise<SaveDraftResult> {
  // Insert the post
  const insertedPosts = await db
    .insert(post)
    .values({
      orgId,
      createdById: userId,
      content,
      platform: PLATFORM_MAP[platform],
      status: "draft",
      aiGenerated: true,
      aiPrompt: aiPrompt ?? null,
      aiModel: aiModel ?? null,
    })
    .returning();

  const savedPost = insertedPosts[0];
  const mediaIds: string[] = [];

  logger.info("AI draft saved", {
    postId: savedPost.id,
    orgId,
    platform,
    aiGenerated: true,
  });

  // Insert media if provided
  if (media && media.length > 0) {
    const mediaValues = media.map((m, index) => ({
      postId: savedPost.id,
      mediaType: m.mediaType,
      url: m.url,
      altText: m.altText ?? null,
      width: m.width ?? null,
      height: m.height ?? null,
      sizeBytes: m.sizeBytes ?? null,
      sortOrder: index,
    }));

    const insertedMedia = await db
      .insert(postMedia)
      .values(mediaValues)
      .returning();

    for (const m of insertedMedia) {
      mediaIds.push(m.id);
    }

    logger.info("AI draft media saved", {
      postId: savedPost.id,
      mediaCount: mediaIds.length,
    });
  }

  return {
    postId: savedPost.id,
    mediaIds,
  };
}

/**
 * Fetch recent AI-generated drafts for an organization.
 *
 * Returns posts where `aiGenerated` is true, ordered by creation date
 * descending.
 */
export async function getGenerationHistory(
  orgId: string,
  limit: number = 20,
) {
  const drafts = await db
    .select()
    .from(post)
    .where(
      and(
        eq(post.orgId, orgId),
        eq(post.aiGenerated, true),
      ),
    )
    .orderBy(desc(post.createdAt))
    .limit(limit);

  return drafts;
}
