/**
 * GET /api/credits/balance — Current credit balance for an organisation
 *
 * Query params:
 *   orgId (required) — the organisation to query
 *
 * Returns a CreditBalance JSON object.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { logger } from "@/lib/logger";
import { db } from "@/db";
import { organizationMember } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getBalance } from "@/lib/credits";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const orgId = request.nextUrl.searchParams.get("orgId");
    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Missing required query param: orgId" },
        { status: 400 },
      );
    }

    // Verify the authenticated user belongs to this organisation
    const memberships = await db
      .select()
      .from(organizationMember)
      .where(
        and(
          eq(organizationMember.userId, session.user.id),
          eq(organizationMember.orgId, orgId),
        ),
      )
      .limit(1);

    if (memberships.length === 0) {
      return NextResponse.json(
        { success: false, error: "Forbidden — not a member of this organization" },
        { status: 403 },
      );
    }

    const balance = await getBalance(orgId);
    return NextResponse.json({ success: true, ...balance });
  } catch (error) {
    logger.error("Failed to fetch credit balance", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, error: "Failed to fetch credit balance" },
      { status: 500 },
    );
  }
}
