/**
 * GET /api/social/connect/[platform]
 *
 * Initiates the OAuth flow for a social platform.
 * Builds the authorization URL, stores CSRF/PKCE state in a cookie,
 * and redirects the user to the platform's consent page.
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

const OAUTH_STATE_COOKIE = "pgs_oauth_state";
const STATE_MAX_AGE_SECONDS = 600; // 10 minutes

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return NextResponse.redirect(
      `${baseUrl}/dashboard/accounts?error=connect_failed`,
    );
  }
}

function isValidPlatform(value: string): value is Platform {
  return value in OAUTH_PROVIDERS;
}
