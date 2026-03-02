/**
 * Client-side notification types
 *
 * These mirror the API response shape. Keeping a separate client type
 * avoids importing Drizzle schema types into client bundles.
 */

import type { NotificationType } from "@/lib/notifications/types";

/** Shape of a notification as returned by GET /api/notifications */
export interface ClientNotification {
  id: string;
  userId: string;
  orgId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

/** Response from GET /api/notifications */
export interface NotificationsResponse {
  notifications: ClientNotification[];
  total: number;
}

/** Response from GET /api/notifications/count */
export interface NotificationCountResponse {
  count: number;
}

/** Response from PATCH /api/notifications/[id]/read */
export interface MarkReadResponse {
  success: boolean;
  error?: string;
}

/** Response from POST /api/notifications/read-all */
export interface MarkAllReadResponse {
  success: boolean;
  count: number;
}

/** Response from DELETE /api/notifications/[id] */
export interface DeleteNotificationResponse {
  success: boolean;
  error?: string;
}
