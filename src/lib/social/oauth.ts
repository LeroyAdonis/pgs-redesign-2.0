/**
 * OAuth flow helpers — authorization URL building, code exchange,
 * token refresh, and PKCE utilities.
 *
 * These are pure functions that don't touch the database. They handle
 * the HTTP-level OAuth protocol for all supported platforms.
 */

import { randomBytes, createHash } from "node:crypto";

import { logger } from "@/lib/logger";

import {
  OAUTH_PROVIDERS,
  getRedirectUri,
  getClientCredentials,
} from "./providers";
import type {
  Platform,
  OAuthState,
  OAuthTokenResponse,
  OAuthUserProfile,
} from "./types";

// ─── PKCE Utilities ───────────────────────────────────────────

/** Generate a random code verifier for PKCE (43–128 chars, URL-safe). */
export function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

/** Derive the S256 code challenge from a code verifier. */
export function generateCodeChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

/** Generate a random CSRF token. */
export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

// ─── Authorization URL ───────────────────────────────────────

/**
 * Build the OAuth authorization URL for a given platform.
 *
 * The returned URL is where the user should be redirected to
 * begin the OAuth consent flow. The `state` parameter encodes
 * CSRF protection and optional PKCE data.
 *
 * @returns The authorization URL and the OAuth state to persist in a cookie
 */
export function buildAuthorizationUrl(
  platform: Platform,
  orgId: string,
): { url: string; state: OAuthState } {
  const config = OAUTH_PROVIDERS[platform];
  const { clientId } = getClientCredentials(platform);
  const redirectUri = getRedirectUri(platform);

  const csrfToken = generateCsrfToken();

  const state: OAuthState = {
    csrfToken,
    platform,
    orgId,
    createdAt: Date.now(),
  };

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    state: csrfToken,
  });

  if (config.usesPKCE) {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    state.codeVerifier = codeVerifier;
    params.set("code_challenge", codeChallenge);
    params.set("code_challenge_method", "S256");
  }

  // Platform-specific params
  if (platform === "tiktok") {
    // TikTok uses client_key instead of client_id
    params.delete("client_id");
    params.set("client_key", clientId);
  }

  const url = `${config.authUrl}?${params.toString()}`;

  return { url, state };
}

// ─── Token Exchange ──────────────────────────────────────────

/**
 * Exchange an authorization code for access/refresh tokens.
 *
 * Handles platform-specific differences in request format and
 * response parsing.
 */
export async function exchangeCodeForTokens(
  platform: Platform,
  code: string,
  codeVerifier?: string,
): Promise<OAuthTokenResponse> {
  const config = OAUTH_PROVIDERS[platform];
  const { clientId, clientSecret } = getClientCredentials(platform);
  const redirectUri = getRedirectUri(platform);

  const body: Record<string, string> = {
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  };

  // Platform-specific body params
  if (platform === "tiktok") {
    body.client_key = clientId;
    body.client_secret = clientSecret;
  } else {
    body.client_id = clientId;
    body.client_secret = clientSecret;
  }

  if (config.usesPKCE && codeVerifier) {
    body.code_verifier = codeVerifier;
  }

  const headers: Record<string, string> = {};
  let requestBody: string;

  if (config.tokenRequestContentType === "json") {
    headers["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  } else {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    requestBody = new URLSearchParams(body).toString();
  }

  // Twitter uses HTTP Basic auth for token exchange
  if (platform === "twitter") {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    headers["Authorization"] = `Basic ${basic}`;
    // Remove credentials from body when using Basic auth
    delete body.client_id;
    delete body.client_secret;
    requestBody = new URLSearchParams(body).toString();
  }

  logger.info("Exchanging OAuth code for tokens", { platform });

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers,
    body: requestBody,
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error("Token exchange failed", {
      platform,
      status: response.status,
      error: errorText,
    });
    throw new Error(
      `Token exchange failed for ${platform}: ${response.status} ${errorText}`,
    );
  }

  const data = await response.json();

  return normalizeTokenResponse(platform, data);
}

// ─── Token Refresh ───────────────────────────────────────────

/**
 * Refresh an expired access token using a refresh token.
 *
 * Not all platforms support refresh tokens (e.g., Meta uses
 * long-lived tokens). Returns null if the platform doesn't
 * support refresh or the refresh fails.
 */
export async function refreshAccessToken(
  platform: Platform,
  refreshToken: string,
): Promise<OAuthTokenResponse | null> {
  const config = OAUTH_PROVIDERS[platform];
  const { clientId, clientSecret } = getClientCredentials(platform);

  // Meta platforms use token extension instead of refresh_token grant
  if (["instagram", "facebook", "whatsapp"].includes(platform)) {
    return refreshMetaToken(clientId, clientSecret, refreshToken);
  }

  const body: Record<string, string> = {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  };

  if (platform === "tiktok") {
    body.client_key = clientId;
    delete body.client_id;
  }

  const headers: Record<string, string> = {};
  let requestBody: string;

  if (config.tokenRequestContentType === "json") {
    headers["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  } else {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    requestBody = new URLSearchParams(body).toString();
  }

  if (platform === "twitter") {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    headers["Authorization"] = `Basic ${basic}`;
    delete body.client_id;
    delete body.client_secret;
    requestBody = new URLSearchParams(body).toString();
  }

  logger.info("Refreshing OAuth token", { platform });

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers,
    body: requestBody,
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.warn("Token refresh failed", {
      platform,
      status: response.status,
      error: errorText,
    });
    return null;
  }

  const data = await response.json();

  return normalizeTokenResponse(platform, data);
}

// ─── User Profile ────────────────────────────────────────────

/**
 * Fetch the user/page profile from the platform using the access token.
 * Returns a standardized profile with platformUserId and displayName.
 */
export async function fetchUserProfile(
  platform: Platform,
  accessToken: string,
): Promise<OAuthUserProfile> {
  switch (platform) {
    case "instagram":
    case "facebook":
    case "whatsapp": {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${accessToken}`,
      );
      const data = await res.json();
      return { platformUserId: data.id, displayName: data.name ?? "Unknown" };
    }

    case "twitter": {
      const res = await fetch("https://api.twitter.com/2/users/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      return {
        platformUserId: data.data.id,
        displayName: data.data.name ?? data.data.username,
      };
    }

    case "linkedin": {
      const res = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      return {
        platformUserId: data.sub,
        displayName: data.name ?? "LinkedIn User",
      };
    }

    case "tiktok": {
      const res = await fetch(
        "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      const data = await res.json();
      return {
        platformUserId: data.data.user.open_id,
        displayName: data.data.user.display_name ?? "TikTok User",
      };
    }

    case "google_business": {
      const res = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const data = await res.json();
      return {
        platformUserId: data.sub,
        displayName: data.name ?? "Google Business User",
      };
    }

    default: {
      const _exhaustive: never = platform;
      throw new Error(`Unknown platform: ${_exhaustive}`);
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────

/** Normalize platform-specific token responses into our standard format. */
function normalizeTokenResponse(
  platform: Platform,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>,
): OAuthTokenResponse {
  if (platform === "tiktok") {
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
      scope: data.scope,
    };
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
    scope: data.scope,
  };
}

/**
 * Meta platforms (Facebook/Instagram/WhatsApp) use long-lived token
 * exchange instead of standard refresh_token grants.
 */
async function refreshMetaToken(
  clientId: string,
  clientSecret: string,
  existingToken: string,
): Promise<OAuthTokenResponse | null> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: clientId,
    client_secret: clientSecret,
    fb_exchange_token: existingToken,
  });

  const response = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?${params.toString()}`,
  );

  if (!response.ok) {
    logger.warn("Meta token refresh failed", {
      status: response.status,
    });
    return null;
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
  };
}
