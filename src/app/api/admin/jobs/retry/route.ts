/**
 * POST /api/admin/jobs/retry — Retry a failed Inngest job
 *
 * Accepts a run ID and function ID, and re-invokes the function
 * via the Inngest client.
 *
 * Currently a stub that simulates the retry operation.
 * In production, this would use `inngest.send()` to dispatch
 * a retry event for the failed run.
 *
 * Requires admin role. Returns 401 if not authenticated,
 * 403 if authenticated but not admin.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin-api-session";
import { logger } from "@/lib/logger";
import type { JobRetryRequest, JobRetryResponse } from "@/types/admin-jobs";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminApiSession();
    if ("error" in auth) return auth.error;
    const { session } = auth;

    const body = (await request.json()) as JobRetryRequest;

    if (!body.runId || !body.functionId) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields: runId and functionId",
        } satisfies JobRetryResponse,
        { status: 400 },
      );
    }

    logger.info("Admin triggered job retry", {
      runId: body.runId,
      functionId: body.functionId,
      adminUserId: session.user.id,
    });

    // Note: In production, replace the stub below with actual Inngest retry:
    //   await inngest.send({ name: `${body.functionId}/retry`, data: { originalRunId: body.runId } });

    return NextResponse.json({
      success: true,
      message: `Retry queued for ${body.functionId} (run: ${body.runId})`,
    } satisfies JobRetryResponse);
  } catch (error) {
    logger.error("Failed to retry job", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      {
        success: false,
        message: "Failed to retry job",
        error: error instanceof Error ? error.message : "Unknown error",
      } satisfies JobRetryResponse,
      { status: 500 },
    );
  }
}
