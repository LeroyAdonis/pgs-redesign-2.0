// ---------------------------------------------------------------------------
// Notification service — public API
// ---------------------------------------------------------------------------

// Core CRUD
export {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "./notification-service";

// Trigger helpers
export {
  notifyPostPublished,
  notifyPostFailed,
  notifyLowCredits,
  notifyTokenExpiring,
  notifyWeeklyDigest,
  notifyScheduledReminder,
  notifyAdminSignup,
  notifyAdminSubscriptionChange,
} from "./notification-triggers";

// Email service
export { sendNotificationEmail, emailConfig } from "./email-service";
export type { SendEmailResult } from "./email-service";

// Email templates
export {
  baseTemplate,
  postPublishedEmail,
  postFailedEmail,
  lowCreditsEmail,
  weeklyDigestEmail,
} from "./email-templates";
export type {
  PostPublishedEmailData,
  PostFailedEmailData,
  LowCreditsEmailData,
  WeeklyDigestEmailData,
} from "./email-templates";

// Notification preferences
export {
  getPreferences,
  updatePreferences,
  shouldSendEmail,
  getDefaultPreferences,
} from "./notification-preferences";
export type {
  NotificationPreferences,
  EmailFrequency,
} from "./notification-preferences";

// Types
export type {
  NotificationPayload,
  NotificationType,
  NotificationCreateInput,
  NotificationFilters,
  PostPublishedData,
  PostFailedData,
  LowCreditsData,
  TokenExpiringData,
  WeeklyDigestData,
  ScheduledReminderData,
  AdminSignupData,
  AdminSubscriptionData,
  SystemAlertData,
} from "./types";

export { DEFAULT_LIMIT, DEFAULT_OFFSET } from "./types";
