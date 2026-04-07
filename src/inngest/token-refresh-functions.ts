/**
 * Inngest function — automated OAuth token refresh
 *
 * Runs every 6 hours to check for expiring social account tokens
 * and refreshes them before they expire.
 */

import { inngest } from "./client";
import { db } from "@/db";
import { socialAccount } from "@/db/schema";
import { lte, and, isNotNull, eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { decrypt, encrypt } from "@/lib/crypto";
import { OAUTH_PROVIDERS, getClientCredentials } from "@/lib/social/providers";
import type { Platform } from "@/lib/social/types";

/**
 * Refresh tokens that expire within the next 24 hours.
 * Runs every 6 hours via cron.
 */
export const refreshExpiringTokens = inngest.createFunction(
  { id: "tokens/refresh-expiring", name: "Refresh Expiring Tokens" },
  { cron: "0 */6 * * *" }, // Every 6 hours
  async ({ step }) => {
    const expiryThreshold = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const expiring = await step.run("find-expiring-tokens", async () => {
      return db
        .select()
        .from(socialAccount)
        .where(
          and(
            isNotNull(socialAccount.refreshTokenEncrypted),
            isNotNull(socialAccount.tokenExpiresAt),
            lte(socialAccount.tokenExpiresAt, expiryThreshold),
            eq(socialAccount.isActive, true),
          ),
        );
    });

    logger.info("Token refresh: found expiring accounts", {
      count: expiring.length,
    });

    let refreshed = 0;
    let failed = 0;

    for (const account of expiring) {
      try {
        await step.run(`refresh-${account.id}`, async () => {
          if (!account.refreshTokenEncrypted) return;

          const refreshToken = decrypt(account.refreshTokenEncrypted);
          const platform = account.platform as Platform;
          const config = OAUTH_PROVIDERS[platform];
          const { clientId, clientSecret } = getClientCredentials(platform);

          const response = await fetch(config.tokenUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              grant_type: "refresh_token",
              refresh_token: refreshToken,
              client_id: clientId,
              client_secret: clientSecret,
            }),
          });

          if (!response.ok) {
            throw new Error(`Token refresh failed: ${response.status}`);
          }

          const data = await response.json();

          await db
            .update(socialAccount)
            .set({
              accessTokenEncrypted: encrypt(data.access_token),
              ...(data.refresh_token && {
                refreshTokenEncrypted: encrypt(data.refresh_token),
              }),
              tokenExpiresAt: data.expires_in
                ? new Date(Date.now() + data.expires_in * 1000)
                : null,
            })
            .where(eq(socialAccount.id, account.id));

          logger.info("Token refreshed", {
            accountId: account.id,
            platform,
          });
        });
        refreshed++;
      } catch (err) {
        failed++;
        logger.error("Token refresh failed for account", {
          accountId: account.id,
          error: err instanceof Error ? err.message : "Unknown",
        });
      }
    }

    return { total: expiring.length, refreshed, failed };
  },
);
