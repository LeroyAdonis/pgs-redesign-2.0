/**
 * Notification preferences
 *
 * Controls per-user notification delivery settings: in-app visibility,
 * email enablement, email frequency, and muted notification types.
 *
 * Persisted to the `notification_preference` table via Drizzle ORM.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notificationPreference } from "@/db/schema";
import { logger } from "@/lib/logger";
import type { NotificationType } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EmailFrequency = "immediate" | "daily" | "weekly";

export interface NotificationPreferences {
  /** Show notifications in the in-app notification centre */
  inApp: boolean;
  /** Send notification emails */
  emailEnabled: boolean;
  /** How often to batch email notifications */
  emailFrequency: EmailFrequency;
  /** Notification types the user has explicitly silenced */
  mutedTypes: NotificationType[];
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_PREFERENCES: Readonly<NotificationPreferences> = {
  inApp: true,
  emailEnabled: true,
  emailFrequency: "daily",
  mutedTypes: [],
};

/** Return a fresh copy of the default preferences. */
export function getDefaultPreferences(): NotificationPreferences {
  return { ...DEFAULT_PREFERENCES, mutedTypes: [] };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Retrieve a user's notification preferences from the database.
 * Returns defaults when no overrides have been saved.
 */
export async function getPreferences(
  userId: string,
): Promise<NotificationPreferences> {
  const rows = await db
    .select({
      inApp: notificationPreference.inApp,
      emailEnabled: notificationPreference.emailEnabled,
      emailFrequency: notificationPreference.emailFrequency,
      mutedTypes: notificationPreference.mutedTypes,
    })
    .from(notificationPreference)
    .where(eq(notificationPreference.userId, userId))
    .limit(1);

  if (!rows[0]) {
    return getDefaultPreferences();
  }

  const row = rows[0];
  return {
    inApp: row.inApp,
    emailEnabled: row.emailEnabled,
    emailFrequency: row.emailFrequency as EmailFrequency,
    mutedTypes: (row.mutedTypes ?? []) as NotificationType[],
  };
}

/**
 * Merge partial updates into a user's preferences (upsert).
 * Creates an entry with defaults if none exists yet.
 */
export async function updatePreferences(
  userId: string,
  updates: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  const current = await getPreferences(userId);

  const merged: NotificationPreferences = {
    ...current,
    ...updates,
    mutedTypes: updates.mutedTypes
      ? [...updates.mutedTypes]
      : [...current.mutedTypes],
  };

  await db
    .insert(notificationPreference)
    .values({
      userId,
      inApp: merged.inApp,
      emailEnabled: merged.emailEnabled,
      emailFrequency: merged.emailFrequency,
      mutedTypes: merged.mutedTypes,
    })
    .onConflictDoUpdate({
      target: notificationPreference.userId,
      set: {
        inApp: merged.inApp,
        emailEnabled: merged.emailEnabled,
        emailFrequency: merged.emailFrequency,
        mutedTypes: merged.mutedTypes,
        updatedAt: new Date(),
      },
    });

  logger.info("[notifications] Preferences updated", {
    userId,
    emailEnabled: merged.emailEnabled,
    emailFrequency: merged.emailFrequency,
  });

  return { ...merged, mutedTypes: [...merged.mutedTypes] };
}

/**
 * Determine whether an email should be sent for a given notification type.
 *
 * Returns `false` when:
 *  - email is globally disabled for the user, OR
 *  - the notification type is in the user's muted list.
 */
export async function shouldSendEmail(
  userId: string,
  type: NotificationType,
): Promise<boolean> {
  const prefs = await getPreferences(userId);

  if (!prefs.emailEnabled) return false;
  if (prefs.mutedTypes.includes(type)) return false;

  return true;
}
