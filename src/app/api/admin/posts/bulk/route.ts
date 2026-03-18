/**
 * POST /api/admin/posts/bulk — Bulk post actions
 *
 * Supports three bulk operations on posts:
 * - approve: Set status to "published"
 * - reject:  Set status to "draft"
 * - delete:  Remove posts from database
 *
 * Request body: { action: "approve" | "reject" | "delete", postIds: string[] }
 *
 * Requires admin role. Returns 401/403 for unauthorized requests.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin-api-session";
import { logger } from "@/lib/logger";
import { db } from "@/db";
import { post } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

type BulkAction = "approve" | "reject" | "delete";

interface BulkActionRequest {
  action: BulkAction;
  postIds: string[];
}

const VALID_ACTIONS: BulkAction[] = ["approve", "reject", "delete"];

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminApiSession();
    if ("error" in auth) return auth.error;
    const { session } = auth;

    const body = (await request.json()) as BulkActionRequest;

    // Validate request body
    if (!body.action || !VALID_ACTIONS.includes(body.action)) {
      return NextResponse.json(
        { success: false, error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(", ")}` },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.postIds) || body.postIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "postIds must be a non-empty array" },
        { status: 400 },
      );
    }

    if (body.postIds.length > 100) {
      return NextResponse.json(
        { success: false, error: "Cannot process more than 100 posts at once" },
        { status: 400 },
      );
    }

    const { action, postIds } = body;
    let affected = 0;

    switch (action) {
      case "approve": {
        const result = await db
          .update(post)
          .set({ status: "published", updatedAt: new Date() })
          .where(inArray(post.id, postIds));
        affected = result.rowCount ?? 0;
        break;
      }
      case "reject": {
        const result = await db
          .update(post)
          .set({ status: "draft", updatedAt: new Date() })
          .where(inArray(post.id, postIds));
        affected = result.rowCount ?? 0;
        break;
      }
      case "delete": {
        const result = await db
          .delete(post)
          .where(inArray(post.id, postIds));
        affected = result.rowCount ?? 0;
        break;
      }
    }

    logger.info("Admin bulk post action completed", {
      action,
      requestedCount: postIds.length,
      affectedCount: affected,
      adminUserId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        action,
        affected,
      },
    });
  } catch (error) {
    logger.error("Failed to execute bulk post action", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, error: "Failed to execute bulk action" },
      { status: 500 },
    );
  }
}
