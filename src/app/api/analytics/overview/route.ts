/**
 * GET /api/analytics/overview — Aggregated analytics summary for the org
 *
 * Query params:
 *   from (optional) — ISO date start of range
 *   to   (optional) — ISO date end of range
 *
 * Returns an OrgAnalyticsSummary JSON object.
 */

import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getOrgAnalytics } from "@/lib/analytics/analytics-service";
import { requireOrgMembership, parseDateRange } from "../_lib/utils";

export async function GET(request: Request) {
  try {
    const auth = await requireOrgMembership();
    if (!auth.ok) return auth.response;

    const url = new URL(request.url);
    const dateRange = parseDateRange(url.searchParams);

    if (dateRange === null) {
      return NextResponse.json(
        { success: false, error: "Invalid date range — use ISO 8601 format" },
        { status: 400 },
      );
    }

    const summary = await getOrgAnalytics(auth.orgId, dateRange);

    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    logger.error("Failed to fetch analytics overview", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics overview" },
      { status: 500 },
    );
  }
}
