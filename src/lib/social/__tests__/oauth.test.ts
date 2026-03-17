/**
 * Tests for OAuth flow helpers.
 *
 * Tests the pure functions (URL building, PKCE, token normalization)
 * without making real HTTP requests.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateCsrfToken,
  buildAuthorizationUrl,
} from "../oauth";
import { OAUTH_PROVIDERS, getRedirectUri, getClientCredentials } from "../providers";
import type { Platform } from "../types";

// ─── Setup ───────────────────────────────────────────────────

beforeEach(() => {
  vi.stubEnv("FACEBOOK_APP_ID", "test-fb-app-id");
  vi.stubEnv("FACEBOOK_APP_SECRET", "test-fb-app-secret");
  vi.stubEnv("TWITTER_CLIENT_ID", "test-twitter-id");
  vi.stubEnv("TWITTER_CLIENT_SECRET", "test-twitter-secret");
  vi.stubEnv("LINKEDIN_CLIENT_ID", "test-linkedin-id");
  vi.stubEnv("LINKEDIN_CLIENT_SECRET", "test-linkedin-secret");
  vi.stubEnv("TIKTOK_CLIENT_KEY", "test-tiktok-key");
  vi.stubEnv("TIKTOK_CLIENT_SECRET", "test-tiktok-secret");
  vi.stubEnv("GOOGLE_CLIENT_ID", "test-google-id");
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-google-secret");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.purpleglow.co.za");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// ─── PKCE Tests ──────────────────────────────────────────────

describe("PKCE utilities", () => {
  it("generates a URL-safe code verifier", () => {
    const verifier = generateCodeVerifier();
    // base64url chars: A-Z, a-z, 0-9, -, _
    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(verifier.length).toBeGreaterThanOrEqual(32);
  });

  it("generates different verifiers each time", () => {
    const v1 = generateCodeVerifier();
    const v2 = generateCodeVerifier();
    expect(v1).not.toBe(v2);
  });

  it("derives a deterministic S256 code challenge from a verifier", () => {
    const verifier = "test-code-verifier-12345";
    const c1 = generateCodeChallenge(verifier);
    const c2 = generateCodeChallenge(verifier);
    expect(c1).toBe(c2);
  });

  it("code challenge is URL-safe base64", () => {
    const verifier = generateCodeVerifier();
    const challenge = generateCodeChallenge(verifier);
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

// ─── CSRF Token Tests ────────────────────────────────────────

describe("CSRF token", () => {
  it("generates a hex string", () => {
    const token = generateCsrfToken();
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  it("is 64 characters (32 bytes)", () => {
    const token = generateCsrfToken();
    expect(token.length).toBe(64);
  });

  it("generates unique tokens", () => {
    const t1 = generateCsrfToken();
    const t2 = generateCsrfToken();
    expect(t1).not.toBe(t2);
  });
});

// ─── Provider Config Tests ───────────────────────────────────

describe("OAUTH_PROVIDERS", () => {
  it("has config for all 7 platforms", () => {
    const platforms: Platform[] = [
      "instagram",
      "facebook",
      "twitter",
      "linkedin",
      "tiktok",
      "whatsapp",
      "google_business",
    ];

    for (const p of platforms) {
      expect(OAUTH_PROVIDERS[p]).toBeDefined();
      expect(OAUTH_PROVIDERS[p].authUrl).toBeTruthy();
      expect(OAUTH_PROVIDERS[p].tokenUrl).toBeTruthy();
      expect(OAUTH_PROVIDERS[p].scopes.length).toBeGreaterThan(0);
    }
  });

  it("Instagram and Facebook share Meta OAuth but have different scopes", () => {
    const ig = OAUTH_PROVIDERS.instagram;
    const fb = OAUTH_PROVIDERS.facebook;

    // Same auth URL
    expect(ig.authUrl).toBe(fb.authUrl);

    // Same client ID env var
    expect(ig.clientIdEnvKey).toBe(fb.clientIdEnvKey);

    // Different scopes
    expect(ig.scopes).not.toEqual(fb.scopes);
    expect(ig.scopes).toContain("instagram_basic");
    expect(fb.scopes).toContain("pages_manage_posts");
  });

  it("Twitter and TikTok use PKCE", () => {
    expect(OAUTH_PROVIDERS.twitter.usesPKCE).toBe(true);
    expect(OAUTH_PROVIDERS.tiktok.usesPKCE).toBe(true);
  });

  it("Meta platforms do not use PKCE", () => {
    expect(OAUTH_PROVIDERS.instagram.usesPKCE).toBe(false);
    expect(OAUTH_PROVIDERS.facebook.usesPKCE).toBe(false);
    expect(OAUTH_PROVIDERS.whatsapp.usesPKCE).toBe(false);
  });
});

// ─── Redirect URI Tests ──────────────────────────────────────

describe("getRedirectUri", () => {
  it("builds correct callback URL", () => {
    const uri = getRedirectUri("facebook");
    expect(uri).toBe(
      "https://app.purpleglow.co.za/api/social/callback/facebook",
    );
  });

  it("uses localhost as fallback", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    // getRedirectUri uses ?? which won't catch empty string, so delete it
    delete process.env.NEXT_PUBLIC_APP_URL;
    const uri = getRedirectUri("twitter");
    expect(uri).toBe("http://localhost:3000/api/social/callback/twitter");
  });
});

// ─── Client Credentials Tests ────────────────────────────────

describe("getClientCredentials", () => {
  it("returns credentials from env vars", () => {
    const creds = getClientCredentials("facebook");
    expect(creds.clientId).toBe("test-fb-app-id");
    expect(creds.clientSecret).toBe("test-fb-app-secret");
  });

  it("throws when client ID is missing", () => {
    vi.stubEnv("FACEBOOK_APP_ID", "");
    expect(() => getClientCredentials("facebook")).toThrow(
      "Missing env var FACEBOOK_APP_ID",
    );
  });

  it("throws when client secret is missing", () => {
    vi.stubEnv("FACEBOOK_APP_SECRET", "");
    expect(() => getClientCredentials("facebook")).toThrow(
      "Missing env var FACEBOOK_APP_SECRET",
    );
  });
});

// ─── Authorization URL Tests ─────────────────────────────────

describe("buildAuthorizationUrl", () => {
  it("builds a valid Facebook auth URL", () => {
    const { url, state } = buildAuthorizationUrl("facebook", "org-123");
    const parsed = new URL(url);

    expect(parsed.origin + parsed.pathname).toBe(
      "https://www.facebook.com/v21.0/dialog/oauth",
    );
    expect(parsed.searchParams.get("client_id")).toBe("test-fb-app-id");
    expect(parsed.searchParams.get("response_type")).toBe("code");
    expect(parsed.searchParams.get("redirect_uri")).toBe(
      "https://app.purpleglow.co.za/api/social/callback/facebook",
    );
    expect(parsed.searchParams.get("scope")).toContain("pages_manage_posts");
    expect(parsed.searchParams.get("state")).toBe(state.csrfToken);
  });

  it("includes PKCE params for Twitter", () => {
    const { url, state } = buildAuthorizationUrl("twitter", "org-123");
    const parsed = new URL(url);

    expect(parsed.searchParams.get("code_challenge")).toBeTruthy();
    expect(parsed.searchParams.get("code_challenge_method")).toBe("S256");
    expect(state.codeVerifier).toBeTruthy();
  });

  it("does not include PKCE params for Facebook", () => {
    const { url, state } = buildAuthorizationUrl("facebook", "org-123");
    const parsed = new URL(url);

    expect(parsed.searchParams.get("code_challenge")).toBeNull();
    expect(state.codeVerifier).toBeUndefined();
  });

  it("uses client_key for TikTok instead of client_id", () => {
    const { url } = buildAuthorizationUrl("tiktok", "org-123");
    const parsed = new URL(url);

    expect(parsed.searchParams.get("client_key")).toBe("test-tiktok-key");
    expect(parsed.searchParams.get("client_id")).toBeNull();
  });

  it("sets correct state metadata", () => {
    const { state } = buildAuthorizationUrl("linkedin", "org-456");

    expect(state.platform).toBe("linkedin");
    expect(state.orgId).toBe("org-456");
    expect(state.csrfToken).toMatch(/^[0-9a-f]{64}$/);
    expect(state.createdAt).toBeCloseTo(Date.now(), -2);
  });
});
