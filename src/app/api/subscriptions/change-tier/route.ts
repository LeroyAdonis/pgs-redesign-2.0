/**
 * POST /api/subscriptions/change-tier — Change subscription tier
 *
 * Body: { newTier: Tier, billingInterval: "monthly" | "annual" }
 *
 * Auth: session + org membership required.
 * Handles upgrade, downgrade, and cross-tier switching.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { logger } from "@/lib/logger";
import { db } from "@/db";
import { organizationMember, organization } from "@/db/schema";
import { eq } from "drizzle-orm";
import { handleTierChange } from "@/lib/payments/subscription-service";
import { TIER_CONFIGS, type Tier } from "@/lib/payments/tier-config";

const VALID_TIERS = Object.keys(TIER_CONFIGS) as Tier[];
const VALID_INTERVALS = ["monthly", "annual"] as const;

export async function POST(request: Request) {
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

    const body = (await request.json()) as {
      newTier?: string;
      billingInterval?: string;
    };

    const { newTier, billingInterval } = body;

    if (!newTier || !VALID_TIERS.includes(newTier as Tier)) {
      return NextResponse.json(
        { success: false, error: `Invalid tier. Must be one of: ${VALID_TIERS.join(", ")}` },
        { status: 400 },
      );
    }

    if (
      !billingInterval ||
      !VALID_INTERVALS.includes(billingInterval as "monthly" | "annual")
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid billingInterval. Must be 'monthly' or 'annual'" },
        { status: 400 },
      );
    }

    // Get current org tier to validate change
    const orgs = await db
      .select({ tier: organization.tier })
      .from(organization)
      .where(eq(organization.id, membership.orgId))
      .limit(1);

    const currentTier = orgs[0]?.tier ?? "seedling";

    if (newTier === currentTier) {
      return NextResponse.json(
        { success: false, error: "Already on this tier" },
        { status: 400 },
      );
    }

    const result = await handleTierChange(
      membership.orgId,
      session.user.id,
      session.user.email,
      newTier as Tier,
      billingInterval as "monthly" | "annual",
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: result.checkoutUrl,
      message: result.message,
    });
  } catch (error) {
    logger.error("Failed to change tier", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, error: "Failed to change subscription tier" },
      { status: 500 },
    );
  }
}
