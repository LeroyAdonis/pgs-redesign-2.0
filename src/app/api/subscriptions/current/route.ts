/**
 * GET /api/subscriptions/current — Current subscription info
 *
 * Auth: session + org membership required.
 * Returns the current subscription for the user's organisation.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { logger } from "@/lib/logger";
import { db } from "@/db";
import { organizationMember } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentSubscription } from "@/lib/payments/subscription-service";

export async function GET() {
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

    const sub = await getCurrentSubscription(membership.orgId);

    return NextResponse.json({
      success: true,
      subscription: sub,
    });
  } catch (error) {
    logger.error("Failed to fetch current subscription", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, error: "Failed to fetch subscription" },
      { status: 500 },
    );
  }
}
