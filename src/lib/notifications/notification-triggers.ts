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
