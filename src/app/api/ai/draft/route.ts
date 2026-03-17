/**
 * POST /api/ai/draft — Save AI-generated content as a draft post
 *
 * Creates a post record with aiGenerated flag set.
 * Optionally stores media (images from generation).
 *
 * Enforces:
 *  - AI post limit for the org's tier
 *  - Credit balance (must have ≥ 1 credit)
 */

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { logger } from "@/lib/logger";
import { db } from "@/db";
import { post, postMedia, organizationMember } from "@/db/schema";
import { eq } from "drizzle-orm";
import { checkPostLimit } from "@/lib/payments/tier-enforcement";
import { hasEnoughCredits } from "@/lib/credits/credit-service";
import { TIER_CONFIGS } from "@/lib/payments/tier-config";
import { sanitizeText } from "@/lib/security/sanitize";
import { createRateLimiter } from "@/lib/security/rate-limit";

// ---------------------------------------------------------------------------
// Rate limiting — 10 AI draft requests / minute per user
// ---------------------------------------------------------------------------

const rateLimiter = createRateLimiter({ maxRequests: 10, windowMs: 60_000 });

interface DraftRequestMedia {
  type: "image" | "video" | "gif";
  dataUrl: string;
}

interface DraftRequest {
  content: string;
  platform: string;
  language: string;
  aiPrompt: string;
  aiModel: string;
  media?: DraftRequestMedia[];
}

interface DraftSuccessResponse {
  success: true;
  postId: string;
}

interface DraftErrorResponse {
  success: false;
  error: string;
  upgradeRequired?: string;
  current?: number;
  limit?: number;
}

type DraftResponse = DraftSuccessResponse | DraftErrorResponse;

export async function POST(
  request: Request,
): Promise<NextResponse<DraftResponse>> {
  try {
    // Auth check
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as DraftRequest;

    // --- Rate limit ---
    if (!rateLimiter.check(session.user.id).allowed) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please wait a minute before trying again." },
        { status: 429 },
      );
    }

    if (!body.content || !body.platform) {
      return NextResponse.json(
        { success: false, error: "content and platform are required" },
        { status: 400 },
      );
    }

    // Get user's org membership to determine orgId
    const memberships = await db
      .select()
      .from(organizationMember)
      .where(eq(organizationMember.userId, session.user.id))
      .limit(1);

    const membership = memberships[0];
    if (!membership) {
      return NextResponse.json(
        { success: false, error: "No organization found" },
        { status: 404 },
      );
    }

    const orgId = membership.orgId;

    // --- Tier enforcement: check AI post limit ---
    const postCheck = await checkPostLimit(orgId);
    if (!postCheck.allowed) {
      const upgradeName = postCheck.upgradeRequired
        ? TIER_CONFIGS[postCheck.upgradeRequired].displayName
        : undefined;

      logger.warn("AI post limit reached", {
        orgId,
        tier: postCheck.tier,
        current: postCheck.current,
        limit: postCheck.limit,
      });

      return NextResponse.json(
        {
          success: false,
          error: `You've reached your ${postCheck.limit} AI posts limit on the ${TIER_CONFIGS[postCheck.tier].displayName} plan.${upgradeName ? ` Upgrade to ${upgradeName} for more.` : ""}`,
          upgradeRequired: postCheck.upgradeRequired,
          current: postCheck.current,
          limit: postCheck.limit,
        },
        { status: 403 },
      );
    }

    // --- Credit balance check ---
    const hasCredits = await hasEnoughCredits(orgId, 1);
    if (!hasCredits) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Insufficient credits. Top up your credits or upgrade your plan for a larger monthly allocation.",
        },
        { status: 403 },
      );
    }

    // Validate platform against known values
    const validPlatforms = [
      "instagram",
      "facebook",
      "twitter",
      "linkedin",
      "tiktok",
      "whatsapp",
      "google_business",
    ] as const;
    type ValidPlatform = (typeof validPlatforms)[number];
    const platform = body.platform as ValidPlatform;

    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { success: false, error: "Invalid platform" },
        { status: 400 },
      );
    }

    // Insert the post — sanitize free-text content at the API boundary
    const [newPost] = await db
      .insert(post)
      .values({
        orgId,
        createdById: session.user.id,
        content: sanitizeText(body.content),
        contentLanguage: body.language ?? "en",
        platform,
        status: "draft",
        aiGenerated: true,
        aiPrompt: sanitizeText(body.aiPrompt),
        aiModel: body.aiModel,
      })
      .returning({ id: post.id });

    if (!newPost) {
      return NextResponse.json(
        { success: false, error: "Failed to create draft" },
        { status: 500 },
      );
    }

    // Insert media if provided
    if (body.media && body.media.length > 0) {
      const mediaValues = body.media.map((m, idx) => ({
        postId: newPost.id,
        mediaType: m.type as "image" | "video" | "gif",
        url: m.dataUrl,
        sortOrder: idx,
      }));

      await db.insert(postMedia).values(mediaValues);
    }

    logger.info("AI draft saved", {
      postId: newPost.id,
      platform: body.platform,
      orgId,
    });

    return NextResponse.json({
      success: true,
      postId: newPost.id,
    });
  } catch (error) {
    logger.error("Failed to save AI draft", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { success: false, error: "Failed to save draft" },
      { status: 500 },
    );
  }
}
