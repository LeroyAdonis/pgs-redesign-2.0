/**
 * GET /api/social/accounts
 *
 * Lists all social accounts for the current user's organization.
 *
 * Query params:
 *   - orgId: Organization ID (required)
 */

import { NextResponse, type NextRequest } from "next/server";

import { logger } from "@/lib/logger";
import { getServerSession } from "@/lib/auth-session";
import { requireOrgMembership, listAccountsForOrg } from "@/lib/social";

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
        { error: "orgId query parameter is required" },
        { status: 400 },
      );
    }

    // Verify org membership
    await requireOrgMembership(session.user.id, orgId);

    const accounts = await listAccountsForOrg(orgId);

    return NextResponse.json({ accounts });
  } catch (error) {
    logger.error("Failed to list social accounts", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { success: false, error: "Failed to list accounts" },
      { status: 500 },
    );
  }
}
