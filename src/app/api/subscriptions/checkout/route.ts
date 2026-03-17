/**
 * POST /api/subscriptions/checkout — Create a checkout session
 *
 * Body: { tier: Tier, billingInterval: "monthly" | "annual" }
 *
 * Auth: session + org membership required.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { logger } from "@/lib/logger";
import { db } from "@/db";
import { organizationMember } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createCheckoutSession } from "@/lib/payments/subscription-service";
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
      tier?: string;
      billingInterval?: string;
    };

    const { tier, billingInterval } = body;

    if (!tier || !VALID_TIERS.includes(tier as Tier)) {
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

    const result = await createCheckoutSession(
      membership.orgId,
      session.user.id,
      session.user.email,
      tier as Tier,
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
    });
  } catch (error) {
    logger.error("Failed to create checkout session", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
