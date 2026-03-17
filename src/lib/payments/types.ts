/**
 * Payment and subscription types for the Polar.sh integration.
 *
 * These types define the shapes used by payment actions, webhook handlers,
 * and UI components. They are intentionally decoupled from the Polar SDK
 * types to keep our domain layer stable across SDK version changes.
 */

import type { Tier } from "./tier-config";

// ---------------------------------------------------------------------------
// Subscription
// ---------------------------------------------------------------------------

export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "trialing";

export interface SubscriptionInfo {
  tier: Tier;
  status: SubscriptionStatus;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  canceledAt: Date | null;
  polarSubscriptionId: string | null;
}

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

export interface CheckoutRequest {
  orgId: string;
  tier: Tier;
  billingInterval: "monthly" | "annual";
}

export interface CheckoutResult {
  success: boolean;
  checkoutUrl?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Tier change (upgrade / downgrade)
// ---------------------------------------------------------------------------

export interface TierChangeRequest {
  orgId: string;
  newTier: Tier;
  billingInterval: "monthly" | "annual";
}

export interface TierChangeResult {
  success: boolean;
  checkoutUrl?: string;
  error?: string;
  message?: string;
}

// ---------------------------------------------------------------------------
// Credit top-up
// ---------------------------------------------------------------------------

export interface TopUpRequest {
  orgId: string;
  creditAmount: number;
}

export interface TopUpResult {
  success: boolean;
  checkoutUrl?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Tier enforcement
// ---------------------------------------------------------------------------

/** Resource types that have tier-based limits */
export type LimitType =
  | "social_accounts"
  | "ai_posts"
  | "image_gen"
  | "video_gen"
  | "team_seats";

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

export type PolarWebhookEvent =
  | "checkout.updated"
  | "subscription.created"
  | "subscription.updated"
  | "subscription.canceled"
  | "subscription.revoked"
  | "order.created";
