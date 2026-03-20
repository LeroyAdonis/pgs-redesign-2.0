/**
 * GET /api/admin/jobs — Inngest job monitoring data
 *
 * Returns mock/simulated job run data for the admin job monitoring page.
 * Uses realistic function names from the actual Inngest setup.
 *
 * In production, this would query the Inngest REST API for real run data.
 * For now, returns deterministic mock data that exercises all UI states.
 *
 * Requires admin role. Returns 401 if not authenticated,
 * 403 if authenticated but not admin.
 */

import { NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin-api-session";
import { logger } from "@/lib/logger";
import type {
  JobRun,
  JobStats,
  JobsApiResponse,
  JobStatus,
} from "@/types/admin-jobs";

/** Inngest functions registered in this project */
const INNGEST_FUNCTIONS: Array<{
  id: string;
  name: string;
  event: string;
}> = [
  { id: "post-publish", name: "Publish Post", event: "post/publish" },
  { id: "post-retry", name: "Retry Post", event: "post/retry" },
  { id: "schedule-check", name: "Check Scheduled Posts", event: "cron" },
  {
    id: "notify-post-published",
    name: "Notify Post Published",
    event: "notification/post-published",
  },
  {
    id: "notify-post-failed",
    name: "Notify Post Failed",
    event: "notification/post-failed",
  },
  {
    id: "notify-low-credits",
    name: "Notify Low Credits",
    event: "notification/low-credits",
  },
  {
    id: "notify-check-expiring-tokens",
    name: "Check Expiring Tokens",
    event: "cron",
  },
  {
    id: "notify-admin-signup",
    name: "Admin Signup Alert",
    event: "notification/admin-signup",
  },
  {
    id: "notify-admin-subscription-change",
    name: "Subscription Change Alert",
    event: "notification/admin-subscription-change",
  },
  {
    id: "analytics-fetch-initial",
    name: "Fetch Initial Metrics",
    event: "analytics/fetch-initial",
  },
  {
    id: "analytics-refresh-recent",
    name: "Refresh Recent Metrics",
    event: "cron",
  },
  {
    id: "analytics-refresh-daily",
    name: "Refresh Daily Metrics",
    event: "cron",
  },
  {
    id: "analytics-weekly-digest",
    name: "Weekly Analytics Digest",
    event: "cron",
  },
];

/**
 * Generate realistic mock job runs.
 *
 * Uses a seeded approach so data is deterministic per request,
 * but varied enough to exercise all UI states.
 */
function generateMockJobs(): JobRun[] {
  const now = Date.now();
  const statuses: JobStatus[] = [
    "completed",
    "completed",
    "completed",
    "completed",
    "running",
    "queued",
    "failed",
    "completed",
    "completed",
    "running",
    "completed",
    "failed",
    "completed",
    "completed",
    "queued",
    "completed",
    "completed",
    "completed",
    "completed",
    "completed",
  ];

  return statuses.map((status, i) => {
    const fn = INNGEST_FUNCTIONS[i % INNGEST_FUNCTIONS.length];
    const minutesAgo = (i + 1) * 7;
    const startedAt = new Date(now - minutesAgo * 60 * 1000).toISOString();
    const durationMs = (i + 1) * 15000 + Math.floor(i * 3000);

    let endedAt: string | null = null;
    if (status === "completed" || status === "failed") {
      endedAt = new Date(
        new Date(startedAt).getTime() + durationMs,
      ).toISOString();
    }

    const errorMessage =
      status === "failed"
        ? i % 2 === 0
          ? "Platform API rate limit exceeded: 429 Too Many Requests. Retry after 60s."
          : "OAuth token expired for account acc_xK9mL2. Token refresh failed: invalid_grant."
        : null;

    return {
      id: `run_${String(i + 1).padStart(4, "0")}_${fn.id}`,
      functionId: fn.id,
      functionName: fn.name,
      status,
      startedAt,
      endedAt,
      attempt: status === "failed" ? 3 : 1,
      error: errorMessage,
      eventName: fn.event,
    };
  });
}

export async function GET() {
  try {
    const auth = await requireAdminApiSession();
    if ("error" in auth) return auth.error;

    const jobs = generateMockJobs();

    const stats: JobStats = {
      total: jobs.length,
      running: jobs.filter((j) => j.status === "running").length,
      failed: jobs.filter((j) => j.status === "failed").length,
      queued: jobs.filter((j) => j.status === "queued").length,
      completed: jobs.filter((j) => j.status === "completed").length,
    };

    return NextResponse.json({
      success: true,
      jobs,
      stats,
    } satisfies JobsApiResponse);
  } catch (error) {
    logger.error("Failed to fetch job monitoring data", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch job monitoring data",
      } satisfies Partial<JobsApiResponse>,
      { status: 500 },
    );
  }
}
