/**
 * Subscription management service
 *
 * Server-side operations for creating checkouts, managing subscriptions,
 * handling tier changes, and processing webhook-driven activations.
 *
 * Uses Polar.sh for payment processing. Free tier (seedling) is handled
 * locally without Polar involvement.
 *
 * Atomicity note: Neon HTTP driver does not support interactive transactions.
 * Each DB operation is a separate atomic query.
 */

import { db } from "@/db";
import { subscription, organization, credit } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { getPolar } from "./polar-client";
import { addCredits } from "@/lib/credits";
import {
  getTierConfig,
  getTierByPolarProductId,
  TIER_CONFIGS,
  type Tier,
  type BillingInterval,
} from "./tier-config";
import type {
  CheckoutResult,
  SubscriptionInfo,
  TierChangeResult,
} from "./types";

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

/**
 * Create a checkout session for a subscription tier.
 *
 * For seedling (free): directly activates the tier without Polar.
 * For paid tiers: creates a Polar checkout and returns the URL.
 */
export async function createCheckoutSession(
  orgId: string,
  userId: string,
  email: string,
  tier: Tier,
  billingInterval: BillingInterval,
): Promise<CheckoutResult> {
  const config = getTierConfig(tier);

  // Free tier — activate directly without Polar
  if (tier === "seedling") {
    await activateSubscription(orgId, "seedling", null, null, null);
    logger.info("Seedling tier activated directly", { orgId, userId });
    return { success: true };
  }

  // Paid tier — resolve the Polar product ID
  const polarProductId =
    billingInterval === "annual"
      ? config.polarProductIdAnnual
      : config.polarProductIdMonthly;

  if (!polarProductId) {
    logger.error("Missing Polar product ID for tier", {
      tier,
      billingInterval,
    });
    return {
      success: false,
      error: `No Polar product configured for ${tier} (${billingInterval})`,
    };
  }

  try {
    const checkout = await getPolar().checkouts.create({
      products: [polarProductId],
      metadata: { orgId, userId },
      customerEmail: email,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/billing?checkout=success`,
    });

    logger.info("Polar checkout created", {
      orgId,
      tier,
      billingInterval,
      checkoutId: checkout.id,
    });

    return { success: true, checkoutUrl: checkout.url };
  } catch (error) {
    logger.error("Failed to create Polar checkout", {
      error: error instanceof Error ? error.message : "Unknown error",
      orgId,
      tier,
    });
    return { success: false, error: "Failed to create checkout session" };
  }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Get the current subscription info for an organisation.
 * Returns null if no subscription record exists.
 */
export async function getCurrentSubscription(
  orgId: string,
): Promise<SubscriptionInfo | null> {
  const rows = await db
    .select()
    .from(subscription)
    .where(eq(subscription.orgId, orgId))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    tier: row.tier,
    status: row.status,
    currentPeriodStart: row.currentPeriodStart,
    currentPeriodEnd: row.currentPeriodEnd,
    canceledAt: row.canceledAt,
    polarSubscriptionId: row.polarSubscriptionId,
  };
}

// ---------------------------------------------------------------------------
// Cancellation
// ---------------------------------------------------------------------------

/**
 * Cancel the current subscription at the end of the billing period.
 *
 * Does NOT immediately downgrade — the webhook handler will do that
 * when the period ends and the subscription is revoked.
 */
export async function cancelSubscription(
  orgId: string,
): Promise<{ success: boolean; error?: string }> {
  const current = await getCurrentSubscription(orgId);

  if (!current || current.status !== "active") {
    return { success: false, error: "No active subscription to cancel" };
  }

  if (!current.polarSubscriptionId) {
    return {
      success: false,
      error: "No Polar subscription ID — cannot cancel a free tier",
    };
  }

  try {
    await getPolar().subscriptions.update({
      id: current.polarSubscriptionId,
      subscriptionUpdate: { cancelAtPeriodEnd: true },
    });

    await db
      .update(subscription)
      .set({ canceledAt: new Date() })
      .where(eq(subscription.orgId, orgId));

    logger.info("Subscription canceled at period end", {
      orgId,
      polarSubscriptionId: current.polarSubscriptionId,
    });

    return { success: true };
  } catch (error) {
    logger.error("Failed to cancel subscription via Polar", {
      error: error instanceof Error ? error.message : "Unknown error",
      orgId,
    });
    return { success: false, error: "Failed to cancel subscription" };
  }
}

// ---------------------------------------------------------------------------
// Tier change
// ---------------------------------------------------------------------------

/**
 * Handle a tier change (upgrade, downgrade, or cross-tier switch).
 *
 * - Downgrade to seedling: cancel current subscription
 * - Upgrade from seedling: create new checkout
 * - Switch between paid tiers: cancel current at period end + create new checkout
 */
export async function handleTierChange(
  orgId: string,
  userId: string,
  email: string,
  newTier: Tier,
  billingInterval: BillingInterval,
): Promise<TierChangeResult> {
  const current = await getCurrentSubscription(orgId);
  const currentTier = current?.tier ?? "seedling";

  if (newTier === currentTier) {
    return { success: false, error: "Already on this tier" };
  }

  // Downgrade to seedling
  if (newTier === "seedling") {
    if (current?.polarSubscriptionId) {
      const cancelResult = await cancelSubscription(orgId);
      if (!cancelResult.success) {
        return { success: false, error: cancelResult.error };
      }
    }
    return {
      success: true,
      message:
        "Subscription will be canceled at the end of the current billing period",
    };
  }

  // Upgrade from seedling — just create a new checkout
  if (currentTier === "seedling") {
    return createCheckoutSession(orgId, userId, email, newTier, billingInterval);
  }

  // Switch between paid tiers — cancel current at period end, create new checkout
  if (current?.polarSubscriptionId) {
    const cancelResult = await cancelSubscription(orgId);
    if (!cancelResult.success) {
      return { success: false, error: cancelResult.error };
    }
  }

  const checkoutResult = await createCheckoutSession(
    orgId,
    userId,
    email,
    newTier,
    billingInterval,
  );

  return {
    success: checkoutResult.success,
    checkoutUrl: checkoutResult.checkoutUrl,
    message: checkoutResult.success
      ? "Current subscription will end at period close. Complete checkout for new tier."
      : undefined,
    error: checkoutResult.error,
  };
}

// ---------------------------------------------------------------------------
// Webhook-driven activation / deactivation
// ---------------------------------------------------------------------------

/**
 * Activate (or reactivate) a subscription after a successful payment.
 *
 * Called from webhook handlers — not from API routes directly.
 *
 * Each DB operation is a separate atomic query because the Neon HTTP
 * driver does not support interactive transactions.
 */
export async function activateSubscription(
  orgId: string,
  tier: Tier,
  polarSubscriptionId: string | null,
  periodStart: Date | null,
  periodEnd: Date | null,
): Promise<void> {
  const config = getTierConfig(tier);

  // 1. Upsert subscription record
  const existing = await db
    .select({ id: subscription.id })
    .from(subscription)
    .where(eq(subscription.orgId, orgId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(subscription)
      .set({
        tier,
        status: "active",
        polarSubscriptionId,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        canceledAt: null,
      })
      .where(eq(subscription.orgId, orgId));
  } else {
    await db.insert(subscription).values({
      orgId,
      tier,
      status: "active",
      polarSubscriptionId,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    });
  }

  // 2. Update organization tier
  await db
    .update(organization)
    .set({ tier })
    .where(eq(organization.id, orgId));

  // 3. Update credit monthly allocation
  await db
    .update(credit)
    .set({ monthlyAllocation: config.creditAllocation })
    .where(eq(credit.orgId, orgId));

  // 4. Allocate credits
  await addCredits(
    orgId,
    config.creditAllocation,
    "allocation",
    `Monthly credit allocation for ${config.displayName} tier`,
  );

  logger.info("Subscription activated", {
    orgId,
    tier,
    polarSubscriptionId,
    creditAllocation: config.creditAllocation,
  });
}

/**
 * Deactivate a subscription (canceled or revoked by Polar).
 *
 * Downgrades the org to seedling tier but preserves current credit balance.
 */
export async function deactivateSubscription(orgId: string): Promise<void> {
  const seedlingConfig = TIER_CONFIGS.seedling;

  // 1. Update subscription status
  await db
    .update(subscription)
    .set({ status: "canceled" })
    .where(eq(subscription.orgId, orgId));

  // 2. Downgrade organization tier
  await db
    .update(organization)
    .set({ tier: "seedling" })
    .where(eq(organization.id, orgId));

  // 3. Update credit allocation (do NOT zero out balance)
  await db
    .update(credit)
    .set({ monthlyAllocation: seedlingConfig.creditAllocation })
    .where(eq(credit.orgId, orgId));

  logger.info("Subscription deactivated — downgraded to seedling", { orgId });
}

// Re-export for convenience in webhook handler
export { getTierByPolarProductId };
