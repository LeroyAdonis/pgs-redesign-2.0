/**
 * GET /api/analytics/posts — Top-performing posts for the org
 *
 * Query params:
 *   limit (optional) — number of posts to return (default 10, max 50)
 *   from  (optional) — ISO date start of range
 *   to    (optional) — ISO date end of range
 *
 * Returns an array of PostAnalytics objects.
 */

import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getTopPosts } from "@/lib/analytics/analytics-service";
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

    const limitRaw = parseInt(url.searchParams.get("limit") ?? "10", 10);
    const limit = Math.min(Math.max(isNaN(limitRaw) ? 10 : limitRaw, 1), 50);

    const posts = await getTopPosts(auth.orgId, limit, dateRange);

    return NextResponse.json({ success: true, data: posts });
  } catch (error) {
    logger.error("Failed to fetch top posts analytics", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, error: "Failed to fetch top posts analytics" },
      { status: 500 },
    );
  }
}
