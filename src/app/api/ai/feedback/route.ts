/**
 * POST /api/ai/feedback — Submit feedback on AI-generated content
 *
 * Records user ratings (thumbs_up/thumbs_down/edited) for AI output
 * quality tracking and model improvement.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { logger } from "@/lib/logger";
import { db } from "@/db";
import { aiFeedback, organizationMember } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sanitizeText } from "@/lib/security/sanitize";
import type { AIFeedbackData } from "@/lib/ai/types";
import { createRateLimiter } from "@/lib/security/rate-limit";

// ---------------------------------------------------------------------------
// Rate limiting — 10 AI feedback requests / minute per user
// ---------------------------------------------------------------------------

const rateLimiter = createRateLimiter({ maxRequests: 10, windowMs: 60_000 });

interface FeedbackSuccessResponse {
  success: true;
}

interface FeedbackErrorResponse {
  success: false;
  error: string;
}

type FeedbackResponse = FeedbackSuccessResponse | FeedbackErrorResponse;

export async function POST(
  request: Request,
): Promise<NextResponse<FeedbackResponse>> {
  try {
    // Auth check
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as AIFeedbackData;

    // --- Rate limit ---
    if (!rateLimiter.check(session.user.id).allowed) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please wait a minute before trying again." },
        { status: 429 },
      );
    }

    if (!body.rating || !body.originalContent || !body.platform || !body.contentType) {
      return NextResponse.json(
        { success: false, error: "rating, originalContent, platform, and contentType are required" },
        { status: 400 },
      );
    }

    // Validate rating
    const validRatings = ["thumbs_up", "thumbs_down", "edited"] as const;
    if (!validRatings.includes(body.rating)) {
      return NextResponse.json(
        { success: false, error: "Invalid rating value" },
        { status: 400 },
      );
    }

    // Get user's org
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

    // Validate content type
    const validContentTypes = ["text", "image", "video"] as const;
    if (!validContentTypes.includes(body.contentType)) {
      return NextResponse.json(
        { success: false, error: "Invalid content type" },
        { status: 400 },
      );
    }

    // Insert feedback — sanitize free-text content at the API boundary
    await db.insert(aiFeedback).values({
      orgId: membership.orgId,
      userId: session.user.id,
      rating: body.rating,
      originalContent: sanitizeText(body.originalContent),
      editedContent: body.editedContent ? sanitizeText(body.editedContent) : null,
      aiModel: body.aiModel ?? "unknown",
      aiPrompt: sanitizeText(body.aiPrompt),
      platform,
      contentType: body.contentType,
    });

    logger.info("AI feedback submitted", {
      rating: body.rating,
      platform: body.platform,
      contentType: body.contentType,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to save AI feedback", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { success: false, error: "Failed to save feedback" },
      { status: 500 },
    );
  }
}
