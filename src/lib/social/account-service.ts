/**
 * Social account service — CRUD operations for linked social accounts.
 *
 * Handles the data layer for connecting, disconnecting, and managing
 * social platform accounts within an organization. All token storage
 * uses AES-256-GCM encryption via lib/crypto/.
 *
 * Organization membership is enforced: a user must be a member of the
 * org to perform any account operations.
 */

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { socialAccount, organizationMember } from "@/db/schema";
import { encrypt, decrypt } from "@/lib/crypto";
import { logger } from "@/lib/logger";

import { refreshAccessToken } from "./oauth";
import type { Platform, OAuthTokenResponse, SocialAccountDTO } from "./types";

// ─── Constants ───────────────────────────────────────────────

/** Token expiry warning threshold: 7 days in milliseconds. */
const EXPIRY_WARNING_MS = 7 * 24 * 60 * 60 * 1000;

// ─── Authorization ───────────────────────────────────────────

/**
 * Verify that a user is a member of the specified organization.
 * Throws if the user is not authorized.
 */
export async function requireOrgMembership(
  userId: string,
  orgId: string,
): Promise<void> {
  const member = await db.query.organizationMember.findFirst({
    where: and(
      eq(organizationMember.userId, userId),
      eq(organizationMember.orgId, orgId),
    ),
  });

  if (!member) {
    throw new Error("You are not a member of this organization.");
  }
}

// ─── Queries ─────────────────────────────────────────────────

/**
 * List all active social accounts for an organization.
 * Returns DTOs with derived connection status (no tokens exposed).
 */
export async function listAccountsForOrg(
  orgId: string,
): Promise<SocialAccountDTO[]> {
  const accounts = await db.query.socialAccount.findMany({
    where: eq(socialAccount.orgId, orgId),
    orderBy: (sa, { asc }) => [asc(sa.connectedAt)],
  });

  return accounts.map(toDTO);
}

/**
 * Get a single social account by ID.
 * Returns null if not found.
 */
export async function getAccountById(
  accountId: string,
): Promise<typeof socialAccount.$inferSelect | null> {
  const account = await db.query.socialAccount.findFirst({
    where: eq(socialAccount.id, accountId),
  });

  return account ?? null;
}

// ─── Mutations ───────────────────────────────────────────────

/**
 * Create or reactivate a social account after successful OAuth.
 *
 * If an account with the same org + platform + platformUserId already
 * exists, it's updated (reactivated if deactivated, tokens refreshed).
 */
export async function upsertSocialAccount(params: {
  orgId: string;
  platform: Platform;
  platformUserId: string;
  displayName: string;
  tokens: OAuthTokenResponse;
  pageId?: string;
}): Promise<string> {
  const { orgId, platform, platformUserId, displayName, tokens, pageId } = params;

  const accessTokenEncrypted = encrypt(tokens.accessToken);
  const refreshTokenEncrypted = tokens.refreshToken
    ? encrypt(tokens.refreshToken)
    : null;
  const tokenExpiresAt = tokens.expiresIn
    ? new Date(Date.now() + tokens.expiresIn * 1000)
    : null;

  // Check for existing account
  const existing = await db.query.socialAccount.findFirst({
    where: and(
      eq(socialAccount.orgId, orgId),
      eq(socialAccount.platform, platform),
      eq(socialAccount.platformUserId, platformUserId),
    ),
  });

  if (existing) {
    // Update existing account
    await db
      .update(socialAccount)
      .set({
        displayName,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        tokenExpiresAt,
        pageId: pageId ?? existing.pageId,
        isActive: true,
        connectedAt: new Date(),
      })
      .where(eq(socialAccount.id, existing.id));

    logger.info("Social account reconnected", {
      accountId: existing.id,
      platform,
    });

    return existing.id;
  }

  // Create new account
  const [created] = await db
    .insert(socialAccount)
    .values({
      orgId,
      platform,
      platformUserId,
      displayName,
      accessTokenEncrypted,
      refreshTokenEncrypted,
      tokenExpiresAt,
      pageId,
      isActive: true,
    })
    .returning({ id: socialAccount.id });

  logger.info("Social account connected", {
    accountId: created.id,
    platform,
  });

  return created.id;
}

/**
 * Soft-delete a social account by setting isActive = false.
 * Does NOT delete the row — preserves history and brand profiles.
 */
export async function disconnectAccount(accountId: string): Promise<void> {
  await db
    .update(socialAccount)
    .set({ isActive: false })
    .where(eq(socialAccount.id, accountId));

  logger.info("Social account disconnected", { accountId });
}

/**
 * Refresh an account's expired token.
 *
 * Decrypts the stored refresh token, calls the platform's refresh
 * endpoint, and stores the new encrypted tokens.
 *
 * @returns true if refresh succeeded, false otherwise
 */
export async function refreshAccountToken(
  accountId: string,
): Promise<boolean> {
  const account = await getAccountById(accountId);

  if (!account) {
    logger.warn("Cannot refresh token: account not found", { accountId });
    return false;
  }

  if (!account.refreshTokenEncrypted && !account.accessTokenEncrypted) {
    logger.warn("Cannot refresh token: no token stored", { accountId });
    return false;
  }

  // For Meta platforms, use the access token for long-lived exchange
  const tokenToRefresh = account.refreshTokenEncrypted
    ? decrypt(account.refreshTokenEncrypted)
    : decrypt(account.accessTokenEncrypted!);

  const newTokens = await refreshAccessToken(
    account.platform as Platform,
    tokenToRefresh,
  );

  if (!newTokens) {
    logger.warn("Token refresh failed", {
      accountId,
      platform: account.platform,
    });
    return false;
  }

  const accessTokenEncrypted = encrypt(newTokens.accessToken);
  const refreshTokenEncrypted = newTokens.refreshToken
    ? encrypt(newTokens.refreshToken)
    : account.refreshTokenEncrypted; // Keep existing if no new one
  const tokenExpiresAt = newTokens.expiresIn
    ? new Date(Date.now() + newTokens.expiresIn * 1000)
    : null;

  await db
    .update(socialAccount)
    .set({
      accessTokenEncrypted,
      refreshTokenEncrypted,
      tokenExpiresAt,
    })
    .where(eq(socialAccount.id, accountId));

  logger.info("Token refreshed successfully", {
    accountId,
    platform: account.platform,
  });

  return true;
}

/**
 * Get the decrypted access token for a social account.
 * Used internally when making API calls on behalf of the user.
 */
export async function getDecryptedAccessToken(
  accountId: string,
): Promise<string | null> {
  const account = await getAccountById(accountId);

  if (!account?.accessTokenEncrypted) {
    return null;
  }

  return decrypt(account.accessTokenEncrypted);
}

// ─── DTO Mapping ─────────────────────────────────────────────

/** Convert a DB row to a frontend-safe DTO (no encrypted tokens). */
function toDTO(
  account: typeof socialAccount.$inferSelect,
): SocialAccountDTO {
  return {
    id: account.id,
    platform: account.platform as Platform,
    displayName: account.displayName,
    platformUserId: account.platformUserId,
    isActive: account.isActive,
    connectedAt: account.connectedAt.toISOString(),
    tokenExpiresAt: account.tokenExpiresAt?.toISOString() ?? null,
    status: deriveStatus(account),
  };
}

/** Derive the connection health status from token expiry. */
function deriveStatus(
  account: typeof socialAccount.$inferSelect,
): SocialAccountDTO["status"] {
  if (!account.isActive) {
    return "error";
  }

  if (!account.tokenExpiresAt) {
    // No expiry info — assume connected (long-lived token)
    return "connected";
  }

  const now = Date.now();
  const expiresAt = account.tokenExpiresAt.getTime();

  if (expiresAt < now) {
    return "expired";
  }

  if (expiresAt - now < EXPIRY_WARNING_MS) {
    return "expiring";
  }

  return "connected";
}
