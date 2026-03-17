/**
 * Notification service
 *
 * Core CRUD operations for the notification table.
 * All mutations that target a single notification verify ownership
 * to prevent cross-user access.
 */

import { db } from "@/db";
import { notification, type NotificationData } from "@/db/schema";
import { eq, and, isNull, isNotNull, desc, count } from "drizzle-orm";
import { logger } from "@/lib/logger";
import type { NotificationCreateInput, NotificationFilters } from "./types";
import { DEFAULT_LIMIT, DEFAULT_OFFSET } from "./types";

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Insert a new notification and return the created row.
 *
 * @param input - Notification fields (userId, type, title, message, optional data)
 * @returns The newly created notification row
 * @throws Re-throws database errors after logging
 */
export async function createNotification(input: NotificationCreateInput) {
  try {
    const [created] = await db
      .insert(notification)
      .values({
        userId: input.userId,
        orgId: input.orgId ?? null,
        type: input.type,
        title: input.title,
        message: input.message,
        // NotificationPayload members satisfy NotificationData semantically;
        // the assertion bridges TypeScript's strict index-signature check.
        data: (input.data ?? null) as NotificationData | null,
      })
      .returning();

    logger.debug("Notification created", {
      notificationId: created.id,
      userId: input.userId,
      type: input.type,
    });

    return created;
  } catch (error) {
    logger.error("Failed to create notification", {
      userId: input.userId,
      type: input.type,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Mark a single notification as read.
 *
 * Ownership check: the `WHERE` clause includes both `notificationId`
 * and `userId`, so a user cannot mark another user's notification.
 *
 * @returns `{ success: true }` or `{ success: false, error }` if not found / unauthorized
 */
export async function markAsRead(
  notificationId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  const rows = await db
    .update(notification)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notification.id, notificationId),
        eq(notification.userId, userId),
      ),
    )
    .returning({ id: notification.id });

  if (rows.length === 0) {
    logger.warn("markAsRead: not found or unauthorized", {
      notificationId,
      userId,
    });
    return {
      success: false,
      error: "Notification not found or access denied",
    };
  }

  return { success: true };
}

/**
 * Mark every unread notification as read for a given user.
 *
 * @returns The number of notifications that were updated
 */
export async function markAllAsRead(
  userId: string,
): Promise<{ updatedCount: number }> {
  const rows = await db
    .update(notification)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notification.userId, userId),
        isNull(notification.readAt),
      ),
    )
    .returning({ id: notification.id });

  logger.info("Marked all notifications as read", {
    userId,
    count: rows.length,
  });

  return { updatedCount: rows.length };
}

/**
 * Delete a notification.
 *
 * Ownership check: only the notification's owner can delete it.
 *
 * @returns `{ success: true }` or `{ success: false, error }` if not found / unauthorized
 */
export async function deleteNotification(
  notificationId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  const rows = await db
    .delete(notification)
    .where(
      and(
        eq(notification.id, notificationId),
        eq(notification.userId, userId),
      ),
    )
    .returning({ id: notification.id });

  if (rows.length === 0) {
    logger.warn("deleteNotification: not found or unauthorized", {
      notificationId,
      userId,
    });
    return {
      success: false,
      error: "Notification not found or access denied",
    };
  }

  logger.debug("Notification deleted", { notificationId, userId });
  return { success: true };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Get paginated notifications for a user, newest first.
 *
 * @param userId  - The user whose notifications to fetch
 * @param filters - Optional read-status filter and pagination (limit/offset)
 * @returns Array of notification rows
 */
export async function getUserNotifications(
  userId: string,
  filters?: NotificationFilters,
) {
  const limit = filters?.limit ?? DEFAULT_LIMIT;
  const offset = filters?.offset ?? DEFAULT_OFFSET;

  const conditions = [eq(notification.userId, userId)];

  if (filters?.read === true) {
    conditions.push(isNotNull(notification.readAt));
  } else if (filters?.read === false) {
    conditions.push(isNull(notification.readAt));
  }

  return db
    .select()
    .from(notification)
    .where(and(...conditions))
    .orderBy(desc(notification.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Count unread notifications for a user.
 *
 * Uses the `notification_user_unread_idx` index for performance.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const [result] = await db
    .select({ value: count() })
    .from(notification)
    .where(
      and(
        eq(notification.userId, userId),
        isNull(notification.readAt),
      ),
    );

  return result?.value ?? 0;
}
