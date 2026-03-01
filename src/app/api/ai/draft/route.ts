/**
 * POST /api/ai/draft — Save AI-generated content as a draft post
 *
 * Creates a post record with aiGenerated flag set.
 * Optionally stores media (images from generation).
 */

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { logger } from "@/lib/logger";
import { db } from "@/db";
import { post, postMedia, organizationMember } from "@/db/schema";
import { eq } from "drizzle-orm";

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

    // Insert the post
    const [newPost] = await db
      .insert(post)
      .values({
        orgId: membership.orgId,
        createdById: session.user.id,
        content: body.content,
        contentLanguage: body.language ?? "en",
        platform,
        status: "draft",
        aiGenerated: true,
        aiPrompt: body.aiPrompt,
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
