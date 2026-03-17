/**
 * Inngest webhook receiver — /api/inngest
 *
 * Exposes all Inngest functions to the Inngest Dev Server and Cloud.
 * The `serve` handler automatically handles:
 *   - GET:  Introspection (returns registered functions)
 *   - POST: Event receipt + function invocation
 *   - PUT:  Registration with Inngest Cloud
 *
 * @see https://www.inngest.com/docs/reference/serve
 */

import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import {
  publishPost,
  retryPost,
  checkScheduledPosts,
} from "@/inngest/functions";
import {
  fetchInitialMetrics,
  refreshRecentMetrics,
  refreshDailyMetrics,
  weeklyAnalyticsDigest,
} from "@/inngest/analytics-functions";
import {
  notifyOnPostPublished,
  notifyOnPostFailed,
  notifyOnLowCredits,
  checkExpiringTokens,
  notifyOnSignup,
  notifyOnSubscriptionChange,
} from "@/inngest/notification-functions";
import {
  notifyOnSubscriptionActivated,
  notifyOnPaymentSucceeded,
  notifyOnBillingCreditsLow,
  notifyOnSubscriptionCanceled,
  notifyOnTierChanged,
} from "@/inngest/billing-notification-functions";
import {
  creditMonthlyReset,
  creditExpireRollover,
} from "@/inngest/credit-functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // Post publishing pipeline
    publishPost,
    retryPost,
    checkScheduledPosts,
    // Analytics pipeline
    fetchInitialMetrics,
    refreshRecentMetrics,
    refreshDailyMetrics,
    weeklyAnalyticsDigest,
    // Notification handlers
    notifyOnPostPublished,
    notifyOnPostFailed,
    notifyOnLowCredits,
    checkExpiringTokens,
    notifyOnSignup,
    notifyOnSubscriptionChange,
    // Billing notification handlers
    notifyOnSubscriptionActivated,
    notifyOnPaymentSucceeded,
    notifyOnBillingCreditsLow,
    notifyOnSubscriptionCanceled,
    notifyOnTierChanged,
    // Credit reset pipeline
    creditMonthlyReset,
    creditExpireRollover,
  ],
});
