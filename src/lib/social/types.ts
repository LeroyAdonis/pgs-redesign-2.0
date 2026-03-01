/**
 * TypeScript types for social platform OAuth flows.
 *
 * These types define the shape of provider configs, OAuth state,
 * token responses, and account data flowing through the system.
 */

/** Supported social platforms — mirrors the DB platformEnum. */
export type Platform =
  | "instagram"
  | "facebook"
  | "twitter"
  | "linkedin"
  | "tiktok"
  | "whatsapp"
  | "google_business";

/** All platforms as a const array for iteration. */
export const PLATFORMS = [
  "instagram",
  "facebook",
  "twitter",
  "linkedin",
  "tiktok",
  "whatsapp",
  "google_business",
] as const satisfies readonly Platform[];

/** Human-readable display info for each platform. */
export interface PlatformDisplayInfo {
  id: Platform;
  name: string;
  /** Short description shown in the connect modal */
  description: string;
  /** Hex color for the platform brand */
  color: string;
  /** Whether OAuth integration is currently available */
  available: boolean;
}

/** OAuth provider configuration for a single platform. */
export interface OAuthProviderConfig {
  platform: Platform;
  /** OAuth authorization endpoint URL */
  authUrl: string;
  /** Token exchange endpoint URL */
  tokenUrl: string;
  /** Requested OAuth scopes */
  scopes: string[];
  /** Env var name for the client ID / app ID */
  clientIdEnvKey: string;
  /** Env var name for the client secret */
  clientSecretEnvKey: string;
  /** Whether this provider uses PKCE (e.g., Twitter/X) */
  usesPKCE: boolean;
  /** Content-Type for token exchange request */
  tokenRequestContentType: "json" | "form";
}

/** State stored in the OAuth state cookie during the flow. */
export interface OAuthState {
  /** CSRF protection token */
  csrfToken: string;
  /** Platform being connected */
  platform: Platform;
  /** Organization ID the account will be linked to */
  orgId: string;
  /** PKCE code verifier (only for PKCE flows) */
  codeVerifier?: string;
  /** Timestamp for expiry validation */
  createdAt: number;
}

/** Standardized token response from any OAuth provider. */
export interface OAuthTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  scope?: string;
}

/** User/page profile returned after OAuth. */
export interface OAuthUserProfile {
  platformUserId: string;
  displayName: string;
}

/** Shape of a social account as returned to the frontend. */
export interface SocialAccountDTO {
  id: string;
  platform: Platform;
  displayName: string | null;
  platformUserId: string;
  isActive: boolean;
  connectedAt: string;
  tokenExpiresAt: string | null;
  /** Derived connection health status */
  status: "connected" | "expiring" | "expired" | "error";
}
