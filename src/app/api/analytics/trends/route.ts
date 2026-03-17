/**
 * GET /api/analytics/trends — Daily engagement time-series
 *
 * Query params:
 *   days (optional) — number of days to look back (default 30, max 90)
 *
 * Returns an array of EngagementTrend data points.
 */

import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getEngagementTrends } from "@/lib/analytics/analytics-service";
import { requireOrgMembership } from "../_lib/utils";

export async function GET(request: Request) {
  try {
    const auth = await requireOrgMembership();
    if (!auth.ok) return auth.response;

    const url = new URL(request.url);
    const daysRaw = parseInt(url.searchParams.get("days") ?? "30", 10);
    const days = Math.min(Math.max(isNaN(daysRaw) ? 30 : daysRaw, 1), 90);

    const trends = await getEngagementTrends(auth.orgId, days);

    return NextResponse.json({ success: true, data: trends });
  } catch (error) {
    logger.error("Failed to fetch engagement trends", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, error: "Failed to fetch engagement trends" },
      { status: 500 },
    );
  }
}
