/**
 * POST /api/webhooks/polar — Polar.sh webhook handler
 *
 * Processes subscription lifecycle events from Polar:
 * - checkout.updated (succeeded): initiate subscription activation
 * - subscription.created / .updated / .canceled / .revoked
 * - order.created (subscription_cycle): renewal credit allocation
 *
 * Authentication: webhook signature verification only — NO session auth.
 * Returns 200 immediately for all events to avoid Polar retries.
 */

import { NextRequest, NextResponse } from "next/server";
import { Webhooks } from "@polar-sh/nextjs";
import type { WebhooksConfig } from "@polar-sh/adapter-utils";
import { logger } from "@/lib/logger";
import {
  activateSubscription,
  deactivateSubscription,
  getTierByPolarProductId,
} from "@/lib/payments/subscription-service";
import { getTierConfig } from "@/lib/payments/tier-config";
import { addCredits } from "@/lib/credits";
import { db } from "@/db";
import { subscription } from "@/db/schema";
import { eq } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Extract payload types from WebhooksConfig to avoid dual-SDK type conflicts
// between @polar-sh/sdk (our dependency) and @polar-sh/adapter-utils' bundled copy.
// ---------------------------------------------------------------------------

type HandlerPayload<K extends keyof WebhooksConfig> = NonNullable<
  WebhooksConfig[K]
> extends (payload: infer P) => unknown
  ? P
  : never;

type CheckoutUpdatedPayload = HandlerPayload<"onCheckoutUpdated">;
type SubscriptionCreatedPayload = HandlerPayload<"onSubscriptionCreated">;
type SubscriptionUpdatedPayload = HandlerPayload<"onSubscriptionUpdated">;
type SubscriptionCanceledPayload = HandlerPayload<"onSubscriptionCanceled">;
type SubscriptionRevokedPayload = HandlerPayload<"onSubscriptionRevoked">;
type OrderCreatedPayload = HandlerPayload<"onOrderCreated">;

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handleCheckoutUpdated(
  payload: CheckoutUpdatedPayload,
): Promise<void> {
  const checkout = payload.data;

  if (checkout.status !== "succeeded") {
    logger.debug("Checkout not yet succeeded, skipping", {
      checkoutId: checkout.id,
      status: checkout.status,
    });
    return;
  }

  const orgId = checkout.metadata?.["orgId"] as string | undefined;
  if (!orgId) {
    logger.warn("Checkout succeeded but missing orgId in metadata", {
      checkoutId: checkout.id,
    });
    return;
  }

  const productId = checkout.productId;
  if (!productId) {
    logger.warn("Checkout succeeded but missing productId", {
      checkoutId: checkout.id,
    });
    return;
  }

  const tier = getTierByPolarProductId(productId);
  if (!tier) {
    logger.warn("Checkout product ID does not match any tier", {
      checkoutId: checkout.id,
      productId,
    });
    return;
  }

  logger.info("Checkout succeeded — will activate on subscription.created", {
    checkoutId: checkout.id,
    orgId,
    tier,
  });
}

async function handleSubscriptionCreated(
  payload: SubscriptionCreatedPayload,
): Promise<void> {
  const sub = payload.data;
  const orgId = sub.metadata?.["orgId"] as string | undefined;

  if (!orgId) {
    logger.warn("Subscription created but missing orgId in metadata", {
      subscriptionId: sub.id,
    });
    return;
  }

  const tier = getTierByPolarProductId(sub.productId);
  if (!tier) {
    logger.warn("Subscription product ID does not match any tier", {
      subscriptionId: sub.id,
      productId: sub.productId,
    });
    return;
  }

  await activateSubscription(
    orgId,
    tier,
    sub.id,
    sub.currentPeriodStart,
    sub.currentPeriodEnd,
  );

  logger.info("Subscription created and activated", {
    subscriptionId: sub.id,
    orgId,
    tier,
  });
}

async function handleSubscriptionUpdated(
  payload: SubscriptionUpdatedPayload,
): Promise<void> {
  const sub = payload.data;
  const orgId = sub.metadata?.["orgId"] as string | undefined;

  if (!orgId) {
    // Try to find the org via the polar subscription ID in our DB
    const rows = await db
      .select({ orgId: subscription.orgId })
      .from(subscription)
      .where(eq(subscription.polarSubscriptionId, sub.id))
      .limit(1);

    if (rows.length === 0) {
      logger.warn("Subscription updated but cannot resolve orgId", {
        subscriptionId: sub.id,
      });
      return;
    }

    const resolvedOrgId = rows[0].orgId;

    if (sub.status === "active") {
      const tier = getTierByPolarProductId(sub.productId);
      if (tier) {
        await activateSubscription(
          resolvedOrgId,
          tier,
          sub.id,
          sub.currentPeriodStart,
          sub.currentPeriodEnd,
        );
      }
    } else if (sub.status === "past_due") {
      await db
        .update(subscription)
        .set({ status: "past_due" })
        .where(eq(subscription.orgId, resolvedOrgId));
      logger.warn("Subscription past due", {
        subscriptionId: sub.id,
        orgId: resolvedOrgId,
      });
    }
    return;
  }

  if (sub.status === "active") {
    const tier = getTierByPolarProductId(sub.productId);
    if (tier) {
      await activateSubscription(
        orgId,
        tier,
        sub.id,
        sub.currentPeriodStart,
        sub.currentPeriodEnd,
      );
    }
  } else if (sub.status === "past_due") {
    await db
      .update(subscription)
      .set({ status: "past_due" })
      .where(eq(subscription.orgId, orgId));
    logger.warn("Subscription past due", { subscriptionId: sub.id, orgId });
  }
}

async function handleSubscriptionCanceled(
  payload: SubscriptionCanceledPayload,
): Promise<void> {
  const sub = payload.data;
  const orgId = sub.metadata?.["orgId"] as string | undefined;

  if (orgId) {
    await deactivateSubscription(orgId);
    logger.info("Subscription canceled", { subscriptionId: sub.id, orgId });
    return;
  }

  // Fallback: find org via polar subscription ID
  const rows = await db
    .select({ orgId: subscription.orgId })
    .from(subscription)
    .where(eq(subscription.polarSubscriptionId, sub.id))
    .limit(1);

  if (rows.length > 0) {
    await deactivateSubscription(rows[0].orgId);
    logger.info("Subscription canceled (resolved via DB)", {
      subscriptionId: sub.id,
      orgId: rows[0].orgId,
    });
  } else {
    logger.warn("Subscription canceled but cannot resolve orgId", {
      subscriptionId: sub.id,
    });
  }
}

async function handleSubscriptionRevoked(
  payload: SubscriptionRevokedPayload,
): Promise<void> {
  const sub = payload.data;
  const orgId = sub.metadata?.["orgId"] as string | undefined;

  if (orgId) {
    await deactivateSubscription(orgId);
    logger.info("Subscription revoked", { subscriptionId: sub.id, orgId });
    return;
  }

  const rows = await db
    .select({ orgId: subscription.orgId })
    .from(subscription)
    .where(eq(subscription.polarSubscriptionId, sub.id))
    .limit(1);

  if (rows.length > 0) {
    await deactivateSubscription(rows[0].orgId);
    logger.info("Subscription revoked (resolved via DB)", {
      subscriptionId: sub.id,
      orgId: rows[0].orgId,
    });
  } else {
    logger.warn("Subscription revoked but cannot resolve orgId", {
      subscriptionId: sub.id,
    });
  }
}

async function handleOrderCreated(
  payload: OrderCreatedPayload,
): Promise<void> {
  const order = payload.data;

  if (order.billingReason !== "subscription_cycle") {
    logger.debug("Order is not a renewal, skipping credit allocation", {
      orderId: order.id,
      billingReason: order.billingReason,
    });
    return;
  }

  const orgId = order.metadata?.["orgId"] as string | undefined;
  if (!orgId) {
    // Fallback: resolve via subscription ID
    if (order.subscriptionId) {
      const rows = await db
        .select({ orgId: subscription.orgId, tier: subscription.tier })
        .from(subscription)
        .where(eq(subscription.polarSubscriptionId, order.subscriptionId))
        .limit(1);

      if (rows.length > 0) {
        const config = getTierConfig(rows[0].tier);
        await addCredits(
          rows[0].orgId,
          config.creditAllocation,
          "allocation",
          `Monthly renewal credit allocation for ${config.displayName} tier`,
        );
        logger.info("Renewal credits allocated (resolved via subscription)", {
          orderId: order.id,
          orgId: rows[0].orgId,
          credits: config.creditAllocation,
        });
      }
    }
    return;
  }

  // Resolve tier from product ID
  const productId = order.productId;
  if (!productId) {
    logger.warn("Renewal order missing productId", { orderId: order.id });
    return;
  }

  const tier = getTierByPolarProductId(productId);
  if (!tier) {
    logger.warn("Renewal order product ID does not match any tier", {
      orderId: order.id,
      productId,
    });
    return;
  }

  const config = getTierConfig(tier);
  await addCredits(
    orgId,
    config.creditAllocation,
    "allocation",
    `Monthly renewal credit allocation for ${config.displayName} tier`,
  );

  logger.info("Renewal credits allocated", {
    orderId: order.id,
    orgId,
    tier,
    credits: config.creditAllocation,
  });
}

// ---------------------------------------------------------------------------
// Webhook route handler — uses @polar-sh/nextjs Webhooks helper
// ---------------------------------------------------------------------------

const webhookSecret = process.env.POLAR_WEBHOOK_SECRET ?? "";

const handler = Webhooks({
  webhookSecret,
  onCheckoutUpdated: handleCheckoutUpdated,
  onSubscriptionCreated: handleSubscriptionCreated,
  onSubscriptionUpdated: handleSubscriptionUpdated,
  onSubscriptionCanceled: handleSubscriptionCanceled,
  onSubscriptionRevoked: handleSubscriptionRevoked,
  onOrderCreated: handleOrderCreated,
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const response = await handler(request);
    return response;
  } catch (error) {
    logger.error("Webhook processing failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    // Always return 200 to prevent Polar from retrying on processing errors
    // Signature verification failures inside the Webhooks helper will throw
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
