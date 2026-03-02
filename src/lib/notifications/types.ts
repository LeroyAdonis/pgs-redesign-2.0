/**
 * Notification system types
 *
 * Discriminated data payloads for each notification context,
 * input types for creating notifications, and filter/pagination
 * types for querying the notification table.
 */

// ---------------------------------------------------------------------------
// Notification data payloads
// ---------------------------------------------------------------------------

/** Data for a successfully published post */
export interface PostPublishedData {
  postId: string;
  platform: string;
  platformUrl?: string;
}

/** Data for a failed post publish attempt */
export interface PostFailedData {
  postId: string;
  platform: string;
  error: string;
  retryable: boolean;
}

/** Data for a low-credit-balance warning */
export interface LowCreditsData {
  remaining: number;
  total: number;
  percentage: number;
}

/** Data for a social-account token that is about to expire */
export interface TokenExpiringData {
  socialAccountId: string;
  platform: string;
  /** ISO 8601 timestamp */
  expiresAt: string;
}

/** Data for a weekly performance digest */
export interface WeeklyDigestData {
  totalImpressions: number;
  topPostId?: string;
  trend: "up" | "down" | "flat";
}

/** Data for a scheduled-post reminder */
export interface ScheduledReminderData {
  postId: string;
  /** ISO 8601 timestamp */
  scheduledAt: string;
}

/** Data for an admin notification about a new signup */
export interface AdminSignupData {
  newUserId: string;
  email: string;
}

/** Data for an admin notification about a subscription change */
export interface AdminSubscriptionData {
  userId: string;
  fromTier: string;
  toTier: string;
  action: "upgrade" | "downgrade" | "cancel" | "reactivate";
}

/** Data for a system-level alert */
export interface SystemAlertData {
  alertType: string;
  details: string;
}

// ---------------------------------------------------------------------------
// Billing notification payloads
// ---------------------------------------------------------------------------

/** Data for a subscription activation notification */
export interface SubscriptionActivatedData {
  tier: string;
  displayName: string;
  creditAllocation: number;
}

/** Data for a successful renewal payment notification */
export interface PaymentSucceededData {
  tier: string;
  displayName: string;
  creditAllocation: number;
  /** ISO 8601 timestamp */
  periodEnd: string;
}

/** Data for a low credits warning notification */
export interface BillingCreditsLowData {
  remaining: number;
  total: number;
  percentage: number;
}

/** Data for a subscription cancellation notification */
export interface SubscriptionCanceledData {
  tier: string;
  displayName: string;
  /** ISO 8601 timestamp — when access ends */
  endsAt: string;
}

/** Data for a tier change notification */
export interface TierChangedData {
  fromTier: string;
  fromDisplayName: string;
  toTier: string;
  toDisplayName: string;
  newCreditAllocation: number;
  newSocialAccounts: number;
}

/**
 * Union of all typed notification payloads.
 *
 * Each member is assignable to the generic `NotificationData`
 * (`{ [key: string]: unknown }`) defined in the DB schema, so
 * values can be passed directly to Drizzle insert/update calls.
 */
export type NotificationPayload =
  | PostPublishedData
  | PostFailedData
  | LowCreditsData
  | TokenExpiringData
  | WeeklyDigestData
  | ScheduledReminderData
  | AdminSignupData
  | AdminSubscriptionData
  | SystemAlertData
  | SubscriptionActivatedData
  | PaymentSucceededData
  | BillingCreditsLowData
  | SubscriptionCanceledData
  | TierChangedData;

// ---------------------------------------------------------------------------
// Notification type enum (mirrors the DB enum)
// ---------------------------------------------------------------------------

export type NotificationType =
  | "info"
  | "warning"
  | "success"
  | "error"
  | "system";

// ---------------------------------------------------------------------------
// Service input / filter types
// ---------------------------------------------------------------------------

/** Input for creating a notification */
export interface NotificationCreateInput {
  userId: string;
  orgId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationPayload;
}

/** Filters for querying a user's notifications */
export interface NotificationFilters {
  /**
   * Filter by read status:
   *  - `true`  → only read notifications
   *  - `false` → only unread notifications
   *  - `undefined` → all notifications
   */
  read?: boolean;
  /** Max results to return (default: 20) */
  limit?: number;
  /** Number of results to skip (default: 0) */
  offset?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default page size for notification queries */
export const DEFAULT_LIMIT = 20;

/** Default offset for notification queries */
export const DEFAULT_OFFSET = 0;
