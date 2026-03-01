/**
 * OAuth provider configurations for each social platform.
 *
 * Each config specifies the OAuth endpoints, scopes, and env var names.
 * Instagram, Facebook, and WhatsApp all use Meta's OAuth infrastructure
 * but request different scopes.
 *
 * @see https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow
 * @see https://developer.x.com/en/docs/authentication/oauth-2-0/authorization-code
 * @see https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow
 * @see https://developers.tiktok.com/doc/oauth-user-access-token-management
 * @see https://developers.google.com/my-business/content/basic-setup
 */

import type { OAuthProviderConfig, Platform, PlatformDisplayInfo } from "./types";

/** OAuth configs keyed by platform. */
export const OAUTH_PROVIDERS: Record<Platform, OAuthProviderConfig> = {
  instagram: {
    platform: "instagram",
    authUrl: "https://www.facebook.com/v21.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v21.0/oauth/access_token",
    scopes: [
      "instagram_basic",
      "instagram_content_publish",
      "instagram_manage_comments",
      "instagram_manage_insights",
      "pages_show_list",
      "pages_read_engagement",
    ],
    clientIdEnvKey: "FACEBOOK_APP_ID",
    clientSecretEnvKey: "FACEBOOK_APP_SECRET",
    usesPKCE: false,
    tokenRequestContentType: "form",
  },

  facebook: {
    platform: "facebook",
    authUrl: "https://www.facebook.com/v21.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v21.0/oauth/access_token",
    scopes: [
      "pages_manage_posts",
      "pages_read_engagement",
      "pages_show_list",
      "pages_manage_metadata",
      "pages_read_user_content",
    ],
    clientIdEnvKey: "FACEBOOK_APP_ID",
    clientSecretEnvKey: "FACEBOOK_APP_SECRET",
    usesPKCE: false,
    tokenRequestContentType: "form",
  },

  twitter: {
    platform: "twitter",
    authUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    scopes: [
      "tweet.read",
      "tweet.write",
      "users.read",
      "offline.access",
    ],
    clientIdEnvKey: "TWITTER_CLIENT_ID",
    clientSecretEnvKey: "TWITTER_CLIENT_SECRET",
    usesPKCE: true,
    tokenRequestContentType: "form",
  },

  linkedin: {
    platform: "linkedin",
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    scopes: [
      "openid",
      "profile",
      "w_member_social",
    ],
    clientIdEnvKey: "LINKEDIN_CLIENT_ID",
    clientSecretEnvKey: "LINKEDIN_CLIENT_SECRET",
    usesPKCE: false,
    tokenRequestContentType: "form",
  },

  tiktok: {
    platform: "tiktok",
    authUrl: "https://www.tiktok.com/v2/auth/authorize/",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    scopes: [
      "user.info.basic",
      "video.publish",
      "video.list",
    ],
    clientIdEnvKey: "TIKTOK_CLIENT_KEY",
    clientSecretEnvKey: "TIKTOK_CLIENT_SECRET",
    usesPKCE: true,
    tokenRequestContentType: "form",
  },

  whatsapp: {
    platform: "whatsapp",
    authUrl: "https://www.facebook.com/v21.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v21.0/oauth/access_token",
    scopes: [
      "whatsapp_business_management",
      "whatsapp_business_messaging",
      "business_management",
    ],
    clientIdEnvKey: "FACEBOOK_APP_ID",
    clientSecretEnvKey: "FACEBOOK_APP_SECRET",
    usesPKCE: false,
    tokenRequestContentType: "form",
  },

  google_business: {
    platform: "google_business",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: [
      "https://www.googleapis.com/auth/business.manage",
    ],
    clientIdEnvKey: "GOOGLE_CLIENT_ID",
    clientSecretEnvKey: "GOOGLE_CLIENT_SECRET",
    usesPKCE: false,
    tokenRequestContentType: "json",
  },
};

/** Display metadata for the platform selection UI. */
export const PLATFORM_DISPLAY: Record<Platform, PlatformDisplayInfo> = {
  instagram: {
    id: "instagram",
    name: "Instagram",
    description: "Photo & video sharing, Reels, Stories",
    color: "#E4405F",
    available: true,
  },
  facebook: {
    id: "facebook",
    name: "Facebook",
    description: "Page posts, engagement, insights",
    color: "#1877F2",
    available: true,
  },
  twitter: {
    id: "twitter",
    name: "X (Twitter)",
    description: "Posts, threads, engagement",
    color: "#000000",
    available: true,
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    description: "Professional posts, company pages",
    color: "#0A66C2",
    available: true,
  },
  tiktok: {
    id: "tiktok",
    name: "TikTok",
    description: "Short-form video content",
    color: "#000000",
    available: true,
  },
  whatsapp: {
    id: "whatsapp",
    name: "WhatsApp Business",
    description: "Business messaging, status updates",
    color: "#25D366",
    available: false,
  },
  google_business: {
    id: "google_business",
    name: "Google Business",
    description: "Business profile, posts, reviews",
    color: "#4285F4",
    available: false,
  },
};

/**
 * Get the OAuth redirect URI for a platform.
 * Uses NEXT_PUBLIC_APP_URL to build the callback URL.
 */
export function getRedirectUri(platform: Platform): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${baseUrl}/api/social/callback/${platform}`;
}

/**
 * Get OAuth client credentials from environment variables.
 * Throws if the required env vars are not set.
 */
export function getClientCredentials(platform: Platform): {
  clientId: string;
  clientSecret: string;
} {
  const config = OAUTH_PROVIDERS[platform];

  const clientId = process.env[config.clientIdEnvKey];
  const clientSecret = process.env[config.clientSecretEnvKey];

  if (!clientId) {
    throw new Error(
      `Missing env var ${config.clientIdEnvKey} for ${platform} OAuth.`,
    );
  }

  if (!clientSecret) {
    throw new Error(
      `Missing env var ${config.clientSecretEnvKey} for ${platform} OAuth.`,
    );
  }

  return { clientId, clientSecret };
}
