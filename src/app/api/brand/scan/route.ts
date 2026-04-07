/**
 * POST /api/brand/scan — Trigger brand analysis for a social account
 *
 * Requires authentication. Scrapes posts and runs the brand analyzer,
 * persisting results to the brand_profile table.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { logger } from "@/lib/logger";
import { db } from "@/db";
import { socialAccount, organizationMember } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { analyzeBrand } from "@/lib/brand/profile-service";
import type { ScanRequest, ScanResponse } from "@/lib/brand/types";

export async function POST(request: Request): Promise<NextResponse<ScanResponse>> {
  try {
    // Auth check
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Parse body
    const body = (await request.json()) as ScanRequest;

    if (!body.socialAccountId) {
      return NextResponse.json(
        { success: false, error: "socialAccountId is required" },
        { status: 400 },
      );
    }

    // Look up social account to get orgId
    const accounts = await db
      .select()
      .from(socialAccount)
      .where(eq(socialAccount.id, body.socialAccountId))
      .limit(1);

    const account = accounts[0];
    if (!account) {
      return NextResponse.json(
        { success: false, error: "Social account not found" },
        { status: 404 },
      );
    }

    // Verify user has access to this org
    const membership = await db
      .select()
      .from(organizationMember)
      .where(
        and(
          eq(organizationMember.orgId, account.orgId),
          eq(organizationMember.userId, session.user.id),
        ),
      )
      .limit(1);

    if (membership.length === 0) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    // Run analysis
    const { result, profile } = await analyzeBrand(
      body.socialAccountId,
      account.orgId,
      { useMockData: !account.accessTokenEncrypted },
    );

    logger.info("Brand scan completed via API", {
      profileId: profile.id,
      postsAnalyzed: result.postsAnalyzed,
    });

    return NextResponse.json({
      success: true,
      profileId: profile.id,
      result,
    });
  } catch (error) {
    logger.error("Brand scan failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { success: false, error: "Brand scan failed" },
      { status: 500 },
    );
  }
}
