/**
 * Notification preferences
 *
 * Controls per-user notification delivery settings: in-app visibility,
 * email enablement, email frequency, and muted notification types.
 *
 * TODO: Add a `notification_preferences` table (or jsonb column on the
 * user table) and persist via Drizzle ORM. For now, preferences default
 * in-memory and are stored in a runtime map (lost on restart).
 */

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
// In-memory store (temporary)
// ---------------------------------------------------------------------------

/**
 * Runtime-only preference store.
 * TODO: Replace with DB persistence (Drizzle + notification_preferences table).
 */
const store = new Map<string, NotificationPreferences>();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Retrieve a user's notification preferences.
 * Returns defaults when no overrides have been saved.
 */
export async function getPreferences(
  userId: string,
): Promise<NotificationPreferences> {
  const prefs = store.get(userId);
  if (prefs) {
    return { ...prefs, mutedTypes: [...prefs.mutedTypes] };
  }
  return getDefaultPreferences();
}

/**
 * Merge partial updates into a user's preferences.
 * Creates an entry with defaults if none exists yet.
 */
export async function updatePreferences(
  userId: string,
  updates: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  const current = store.get(userId) ?? getDefaultPreferences();

  const merged: NotificationPreferences = {
    ...current,
    ...updates,
    // Always clone mutedTypes to prevent external mutation
    mutedTypes: updates.mutedTypes
      ? [...updates.mutedTypes]
      : [...current.mutedTypes],
  };

  store.set(userId, merged);

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
