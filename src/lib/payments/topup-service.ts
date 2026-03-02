/**
 * Credit top-up service — creates Polar checkout sessions and
 * processes successful payments by crediting the organisation.
 *
 * Server-side only — never import in client components.
 *
 * @see src/lib/payments/tier-config.ts for TOP_UP_PACKAGES
 * @see src/lib/credits/credit-service.ts for addCredits
 */

import { getPolar } from "./polar-client";
import { getTopUpPackageByCreditAmount } from "./tier-config";
import { addCredits } from "@/lib/credits/credit-service";
import { logger } from "@/lib/logger";
import type { TopUpResult } from "./types";

// ---------------------------------------------------------------------------
// Checkout creation
// ---------------------------------------------------------------------------

/**
 * Create a Polar checkout session for a credit top-up package.
 *
 * Validates the requested credit amount against available packages,
 * then creates a checkout via the Polar SDK.
 *
 * @param orgId       - Organisation purchasing credits
 * @param userId      - Authenticated user initiating the purchase
 * @param email       - Customer email for the checkout
 * @param creditAmount - Number of credits (must match a TOP_UP_PACKAGES entry)
 */
export async function createTopUpCheckout(
  orgId: string,
  userId: string,
  email: string,
  creditAmount: number,
): Promise<TopUpResult> {
  const pkg = getTopUpPackageByCreditAmount(creditAmount);
  if (!pkg) {
    return { success: false, error: "Invalid credit amount" };
  }

  try {
    const checkout = await getPolar().checkouts.create({
      products: [pkg.polarProductId],
      metadata: {
        orgId,
        userId,
        creditAmount: String(creditAmount),
        type: "topup",
      },
      customerEmail: email,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?topup=success`,
    });

    logger.info("Top-up checkout created", {
      orgId,
      userId,
      creditAmount: String(creditAmount),
      checkoutUrl: checkout.url,
    });

    return { success: true, checkoutUrl: checkout.url };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error creating checkout";
    logger.error("Failed to create top-up checkout", {
      orgId,
      creditAmount: String(creditAmount),
      error: message,
    });
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Payment processing (called from webhook handler)
// ---------------------------------------------------------------------------

/**
 * Process a successful top-up payment by adding credits to the org.
 *
 * Called from the webhook handler when a `checkout.updated` event
 * fires with `metadata.type === 'topup'`.
 *
 * @param orgId        - Organisation that completed the purchase
 * @param creditAmount - Number of credits to add
 */
export async function processTopUpPayment(
  orgId: string,
  creditAmount: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await addCredits(
      orgId,
      creditAmount,
      "purchase",
      `Credit top-up: ${creditAmount} credits`,
    );

    if (!result.success) {
      logger.error("processTopUpPayment: addCredits failed", {
        orgId,
        creditAmount: String(creditAmount),
        error: result.error ?? "Unknown error",
      });
      return { success: false, error: result.error };
    }

    logger.info("Top-up payment processed", {
      orgId,
      creditAmount: String(creditAmount),
      newBalance: String(result.newBalance),
    });

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error processing payment";
    logger.error("processTopUpPayment threw", {
      orgId,
      creditAmount: String(creditAmount),
      error: message,
    });
    return { success: false, error: message };
  }
}
