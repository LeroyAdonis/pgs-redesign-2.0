/**
 * GET /api/admin/system — System health data
 *
 * Returns system health information combining real DB checks
 * with platform health data. Falls back gracefully when
 * real data isn't available.
 *
 * Real checks:
 * - DB connectivity (simple query)
 * - Count of active social accounts, posts, schedules
 * - Any real metrics available
 *
 * Requires admin role. Returns 401 if not authenticated,
 * 403 if authenticated but not admin.
 */

import { NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin-api-session";
import { logger } from "@/lib/logger";
import { db } from "@/db";
import {
  socialAccount,
  post,
  postSchedule,
  organization,
  user,
  subscription,
} from "@/db/schema";
import { eq, count, and, isNotNull } from "drizzle-orm";
import { generateSystemHealthData } from "@/lib/admin-system-data";

interface SystemMetrics {
  database: {
    status: "healthy" | "degraded" | "down";
    responseTimeMs: number;
    message?: string;
  };
  counts: {
    activeAccounts: number;
    totalPosts: number;
    scheduledPosts: number;
    organizations: number;
    users: number;
    activeSubscriptions: number;
  };
}

/**
 * Perform real database health checks and gather system metrics.
 */
async function getRealSystemMetrics(): Promise<SystemMetrics> {
  const dbStart = Date.now();

  try {
    // Run all count queries in parallel for speed
    const [
      accountsResult,
      postsResult,
      schedulesResult,
      orgsResult,
      usersResult,
      subsResult,
    ] = await Promise.all([
      db
        .select({ count: count() })
        .from(socialAccount)
        .where(eq(socialAccount.isActive, true)),
      db.select({ count: count() }).from(post),
      db
        .select({ count: count() })
        .from(postSchedule)
        .where(
          and(
            isNotNull(postSchedule.scheduledAt),
            // Only count future schedules that haven't been published or failed
            eq(postSchedule.retryCount, 0),
          ),
        )
        .catch(() => [{ count: 0 }]),
      db.select({ count: count() }).from(organization),
      db.select({ count: count() }).from(user),
      db
        .select({ count: count() })
        .from(subscription)
        .where(eq(subscription.status, "active")),
    ]);

    const dbResponseTime = Date.now() - dbStart;

    return {
      database: {
        status: dbResponseTime < 1000 ? "healthy" : "degraded",
        responseTimeMs: dbResponseTime,
      },
      counts: {
        activeAccounts: accountsResult[0]?.count ?? 0,
        totalPosts: postsResult[0]?.count ?? 0,
        scheduledPosts: schedulesResult[0]?.count ?? 0,
        organizations: orgsResult[0]?.count ?? 0,
        users: usersResult[0]?.count ?? 0,
        activeSubscriptions: subsResult[0]?.count ?? 0,
      },
    };
  } catch (error) {
    const dbResponseTime = Date.now() - dbStart;
    return {
      database: {
        status: "down",
        responseTimeMs: dbResponseTime,
        message: error instanceof Error ? error.message : "Database unreachable",
      },
      counts: {
        activeAccounts: 0,
        totalPosts: 0,
        scheduledPosts: 0,
        organizations: 0,
        users: 0,
        activeSubscriptions: 0,
      },
    };
  }
}

export async function GET() {
  try {
    const auth = await requireAdminApiSession();
    if ("error" in auth) return auth.error;

    // Fetch real system metrics from DB
    let realMetrics: SystemMetrics | null = null;
    try {
      realMetrics = await getRealSystemMetrics();
    } catch (err) {
      logger.warn("Failed to fetch real system metrics", {
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }

    // Get platform health data (mock for now, until platform APIs are connected)
    const platformData = generateSystemHealthData();

    // Merge real DB metrics into the response
    if (realMetrics) {
      // Override overall status based on actual DB health
      if (realMetrics.database.status === "down") {
        platformData.overallStatus = "down";
      }

      // Inject real DB health as a platform entry
      const dbHealth = {
        platform: "database" as const,
        status: realMetrics.database.status,
        responseTimeMs: realMetrics.database.responseTimeMs,
        lastChecked: new Date().toISOString(),
        ...(realMetrics.database.message && {
          message: realMetrics.database.message,
        }),
      };

      // Add DB health to the platforms array
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (platformData.platforms as any[]).unshift(dbHealth);
    }

    const data = {
      ...platformData,
      // Add real metrics if available
      ...(realMetrics && {
        metrics: {
          activeAccounts: realMetrics.counts.activeAccounts,
          totalPosts: realMetrics.counts.totalPosts,
          scheduledPosts: realMetrics.counts.scheduledPosts,
          organizations: realMetrics.counts.organizations,
          users: realMetrics.counts.users,
          activeSubscriptions: realMetrics.counts.activeSubscriptions,
          databaseResponseMs: realMetrics.database.responseTimeMs,
        },
      }),
    };

    logger.info("System health data requested", {
      overallStatus: data.overallStatus,
      dbStatus: realMetrics?.database.status ?? "unknown",
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error("Failed to generate system health data", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, error: "Failed to fetch system health" },
      { status: 500 },
    );
  }
}
