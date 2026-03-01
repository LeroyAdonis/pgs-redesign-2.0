/**
 * GET /api/schedule/optimal-times — Get optimal posting times
 *
 * Returns suggested optimal posting times for a given platform,
 * based on historical analytics data or sensible SAST defaults.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { logger } from "@/lib/logger";
import { db } from "@/db";
import { organizationMember } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOptimalTimes, suggestNextSlot } from "@/lib/scheduling";

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get org membership
    const memberships = await db
      .select()
      .from(organizationMember)
      .where(eq(organizationMember.userId, session.user.id))
      .limit(1);

    const membership = memberships[0];
    if (!membership) {
      return NextResponse.json(
        { success: false, error: "No organization found" },
        { status: 404 },
      );
    }

    const url = new URL(request.url);
    const platform = url.searchParams.get("platform");

    if (!platform) {
      return NextResponse.json(
        { success: false, error: "platform query parameter is required" },
        { status: 400 },
      );
    }

    const validPlatforms = [
      "instagram",
      "facebook",
      "twitter",
      "linkedin",
      "tiktok",
      "whatsapp",
      "google_business",
    ];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { success: false, error: "Invalid platform" },
        { status: 400 },
      );
    }

    const slots = await getOptimalTimes(membership.orgId, platform);

    // Also get the next suggested slot
    const nextSlot = await suggestNextSlot(
      membership.orgId,
      platform,
      new Date(),
    );

    return NextResponse.json({
      success: true,
      slots,
      nextSuggestedTime: nextSlot.toISOString(),
    });
  } catch (error) {
    logger.error("Failed to get optimal times", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, error: "Failed to get optimal times" },
      { status: 500 },
    );
  }
}
