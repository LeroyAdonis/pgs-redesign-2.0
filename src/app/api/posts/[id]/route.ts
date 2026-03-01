/**
 * GET    /api/posts/[id] — Get a single post with its schedules
 * PATCH  /api/posts/[id] — Update a post
 * DELETE /api/posts/[id] — Delete a post (cascades to schedules)
 */

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { logger } from "@/lib/logger";
import { db } from "@/db";
import { post, postSchedule, postMedia } from "@/db/schema";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ── GET — single post ───────────────────────────────────────────

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const [foundPost] = await db
      .select()
      .from(post)
      .where(eq(post.id, id))
      .limit(1);

    if (!foundPost) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 },
      );
    }

    // Fetch associated schedules and media
    const schedules = await db
      .select()
      .from(postSchedule)
      .where(eq(postSchedule.postId, id));

    const media = await db
      .select()
      .from(postMedia)
      .where(eq(postMedia.postId, id));

    return NextResponse.json({
      success: true,
      post: foundPost,
      schedules,
      media,
    });
  } catch (error) {
    logger.error("Failed to get post", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, error: "Failed to get post" },
      { status: 500 },
    );
  }
}

// ── PATCH — update post ─────────────────────────────────────────

interface UpdatePostRequest {
  content?: string;
  contentLanguage?: string;
  platform?: string;
  status?: string;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = (await request.json()) as UpdatePostRequest;

    const updates: Record<string, unknown> = {};

    if (body.content !== undefined) {
      updates.content = body.content;
    }
    if (body.contentLanguage !== undefined) {
      updates.contentLanguage = body.contentLanguage;
    }
    if (body.platform !== undefined) {
      const validPlatforms = [
        "instagram",
        "facebook",
        "twitter",
        "linkedin",
        "tiktok",
        "whatsapp",
        "google_business",
      ];
      if (!validPlatforms.includes(body.platform)) {
        return NextResponse.json(
          { success: false, error: "Invalid platform" },
          { status: 400 },
        );
      }
      updates.platform = body.platform;
    }
    if (body.status !== undefined) {
      const validStatuses = [
        "draft",
        "scheduled",
        "publishing",
        "published",
        "failed",
      ];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: "Invalid status" },
          { status: 400 },
        );
      }
      updates.status = body.status;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 },
      );
    }

    const [updated] = await db
      .update(post)
      .set(updates)
      .where(eq(post.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, post: updated });
  } catch (error) {
    logger.error("Failed to update post", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, error: "Failed to update post" },
      { status: 500 },
    );
  }
}

// ── DELETE — delete post ────────────────────────────────────────

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

    // Post deletion cascades to schedules and media via FK constraints
    const [deleted] = await db
      .delete(post)
      .where(eq(post.id, id))
      .returning({ id: post.id });

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 },
      );
    }

    logger.info("Post deleted", { postId: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to delete post", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, error: "Failed to delete post" },
      { status: 500 },
    );
  }
}
