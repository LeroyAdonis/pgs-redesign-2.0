/**
 * GET /api/credits/transactions — Paginated transaction history
 *
 * Query params:
 *   orgId  (required) — the organisation to query
 *   limit  (optional, default 20, max 100)
 *   offset (optional, default 0)
 *
 * Returns { success: true, transactions: TransactionHistoryItem[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { logger } from "@/lib/logger";
import { db } from "@/db";
import { organizationMember } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getTransactionHistory } from "@/lib/credits";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = request.nextUrl;
    const orgId = searchParams.get("orgId");
    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Missing required query param: orgId" },
        { status: 400 },
      );
    }

    // Verify org membership
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

    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? "20", 10),
      100,
    );
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    const transactions = await getTransactionHistory(orgId, { limit, offset });
    return NextResponse.json({ success: true, transactions });
  } catch (error) {
    logger.error("Failed to fetch transaction history", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, error: "Failed to fetch transaction history" },
      { status: 500 },
    );
  }
}
