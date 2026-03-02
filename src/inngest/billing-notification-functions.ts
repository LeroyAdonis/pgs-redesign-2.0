/**
 * Inngest functions — billing notification pipeline
 *
 * Background job handlers that trigger user-facing notifications
 * on billing lifecycle events:
 * - Subscription activated → welcome notification
 * - Payment succeeded → renewal confirmation with credit info
 * - Credits low → warning with top-up suggestion
 * - Subscription cancelled → confirmation with end date
 * - Tier changed → upgrade/downgrade details
 */

import { inngest } from "./client";
import { db } from "@/db";
import { organization } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import {
  notifySubscriptionActivated,
  notifyPaymentSucceeded,
  notifyBillingCreditsLow,
  notifySubscriptionCanceled,
  notifyTierChanged,
} from "@/lib/notifications/notification-triggers";

// ── Event type declarations ─────────────────────────────────────

type SubscriptionActivatedEvent = {
  name: "billing/subscription.activated";
  data: {
    orgId: string;
    tier: string;
    displayName: string;
    creditAllocation: number;
  };
};

type PaymentSucceededEvent = {
  name: "billing/payment.succeeded";
  data: {
    orgId: string;
    tier: string;
    displayName: string;
    creditAllocation: number;
    /** ISO 8601 timestamp */
    periodEnd: string;
  };
};

type CreditsLowEvent = {
  name: "billing/credits.low";
  data: {
    orgId: string;
    userId: string;
    remaining: number;
    total: number;
  };
};

type SubscriptionCanceledEvent = {
  name: "billing/subscription.canceled";
  data: {
    orgId: string;
    tier: string;
    displayName: string;
    /** ISO 8601 timestamp — when access ends */
    endsAt: string;
  };
};

type TierChangedEvent = {
  name: "billing/tier.changed";
  data: {
    orgId: string;
    fromTier: string;
    fromDisplayName: string;
    toTier: string;
    toDisplayName: string;
    newCreditAllocation: number;
    newSocialAccounts: number;
  };
};

// Suppress lint — types used for documentation/cast only
void (undefined as unknown as SubscriptionActivatedEvent);
void (undefined as unknown as PaymentSucceededEvent);
void (undefined as unknown as CreditsLowEvent);
void (undefined as unknown as SubscriptionCanceledEvent);
void (undefined as unknown as TierChangedEvent);

// ── Shared helpers ──────────────────────────────────────────────

/**
 * Resolve the owner userId for an organisation.
 * Returns null if the org cannot be found.
 */
async function findOrgOwner(orgId: string): Promise<string | null> {
  const [org] = await db
    .select({ ownerId: organization.ownerId })
    .from(organization)
    .where(eq(organization.id, orgId))
    .limit(1);

  return org?.ownerId ?? null;
}

// ── billing/subscription.activated ──────────────────────────────

/**
 * Notify the org owner that their subscription has been activated.
 * Includes tier name, credit allocation, and a welcome message.
 */
export const notifyOnSubscriptionActivated = inngest.createFunction(
  {
    id: "billing-subscription-activated",
    retries: 2,
  },
  { event: "billing/subscription.activated" },
  async ({ event, step }) => {
    const { orgId, tier, displayName, creditAllocation } =
      event.data as SubscriptionActivatedEvent["data"];

    await step.run("create-notification", async () => {
      const ownerId = await findOrgOwner(orgId);
      if (!ownerId) {
        logger.warn("billing/subscription.activated: org owner not found", {
          orgId,
        });
        return;
      }

      await notifySubscriptionActivated(ownerId, {
        tier,
        displayName,
        creditAllocation,
      });

      logger.info("Subscription activated notification created", {
        userId: ownerId,
        orgId,
        tier,
      });
    });
  },
);

// ── billing/payment.succeeded ───────────────────────────────────

/**
 * Notify the org owner that their renewal payment succeeded.
 * Includes credit allocation amount and next renewal date.
 */
export const notifyOnPaymentSucceeded = inngest.createFunction(
  {
    id: "billing-payment-succeeded",
    retries: 2,
  },
  { event: "billing/payment.succeeded" },
  async ({ event, step }) => {
    const { orgId, tier, displayName, creditAllocation, periodEnd } =
      event.data as PaymentSucceededEvent["data"];

    await step.run("create-notification", async () => {
      const ownerId = await findOrgOwner(orgId);
      if (!ownerId) {
        logger.warn("billing/payment.succeeded: org owner not found", {
          orgId,
        });
        return;
      }

      await notifyPaymentSucceeded(ownerId, {
        tier,
        displayName,
        creditAllocation,
        periodEnd,
      });

      logger.info("Payment succeeded notification created", {
        userId: ownerId,
        orgId,
        tier,
        creditAllocation,
      });
    });
  },
);

// ── billing/credits.low ─────────────────────────────────────────

/**
 * Warn a user that their credits have dropped to 10% or below.
 * Includes current balance, total allocation, and a top-up suggestion.
 *
 * The userId may be empty when emitted from the credit service;
 * in that case we resolve the org owner instead.
 */
export const notifyOnBillingCreditsLow = inngest.createFunction(
  {
    id: "billing-credits-low",
    retries: 2,
  },
  { event: "billing/credits.low" },
  async ({ event, step }) => {
    const { orgId, userId, remaining, total } =
      event.data as CreditsLowEvent["data"];

    await step.run("create-notification", async () => {
      // Resolve the target user — prefer explicit userId, fall back to org owner
      const targetUserId = userId || (await findOrgOwner(orgId));
      if (!targetUserId) {
        logger.warn("billing/credits.low: cannot resolve user", {
          orgId,
          userId,
        });
        return;
      }

      const percentage =
        total > 0 ? Math.round((remaining / total) * 100) : 0;

      await notifyBillingCreditsLow(targetUserId, {
        remaining,
        total,
        percentage,
      });

      logger.info("Billing credits low notification created", {
        userId: targetUserId,
        remaining,
        total,
        percentage,
      });
    });
  },
);

// ── billing/subscription.canceled ───────────────────────────────

/**
 * Notify the org owner that their subscription has been cancelled.
 * Includes the tier name and the date when access will end.
 */
export const notifyOnSubscriptionCanceled = inngest.createFunction(
  {
    id: "billing-subscription-canceled",
    retries: 2,
  },
  { event: "billing/subscription.canceled" },
  async ({ event, step }) => {
    const { orgId, tier, displayName, endsAt } =
      event.data as SubscriptionCanceledEvent["data"];

    await step.run("create-notification", async () => {
      const ownerId = await findOrgOwner(orgId);
      if (!ownerId) {
        logger.warn("billing/subscription.canceled: org owner not found", {
          orgId,
        });
        return;
      }

      await notifySubscriptionCanceled(ownerId, {
        tier,
        displayName,
        endsAt,
      });

      logger.info("Subscription canceled notification created", {
        userId: ownerId,
        orgId,
        tier,
      });
    });
  },
);

// ── billing/tier.changed ────────────────────────────────────────

/**
 * Notify the org owner that their subscription tier has changed.
 * Includes old→new tier info, new credit allocation, and limits.
 */
export const notifyOnTierChanged = inngest.createFunction(
  {
    id: "billing-tier-changed",
    retries: 2,
  },
  { event: "billing/tier.changed" },
  async ({ event, step }) => {
    const {
      orgId,
      fromTier,
      fromDisplayName,
      toTier,
      toDisplayName,
      newCreditAllocation,
      newSocialAccounts,
    } = event.data as TierChangedEvent["data"];

    await step.run("create-notification", async () => {
      const ownerId = await findOrgOwner(orgId);
      if (!ownerId) {
        logger.warn("billing/tier.changed: org owner not found", {
          orgId,
        });
        return;
      }

      await notifyTierChanged(ownerId, {
        fromTier,
        fromDisplayName,
        toTier,
        toDisplayName,
        newCreditAllocation,
        newSocialAccounts,
      });

      logger.info("Tier changed notification created", {
        userId: ownerId,
        orgId,
        fromTier,
        toTier,
      });
    });
  },
);
