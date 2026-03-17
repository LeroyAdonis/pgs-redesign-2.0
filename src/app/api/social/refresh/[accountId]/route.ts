/**
 * POST /api/social/refresh/[accountId]
 *
 * Force-refresh an expired or expiring OAuth token.
 *
 * Body: { orgId: string }
 */

import { NextResponse, type NextRequest } from "next/server";

import { logger } from "@/lib/logger";
import { requireServerSession } from "@/lib/auth-session";
import {
  requireOrgMembership,
  getAccountById,
  refreshAccountToken,
} from "@/lib/social";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> },
) {
  try {
    const session = await requireServerSession();
    const { accountId } = await params;

    const body = await request.json();
    const { orgId } = body as { orgId?: string };

    if (!orgId) {
      return NextResponse.json(
        { error: "orgId is required" },
        { status: 400 },
      );
    }

    // Verify org membership
    await requireOrgMembership(session.user.id, orgId);

    // Verify account exists and belongs to this org
    const account = await getAccountById(accountId);

    if (!account || account.orgId !== orgId) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 },
      );
    }

    const success = await refreshAccountToken(accountId);

    if (!success) {
      return NextResponse.json(
        { error: "Token refresh failed. The account may need to be reconnected." },
        { status: 422 },
      );
    }

    logger.info("Token refreshed via API", {
      accountId,
      platform: account.platform,
      userId: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to refresh token", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 500 },
    );
  }
}
