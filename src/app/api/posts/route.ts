/**
 * GET /api/posts — List posts with their schedules
 *
 * Returns paginated posts for the current org, optionally filtered
 * by status and platform. Includes associated schedule data.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { logger } from "@/lib/logger";
import { db } from "@/db";
import {
  post,
  postSchedule,
  organizationMember,
} from "@/db/schema";
import { eq, and, desc, count, inArray } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get org membership
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

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const platform = url.searchParams.get("platform");
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") ?? "20", 10),
      100,
    );
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions = [eq(post.orgId, membership.orgId)];

    if (status) {
      const validStatuses = [
        "draft",
        "scheduled",
        "publishing",
        "published",
        "failed",
      ];
      if (validStatuses.includes(status)) {
        conditions.push(
          eq(
            post.status,
            status as "draft" | "scheduled" | "publishing" | "published" | "failed",
          ),
        );
      }
    }

    if (platform) {
      const validPlatforms = [
        "instagram",
        "facebook",
        "twitter",
        "linkedin",
        "tiktok",
        "whatsapp",
        "google_business",
      ];
      if (validPlatforms.includes(platform)) {
        conditions.push(
          eq(
            post.platform,
            platform as "instagram" | "facebook" | "twitter" | "linkedin" | "tiktok" | "whatsapp" | "google_business",
          ),
        );
      }
    }

    const whereClause = and(...conditions);

    // Get total count
    const [countResult] = await db
      .select({ value: count() })
      .from(post)
      .where(whereClause);

    const total = countResult?.value ?? 0;

    // Get posts with left-joined schedules
    const rows = await db
      .select()
      .from(post)
      .leftJoin(postSchedule, eq(post.id, postSchedule.postId))
      .where(whereClause)
      .orderBy(desc(post.createdAt))
      .limit(limit)
      .offset(offset);

    // Group schedules by post
    const postMap = new Map<
      string,
      {
        post: typeof post.$inferSelect;
        schedules: (typeof postSchedule.$inferSelect)[];
      }
    >();

    for (const row of rows) {
      const existing = postMap.get(row.post.id);
      if (existing) {
        if (row.post_schedule) {
          existing.schedules.push(row.post_schedule);
        }
      } else {
        postMap.set(row.post.id, {
          post: row.post,
          schedules: row.post_schedule ? [row.post_schedule] : [],
        });
      }
    }

    const posts = Array.from(postMap.values());

    return NextResponse.json({ success: true, posts, total, page, limit });
  } catch (error) {
    logger.error("Failed to list posts", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, error: "Failed to list posts" },
      { status: 500 },
    );
  }
}
