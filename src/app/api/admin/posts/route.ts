/**
 * GET /api/admin/posts — Fetch all posts with filtering
 *
 * Returns paginated posts with optional filters:
 * - status: draft | scheduled | publishing | published | failed
 * - platform: instagram | facebook | twitter | linkedin | tiktok | whatsapp | google_business
 * - search: content text search
 * - page / limit: pagination
 *
 * Joins with user and organization tables to include author name and org name.
 * Includes scheduled date from postSchedule if available.
 *
 * Requires admin role. Returns 401/403 for unauthorized requests.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin-api-session";
import { logger } from "@/lib/logger";
import { db } from "@/db";
import { post, user, organization, postSchedule } from "@/db/schema";
import { count, eq, ilike, and, desc, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminApiSession();
    if ("error" in auth) return auth.error;

    const { searchParams } = request.nextUrl;
    const statusFilter = searchParams.get("status");
    const platformFilter = searchParams.get("platform");
    const search = searchParams.get("search");
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")));
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions: SQL[] = [];

    if (statusFilter && statusFilter !== "all") {
      conditions.push(eq(post.status, statusFilter as "draft" | "scheduled" | "publishing" | "published" | "failed"));
    }

    if (platformFilter && platformFilter !== "all") {
      conditions.push(eq(post.platform, platformFilter as "instagram" | "facebook" | "twitter" | "linkedin" | "tiktok" | "whatsapp" | "google_business"));
    }

    if (search) {
      conditions.push(ilike(post.content, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch posts with author and org joins
    const [posts, totalResult] = await Promise.all([
      db
        .select({
          id: post.id,
          content: post.content,
          contentLanguage: post.contentLanguage,
          platform: post.platform,
          status: post.status,
          aiGenerated: post.aiGenerated,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          authorName: user.name,
          authorEmail: user.email,
          orgName: organization.name,
          orgId: post.orgId,
          scheduledAt: postSchedule.scheduledAt,
        })
        .from(post)
        .innerJoin(user, eq(post.createdById, user.id))
        .innerJoin(organization, eq(post.orgId, organization.id))
        .leftJoin(postSchedule, eq(post.id, postSchedule.postId))
        .where(whereClause)
        .orderBy(desc(post.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(post)
        .where(whereClause),
    ]);

    const total = totalResult[0]?.total ?? 0;

    return NextResponse.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Failed to fetch admin posts", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, error: "Failed to fetch posts" },
      { status: 500 },
    );
  }
}
