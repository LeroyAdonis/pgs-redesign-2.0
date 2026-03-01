/**
 * GET /api/ai/feedback/stats — Aggregate feedback statistics
 *
 * Returns overall feedback stats for the user's organization:
 * total ratings, breakdown by type, and improvement score.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { logger } from "@/lib/logger";
import { db } from "@/db";
import { aiFeedback, organizationMember } from "@/db/schema";
import { eq, count } from "drizzle-orm";

interface FeedbackStats {
  totalRatings: number;
  thumbsUp: number;
  thumbsDown: number;
  edited: number;
  improvementScore: number;
}

interface StatsSuccessResponse {
  success: true;
  stats: FeedbackStats;
}

interface StatsErrorResponse {
  success: false;
  error: string;
}

type StatsResponse = StatsSuccessResponse | StatsErrorResponse;

export async function GET(): Promise<NextResponse<StatsResponse>> {
  try {
    // Auth check
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get user's org
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

    // Count total ratings
    const [totalResult] = await db
      .select({ value: count() })
      .from(aiFeedback)
      .where(eq(aiFeedback.orgId, membership.orgId));

    const totalRatings = totalResult?.value ?? 0;

    // Count by rating type
    const ratingCounts = await db
      .select({
        rating: aiFeedback.rating,
        count: count(),
      })
      .from(aiFeedback)
      .where(eq(aiFeedback.orgId, membership.orgId))
      .groupBy(aiFeedback.rating);

    let thumbsUp = 0;
    let thumbsDown = 0;
    let edited = 0;

    for (const row of ratingCounts) {
      if (row.rating === "thumbs_up") thumbsUp = row.count;
      else if (row.rating === "thumbs_down") thumbsDown = row.count;
      else if (row.rating === "edited") edited = row.count;
    }

    // Improvement score: percentage of positive/edited out of total
    const improvementScore =
      totalRatings > 0
        ? Math.round(((thumbsUp + edited) / totalRatings) * 100)
        : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalRatings,
        thumbsUp,
        thumbsDown,
        edited,
        improvementScore,
      },
    });
  } catch (error) {
    logger.error("Failed to fetch feedback stats", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
