/**
 * GET /api/analytics/best-times — Optimal posting time slots
 *
 * No query params required.
 *
 * Returns an array of BestPostingTime objects ranked by
 * average engagement (SAST day-of-week / hour).
 */

import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getBestPostingTimes } from "@/lib/analytics/analytics-service";
import { requireOrgMembership } from "../_lib/utils";

export async function GET() {
  try {
    const auth = await requireOrgMembership();
    if (!auth.ok) return auth.response;

    const bestTimes = await getBestPostingTimes(auth.orgId);

    return NextResponse.json({ success: true, data: bestTimes });
  } catch (error) {
    logger.error("Failed to fetch best posting times", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, error: "Failed to fetch best posting times" },
      { status: 500 },
    );
  }
}
