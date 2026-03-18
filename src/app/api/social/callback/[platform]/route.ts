/**
 * GET /api/social/callback/[platform]
 *
 * OAuth callback handler. Receives the authorization code from
 * the platform, validates CSRF state, exchanges the code for tokens,
 * fetches the user profile, encrypts tokens, and stores in DB.
 *
 * Enforces:
 *  - Social account tier limit (belt-and-suspenders — also checked pre-OAuth)
 *
 * Redirects to /dashboard/accounts on success or with an error param.
 */

import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { logger } from "@/lib/logger";
import { requireServerSession } from "@/lib/auth-session";
import {
  exchangeCodeForTokens,
  fetchUserProfile,
  upsertSocialAccount,
  OAUTH_PROVIDERS,
  type Platform,
  type OAuthState,
} from "@/lib/social";
import { checkAccountLimit } from "@/lib/payments/tier-enforcement";

const OAUTH_STATE_COOKIE = "pgs_oauth_state";
const STATE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const accountsUrl = `${baseUrl}/dashboard/accounts`;

  try {
    // Ensure user is authenticated
    await requireServerSession();

    const { platform } = await params;
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const stateParam = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle platform-side errors
    if (error) {
      logger.warn("OAuth callback received error from platform", {
        platform,
        error,
      });
      return NextResponse.redirect(
        `${accountsUrl}?error=oauth_denied&platform=${platform}`,
      );
    }

    // Validate required params
    if (!code || !stateParam) {
      return NextResponse.redirect(
        `${accountsUrl}?error=missing_params&platform=${platform}`,
      );
    }

    if (!isValidPlatform(platform)) {
      return NextResponse.redirect(
        `${accountsUrl}?error=invalid_platform`,
      );
    }

    // Validate CSRF state from cookie
    const cookieStore = await cookies();
    const stateCookie = cookieStore.get(OAUTH_STATE_COOKIE);

    if (!stateCookie?.value) {
      logger.warn("OAuth callback: missing state cookie", { platform });
      return NextResponse.redirect(
        `${accountsUrl}?error=invalid_state&platform=${platform}`,
      );
    }

    const savedState: OAuthState = JSON.parse(stateCookie.value);

    // Verify CSRF token matches
    if (savedState.csrfToken !== stateParam) {
      logger.warn("OAuth callback: CSRF token mismatch", { platform });
      return NextResponse.redirect(
        `${accountsUrl}?error=invalid_state&platform=${platform}`,
      );
    }

    // Check state hasn't expired
    if (Date.now() - savedState.createdAt > STATE_MAX_AGE_MS) {
      logger.warn("OAuth callback: state expired", { platform });
      return NextResponse.redirect(
        `${accountsUrl}?error=expired&platform=${platform}`,
      );
    }

    // Verify platform matches
    if (savedState.platform !== platform) {
      logger.warn("OAuth callback: platform mismatch", {
        expected: savedState.platform,
        received: platform,
      });
      return NextResponse.redirect(
        `${accountsUrl}?error=invalid_state&platform=${platform}`,
      );
    }

    // Clear the state cookie
    cookieStore.delete(OAUTH_STATE_COOKIE);

    // --- Tier enforcement: re-check account limit before saving ---
    // Belt-and-suspenders: the connect route checks too, but a concurrent
    // request could have consumed the last slot between OAuth start & callback.
    const accountCheck = await checkAccountLimit(savedState.orgId);
    if (!accountCheck.allowed) {
      logger.warn("Social account limit reached at callback", {
        orgId: savedState.orgId,
        platform,
        tier: accountCheck.tier,
        current: accountCheck.current,
        limit: accountCheck.limit,
      });
      return NextResponse.redirect(
        `${accountsUrl}?error=account_limit&current=${accountCheck.current}&limit=${accountCheck.limit}`,
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(
      platform,
      code,
      savedState.codeVerifier,
    );

    // Fetch user profile from the platform
    const profile = await fetchUserProfile(platform, tokens.accessToken);

    // Fetch page/business ID for platforms that need it (Facebook, Instagram, WhatsApp)
    const pageId = await fetchPlatformPageId(platform, tokens.accessToken);

    // Store encrypted tokens in DB
    const accountId = await upsertSocialAccount({
      orgId: savedState.orgId,
      platform,
      platformUserId: profile.platformUserId,
      displayName: profile.displayName,
      tokens,
      pageId,
    });

    logger.info("OAuth flow completed successfully", {
      platform,
      accountId,
      orgId: savedState.orgId,
    });

    return NextResponse.redirect(
      `${accountsUrl}?success=connected&platform=${platform}`,
    );
  } catch (error) {
    logger.error("OAuth callback failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.redirect(
      `${accountsUrl}?error=callback_failed`,
    );
  }
}

function isValidPlatform(value: string): value is Platform {
  return value in OAUTH_PROVIDERS;
}

/**
 * Fetch platform-specific page/business ID after OAuth.
 * Facebook & Instagram: fetches the user's pages and returns the first page ID.
 * WhatsApp: fetches the phone number ID from the business account.
 * Other platforms: returns undefined (no page ID needed).
 */
async function fetchPlatformPageId(
  platform: string,
  accessToken: string,
): Promise<string | undefined> {
  try {
    if (platform === "facebook" || platform === "instagram") {
      // Get the user's Facebook Pages (Instagram Business accounts are linked to FB pages)
      const res = await fetch(
        `https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.length > 0) {
          const pageId = data.data[0].id;
          logger.info("Fetched Facebook/Instagram page ID", { platform, pageId });
          return pageId;
        }
      }
      logger.warn("No Facebook pages found for user", { platform });
    }

    if (platform === "whatsapp") {
      // Get the WhatsApp Business phone number ID
      const res = await fetch(
        `https://graph.facebook.com/v21.0/me/businesses?access_token=${accessToken}`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.length > 0) {
          const businessId = data.data[0].id;
          // Get phone numbers for this business
          const phoneRes = await fetch(
            `https://graph.facebook.com/v21.0/${businessId}/owned_whatsapp_business_accounts?access_token=${accessToken}`,
          );
          if (phoneRes.ok) {
            const phoneData = await phoneRes.json();
            if (phoneData.data && phoneData.data.length > 0) {
              const wabaId = phoneData.data[0].id;
              // Get phone numbers
              const numberRes = await fetch(
                `https://graph.facebook.com/v21.0/${wabaId}/phone_numbers?access_token=${accessToken}`,
              );
              if (numberRes.ok) {
                const numberData = await numberRes.json();
                if (numberData.data && numberData.data.length > 0) {
                  const phoneNumberId = numberData.data[0].id;
                  logger.info("Fetched WhatsApp phone number ID", { phoneNumberId });
                  return phoneNumberId;
                }
              }
            }
          }
        }
      }
      logger.warn("No WhatsApp business account found");
    }
  } catch (error) {
    logger.error("Failed to fetch platform page ID", {
      platform,
      error: error instanceof Error ? error.message : "Unknown",
    });
  }
  return undefined;
}
