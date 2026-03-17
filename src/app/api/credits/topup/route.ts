/**
 * POST /api/credits/topup — Create a checkout session for credit top-up
 *
 * Body: { creditAmount: number }
 *
 * Returns { success: true, checkoutUrl } on success,
 * or { success: false, error } on failure.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { logger } from "@/lib/logger";
import { db } from "@/db";
import { organizationMember } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getTopUpPackageByCreditAmount } from "@/lib/payments/tier-config";
import { createTopUpCheckout } from "@/lib/payments/topup-service";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as { creditAmount?: unknown };

    const creditAmount = body.creditAmount;
    if (typeof creditAmount !== "number" || !Number.isFinite(creditAmount)) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid creditAmount" },
        { status: 400 },
      );
    }

    // Validate creditAmount matches a known package
    const pkg = getTopUpPackageByCreditAmount(creditAmount);
    if (!pkg) {
      return NextResponse.json(
        { success: false, error: "Invalid credit amount — no matching package" },
        { status: 400 },
      );
    }

    // Get the user's organisation membership
    const memberships = await db
      .select()
      .from(organizationMember)
      .where(eq(organizationMember.userId, session.user.id))
      .limit(1);

    if (memberships.length === 0) {
      return NextResponse.json(
        { success: false, error: "No organization membership found" },
        { status: 403 },
      );
    }

    const orgId = memberships[0].orgId;

    const result = await createTopUpCheckout(
      orgId,
      session.user.id,
      session.user.email,
      creditAmount,
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: result.checkoutUrl,
    });
  } catch (error) {
    logger.error("Failed to create top-up checkout", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, error: "Failed to create top-up checkout" },
      { status: 500 },
    );
  }
}
