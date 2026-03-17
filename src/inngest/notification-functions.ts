/**
 * Inngest functions — notification pipeline
 *
 * Background job handlers that trigger notifications on system events:
 * - Post published / failed → user notification
 * - Low credits → org owner warning
 * - Token expiring → org owner warning (cron every 6 hours)
 * - New signup → admin notification
 * - Subscription change → admin notification
 */

import { inngest } from "./client";
import { db } from "@/db";
import {
  socialAccount,
  organization,
  user,
} from "@/db/schema";
import { eq, and, lte, gte, isNotNull } from "drizzle-orm";
import { logger } from "@/lib/logger";
import {
  notifyPostPublished,
  notifyPostFailed,
  notifyLowCredits,
  notifyTokenExpiring,
  notifyAdminSignup,
  notifyAdminSubscriptionChange,
} from "@/lib/notifications/notification-triggers";

// ── Event type declarations ─────────────────────────────────────

type PostPublishedEvent = {
  name: "notification/post-published";
  data: {
    userId: string;
    postId: string;
    platform: string;
    platformUrl?: string;
  };
};

type PostFailedEvent = {
  name: "notification/post-failed";
  data: {
    userId: string;
    postId: string;
    platform: string;
    error: string;
    retryable: boolean;
  };
};

type LowCreditsEvent = {
  name: "notification/low-credits";
  data: {
    userId: string;
    remaining: number;
    total: number;
  };
};

type AdminSignupEvent = {
  name: "notification/admin-signup";
  data: {
    newUserId: string;
    email: string;
  };
};

type AdminSubscriptionChangeEvent = {
  name: "notification/admin-subscription-change";
  data: {
    userId: string;
    fromTier: string;
    toTier: string;
    action: "upgrade" | "downgrade" | "cancel" | "reactivate";
  };
};

// Suppress lint — types used for documentation/cast only
void (undefined as unknown as PostPublishedEvent);
void (undefined as unknown as PostFailedEvent);
void (undefined as unknown as LowCreditsEvent);
void (undefined as unknown as AdminSignupEvent);
void (undefined as unknown as AdminSubscriptionChangeEvent);

// ── Shared helpers ──────────────────────────────────────────────

/**
 * Find all users with `role = 'admin'` in the user table.
 * Returns an array of admin user IDs.
 */
async function findAdminUsers(): Promise<string[]> {
  const admins = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.role, "admin"));

  return admins.map((a) => a.id);
}

// ── notification/post-published ─────────────────────────────────

/**
 * Notify a user that their post was published successfully.
 */
export const notifyOnPostPublished = inngest.createFunction(
  {
    id: "notify-post-published",
    retries: 2,
  },
  { event: "notification/post-published" },
  async ({ event, step }) => {
    const { userId, postId, platform, platformUrl } =
      event.data as PostPublishedEvent["data"];

    await step.run("create-notification", async () => {
      await notifyPostPublished(userId, {
        postId,
        platform,
        platformUrl,
      });

      logger.info("Post published notification created", {
        userId,
        postId,
        platform,
      });
    });
  },
);

// ── notification/post-failed ────────────────────────────────────

/**
 * Notify a user that their post failed to publish (retries exhausted).
 */
export const notifyOnPostFailed = inngest.createFunction(
  {
    id: "notify-post-failed",
    retries: 2,
  },
  { event: "notification/post-failed" },
  async ({ event, step }) => {
    const { userId, postId, platform, error, retryable } =
      event.data as PostFailedEvent["data"];

    await step.run("create-notification", async () => {
      await notifyPostFailed(userId, {
        postId,
        platform,
        error,
        retryable,
      });

      logger.info("Post failed notification created", {
        userId,
        postId,
        platform,
        retryable,
      });
    });
  },
);

// ── notification/low-credits ────────────────────────────────────

/**
 * Warn a user that their credit balance is low.
 * Calculates percentage from remaining/total before delegating.
 */
export const notifyOnLowCredits = inngest.createFunction(
  {
    id: "notify-low-credits",
    retries: 2,
  },
  { event: "notification/low-credits" },
  async ({ event, step }) => {
    const { userId, remaining, total } =
      event.data as LowCreditsEvent["data"];

    await step.run("create-notification", async () => {
      const percentage =
        total > 0 ? Math.round((remaining / total) * 100) : 0;

      await notifyLowCredits(userId, {
        remaining,
        total,
        percentage,
      });

      logger.info("Low credits notification created", {
        userId,
        remaining,
        total,
        percentage,
      });
    });
  },
);

// ── Token expiring check (cron every 6 hours) ───────────────────

/**
 * Periodic check for social account tokens expiring within 7 days.
 * Finds the organisation owner for each expiring account and
 * creates a warning notification.
 */
export const checkExpiringTokens = inngest.createFunction(
  {
    id: "notify-check-expiring-tokens",
    retries: 1,
  },
  { cron: "0 */6 * * *" }, // Every 6 hours
  async ({ step }) => {
    // Step 1: Find tokens expiring within 7 days
    const expiringAccounts = await step.run(
      "find-expiring-tokens",
      async () => {
        const now = new Date();
        const sevenDaysFromNow = new Date(
          now.getTime() + 7 * 24 * 60 * 60 * 1000,
        );

        const accounts = await db
          .select({
            socialAccountId: socialAccount.id,
            platform: socialAccount.platform,
            tokenExpiresAt: socialAccount.tokenExpiresAt,
            orgId: socialAccount.orgId,
          })
          .from(socialAccount)
          .where(
            and(
              eq(socialAccount.isActive, true),
              isNotNull(socialAccount.tokenExpiresAt),
              lte(socialAccount.tokenExpiresAt, sevenDaysFromNow),
              gte(socialAccount.tokenExpiresAt, now),
            ),
          );

        logger.info("Token expiry check: found expiring accounts", {
          count: accounts.length,
        });

        return accounts.map((a) => ({
          socialAccountId: a.socialAccountId,
          platform: a.platform,
          tokenExpiresAt: a.tokenExpiresAt!.toISOString(),
          orgId: a.orgId,
        }));
      },
    );

    if (expiringAccounts.length === 0) return;

    // Step 2: Notify the owner of each affected organisation
    await step.run("notify-owners", async () => {
      for (const account of expiringAccounts) {
        try {
          // Find the org owner
          const [org] = await db
            .select({ ownerId: organization.ownerId })
            .from(organization)
            .where(eq(organization.id, account.orgId))
            .limit(1);

          if (!org) {
            logger.warn("Token expiry: org not found", {
              orgId: account.orgId,
            });
            continue;
          }

          await notifyTokenExpiring(org.ownerId, {
            socialAccountId: account.socialAccountId,
            platform: account.platform,
            expiresAt: account.tokenExpiresAt,
          });

          logger.info("Token expiring notification created", {
            userId: org.ownerId,
            socialAccountId: account.socialAccountId,
            platform: account.platform,
          });
        } catch (error) {
          logger.error("Token expiry: failed to notify", {
            socialAccountId: account.socialAccountId,
            error:
              error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    });
  },
);

// ── notification/admin-signup ───────────────────────────────────

/**
 * Notify all admin users about a new user signup.
 */
export const notifyOnSignup = inngest.createFunction(
  {
    id: "notify-admin-signup",
    retries: 2,
  },
  { event: "notification/admin-signup" },
  async ({ event, step }) => {
    const { newUserId, email } =
      event.data as AdminSignupEvent["data"];

    await step.run("notify-admins", async () => {
      const adminIds = await findAdminUsers();

      if (adminIds.length === 0) {
        logger.warn("Admin signup notification: no admin users found");
        return;
      }

      for (const adminId of adminIds) {
        try {
          await notifyAdminSignup(adminId, { newUserId, email });
        } catch (error) {
          logger.error("Failed to notify admin of signup", {
            adminId,
            newUserId,
            error:
              error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      logger.info("Admin signup notifications created", {
        newUserId,
        email,
        adminCount: adminIds.length,
      });
    });
  },
);

// ── notification/admin-subscription-change ──────────────────────

/**
 * Notify all admin users about a subscription tier change.
 */
export const notifyOnSubscriptionChange = inngest.createFunction(
  {
    id: "notify-admin-subscription-change",
    retries: 2,
  },
  { event: "notification/admin-subscription-change" },
  async ({ event, step }) => {
    const { userId, fromTier, toTier, action } =
      event.data as AdminSubscriptionChangeEvent["data"];

    await step.run("notify-admins", async () => {
      const adminIds = await findAdminUsers();

      if (adminIds.length === 0) {
        logger.warn(
          "Admin subscription notification: no admin users found",
        );
        return;
      }

      for (const adminId of adminIds) {
        try {
          await notifyAdminSubscriptionChange(adminId, {
            userId,
            fromTier,
            toTier,
            action,
          });
        } catch (error) {
          logger.error("Failed to notify admin of subscription change", {
            adminId,
            userId,
            error:
              error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      logger.info("Admin subscription change notifications created", {
        userId,
        fromTier,
        toTier,
        action,
        adminCount: adminIds.length,
      });
    });
  },
);
