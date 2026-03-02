/**
 * Notification trigger helpers
 *
 * Convenience functions that compose human-readable notification
 * titles and messages from structured event data, then delegate
 * to `createNotification`. Each trigger maps to a specific
 * application event and sets the appropriate notification type.
 */

import { createNotification } from "./notification-service";
import type {
  PostPublishedData,
  PostFailedData,
  LowCreditsData,
  TokenExpiringData,
  WeeklyDigestData,
  ScheduledReminderData,
  AdminSignupData,
  AdminSubscriptionData,
  SubscriptionActivatedData,
  PaymentSucceededData,
  BillingCreditsLowData,
  SubscriptionCanceledData,
  TierChangedData,
} from "./types";

// ---------------------------------------------------------------------------
// Post lifecycle
// ---------------------------------------------------------------------------

/**
 * Notify a user that their post was published successfully.
 * Creates a **success** notification.
 */
export async function notifyPostPublished(
  userId: string,
  data: PostPublishedData,
) {
  return createNotification({
    userId,
    type: "success",
    title: "Post Published",
    message: `Your post was published to ${data.platform} successfully.`,
    data,
  });
}

/**
 * Notify a user that their post failed to publish.
 * Creates an **error** notification.
 */
export async function notifyPostFailed(
  userId: string,
  data: PostFailedData,
) {
  const retryHint = data.retryable ? " You can retry this post." : "";
  return createNotification({
    userId,
    type: "error",
    title: "Post Failed",
    message: `Your post to ${data.platform} failed: ${data.error}.${retryHint}`,
    data,
  });
}

// ---------------------------------------------------------------------------
// Account health
// ---------------------------------------------------------------------------

/**
 * Warn a user about a low credit balance.
 * Creates a **warning** notification.
 */
export async function notifyLowCredits(
  userId: string,
  data: LowCreditsData,
) {
  return createNotification({
    userId,
    type: "warning",
    title: "Low Credits",
    message: `You have ${data.remaining} of ${data.total} credits remaining (${data.percentage}%).`,
    data,
  });
}

/**
 * Warn a user that a social-account token is about to expire.
 * Creates a **warning** notification.
 */
export async function notifyTokenExpiring(
  userId: string,
  data: TokenExpiringData,
) {
  return createNotification({
    userId,
    type: "warning",
    title: "Token Expiring",
    message: `Your ${data.platform} connection will expire soon. Please reconnect to avoid interruptions.`,
    data,
  });
}

// ---------------------------------------------------------------------------
// Informational
// ---------------------------------------------------------------------------

/**
 * Send a weekly performance digest to a user.
 * Creates an **info** notification.
 */
export async function notifyWeeklyDigest(
  userId: string,
  data: WeeklyDigestData,
) {
  const trendLabel =
    data.trend === "up" ? "📈" : data.trend === "down" ? "📉" : "➡️";
  return createNotification({
    userId,
    type: "info",
    title: "Weekly Digest",
    message: `${trendLabel} You received ${data.totalImpressions.toLocaleString()} impressions this week.`,
    data,
  });
}

/**
 * Remind a user about an upcoming scheduled post.
 * Creates an **info** notification. Uses SAST (Africa/Johannesburg) for display.
 */
export async function notifyScheduledReminder(
  userId: string,
  data: ScheduledReminderData,
) {
  const formattedTime = new Date(data.scheduledAt).toLocaleString("en-ZA", {
    timeZone: "Africa/Johannesburg",
  });
  return createNotification({
    userId,
    type: "info",
    title: "Scheduled Post Reminder",
    message: `Your post is scheduled to publish at ${formattedTime}.`,
    data,
  });
}

// ---------------------------------------------------------------------------
// Admin / system
// ---------------------------------------------------------------------------

/**
 * Notify an admin about a new user signup.
 * Creates a **system** notification.
 */
export async function notifyAdminSignup(
  adminUserId: string,
  data: AdminSignupData,
) {
  return createNotification({
    userId: adminUserId,
    type: "system",
    title: "New User Signup",
    message: `New user registered: ${data.email}.`,
    data,
  });
}

/**
 * Notify an admin about a subscription tier change.
 * Creates a **system** notification.
 */
export async function notifyAdminSubscriptionChange(
  adminUserId: string,
  data: AdminSubscriptionData,
) {
  return createNotification({
    userId: adminUserId,
    type: "system",
    title: "Subscription Change",
    message: `User subscription ${data.action}: ${data.fromTier} → ${data.toTier}.`,
    data,
  });
}

// ---------------------------------------------------------------------------
// Billing — user-facing
// ---------------------------------------------------------------------------

/**
 * Notify a user that their subscription has been activated.
 * Creates a **success** notification with a welcome message.
 */
export async function notifySubscriptionActivated(
  userId: string,
  data: SubscriptionActivatedData,
) {
  return createNotification({
    userId,
    type: "success",
    title: "Subscription Activated",
    message: `Welcome to the ${data.displayName} plan! You've been allocated ${data.creditAllocation} credits. Lekker — let's get posting!`,
    data,
  });
}

/**
 * Notify a user that their renewal payment succeeded.
 * Creates a **success** notification with credit allocation info.
 */
export async function notifyPaymentSucceeded(
  userId: string,
  data: PaymentSucceededData,
) {
  const periodEnd = new Date(data.periodEnd).toLocaleDateString("en-ZA", {
    timeZone: "Africa/Johannesburg",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return createNotification({
    userId,
    type: "success",
    title: "Payment Successful",
    message: `Your ${data.displayName} subscription has been renewed. ${data.creditAllocation} credits have been added to your account. Next renewal: ${periodEnd}.`,
    data,
  });
}

/**
 * Warn a user that their credits have dropped to 10% or below.
 * Creates a **warning** notification with a top-up suggestion.
 */
export async function notifyBillingCreditsLow(
  userId: string,
  data: BillingCreditsLowData,
) {
  return createNotification({
    userId,
    type: "warning",
    title: "Credits Running Low",
    message: `You have ${data.remaining} of ${data.total} credits remaining (${data.percentage}%). Consider topping up to keep your posts flowing.`,
    data,
  });
}

/**
 * Notify a user that their subscription has been cancelled.
 * Creates an **info** notification with end-of-service date.
 */
export async function notifySubscriptionCanceled(
  userId: string,
  data: SubscriptionCanceledData,
) {
  const endsAt = new Date(data.endsAt).toLocaleDateString("en-ZA", {
    timeZone: "Africa/Johannesburg",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return createNotification({
    userId,
    type: "info",
    title: "Subscription Cancelled",
    message: `Your ${data.displayName} subscription has been cancelled. You'll retain access until ${endsAt}, after which you'll be moved to the Seedling plan.`,
    data,
  });
}

/**
 * Notify a user that their subscription tier has changed.
 * Creates a **success** notification with old→new tier details.
 */
export async function notifyTierChanged(
  userId: string,
  data: TierChangedData,
) {
  const limitLabel =
    data.newSocialAccounts === -1
      ? "unlimited"
      : String(data.newSocialAccounts);
  return createNotification({
    userId,
    type: "success",
    title: "Plan Changed",
    message: `You've moved from ${data.fromDisplayName} to ${data.toDisplayName}. Your new allocation is ${data.newCreditAllocation} credits/month with ${limitLabel} social accounts.`,
    data,
  });
}
