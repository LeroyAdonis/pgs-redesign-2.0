/**
 * POST /api/social/disconnect
 *
 * Soft-deletes a social account by setting isActive = false.
 *
 * Body: { accountId: string, orgId: string }
 */

import { NextResponse, type NextRequest } from "next/server";

import { logger } from "@/lib/logger";
import { requireServerSession } from "@/lib/auth-session";
import {
  requireOrgMembership,
  getAccountById,
  disconnectAccount,
} from "@/lib/social";

export async function POST(request: NextRequest) {
  try {
    const session = await requireServerSession();

    const body = await request.json();
    const { accountId, orgId } = body as {
      accountId?: string;
      orgId?: string;
    };

    if (!accountId || !orgId) {
      return NextResponse.json(
        { error: "accountId and orgId are required" },
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

    await disconnectAccount(accountId);

    logger.info("Social account disconnected via API", {
      accountId,
      platform: account.platform,
      userId: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to disconnect social account", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: "Failed to disconnect account" },
      { status: 500 },
    );
  }
}
