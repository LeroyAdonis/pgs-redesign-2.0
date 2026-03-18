/**
 * GET /api/admin/stats — Platform-wide admin statistics
 *
 * Returns aggregate stats for the admin dashboard overview:
 * - Total users
 * - Active social accounts
 * - Posts created today
 * - System status
 *
 * Requires admin role. Returns 401 if not authenticated,
 * 403 if authenticated but not admin.
 */

import { NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin-api-session";
import { logger } from "@/lib/logger";
import { db } from "@/db";
import { user, socialAccount, post } from "@/db/schema";
import { count, eq, gte } from "drizzle-orm";

export async function GET() {
  try {
    const auth = await requireAdminApiSession();
    if ("error" in auth) return auth.error;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [usersResult, accountsResult, postsResult] = await Promise.all([
      db.select({ total: count() }).from(user),
      db
        .select({ total: count() })
        .from(socialAccount)
        .where(eq(socialAccount.isActive, true)),
      db
        .select({ total: count() })
        .from(post)
        .where(gte(post.createdAt, todayStart)),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: usersResult[0]?.total ?? 0,
        activeAccounts: accountsResult[0]?.total ?? 0,
        postsToday: postsResult[0]?.total ?? 0,
        systemStatus: "operational",
      },
    });
  } catch (error) {
    logger.error("Failed to fetch admin stats", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, error: "Failed to fetch admin stats" },
      { status: 500 },
    );
  }
}
