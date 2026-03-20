/**
 * GET /api/admin/system — System health data
 *
 * Returns comprehensive system health information:
 * - Per-platform API health (response time, status)
 * - Rate limit usage per platform
 * - Recent error log entries
 * - Uptime history per service
 *
 * Uses realistic mock/simulated data since platform APIs
 * are not yet connected. Replace with live checks later.
 *
 * Requires admin role. Returns 401 if not authenticated,
 * 403 if authenticated but not admin.
 */

import { NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin-api-session";
import { logger } from "@/lib/logger";
import { generateSystemHealthData } from "@/lib/admin-system-data";

export async function GET() {
  try {
    const auth = await requireAdminApiSession();
    if ("error" in auth) return auth.error;

    const data = generateSystemHealthData();

    logger.info("System health data requested", {
      overallStatus: data.overallStatus,
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
