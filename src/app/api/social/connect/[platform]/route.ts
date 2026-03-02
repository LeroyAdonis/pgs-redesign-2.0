/**
 * GET /api/social/connect/[platform]
 *
 * Initiates the OAuth flow for a social platform.
 * Builds the authorization URL, stores CSRF/PKCE state in a cookie,
 * and redirects the user to the platform's consent page.
 *
 * Enforces:
 *  - Social account tier limit (before starting OAuth)
 *  - Platform access for the org's tier
 *
 * Query params:
 *   - orgId: Organization to link the account to (required)
 */

import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { logger } from "@/lib/logger";
import { requireServerSession } from "@/lib/auth-session";
import {
  buildAuthorizationUrl,
  requireOrgMembership,
  OAUTH_PROVIDERS,
  type Platform,
} from "@/lib/social";
import {
  checkAccountLimit,
  checkPlatformAccess,
} from "@/lib/payments/tier-enforcement";
import { TIER_CONFIGS } from "@/lib/payments/tier-config";

const OAUTH_STATE_COOKIE = "pgs_oauth_state";
const STATE_MAX_AGE_SECONDS = 600; // 10 minutes

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const session = await requireServerSession();
    const { platform } = await params;
    const orgId = request.nextUrl.searchParams.get("orgId");

    // Validate platform
    if (!isValidPlatform(platform)) {
      return NextResponse.json(
        { error: `Invalid platform: ${platform}` },
        { status: 400 },
      );
    }

    // Require orgId
    if (!orgId) {
      return NextResponse.json(
        { error: "orgId query parameter is required" },
        { status: 400 },
      );
    }

    // Verify org membership
    await requireOrgMembership(session.user.id, orgId);

    // --- Tier enforcement: check social account limit ---
    const accountCheck = await checkAccountLimit(orgId);
    if (!accountCheck.allowed) {
      const tierName = TIER_CONFIGS[accountCheck.tier].displayName;
      const upgradeName = accountCheck.upgradeRequired
        ? TIER_CONFIGS[accountCheck.upgradeRequired].displayName
        : undefined;

      logger.warn("Social account limit reached", {
        orgId,
        platform,
        tier: accountCheck.tier,
        current: accountCheck.current,
        limit: accountCheck.limit,
      });

      return NextResponse.redirect(
        `${baseUrl}/dashboard/accounts?error=account_limit&tier=${tierName}&current=${accountCheck.current}&limit=${accountCheck.limit}${upgradeName ? `&upgrade=${upgradeName}` : ""}`,
      );
    }

    // --- Tier enforcement: check platform access ---
    const platformCheck = await checkPlatformAccess(orgId, platform);
    if (!platformCheck.allowed) {
      logger.warn("Platform not available on tier", {
        orgId,
        platform,
        tier: platformCheck.tier,
      });

      return NextResponse.redirect(
        `${baseUrl}/dashboard/accounts?error=platform_unavailable&platform=${platform}&tier=${TIER_CONFIGS[platformCheck.tier].displayName}`,
      );
    }

    // Build authorization URL with state
    const { url, state } = buildAuthorizationUrl(platform, orgId);

    // Store state in an HTTP-only cookie for CSRF validation on callback
    const cookieStore = await cookies();
    cookieStore.set(OAUTH_STATE_COOKIE, JSON.stringify(state), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: STATE_MAX_AGE_SECONDS,
      path: "/api/social/callback",
    });

    logger.info("OAuth flow initiated", { platform, orgId });

    return NextResponse.redirect(url);
  } catch (error) {
    logger.error("Failed to initiate OAuth flow", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    // Redirect to accounts page with error
    return NextResponse.redirect(
      `${baseUrl}/dashboard/accounts?error=connect_failed`,
    );
  }
}

function isValidPlatform(value: string): value is Platform {
  return value in OAUTH_PROVIDERS;
}
