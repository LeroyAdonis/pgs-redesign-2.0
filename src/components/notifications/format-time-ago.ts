/**
 * Relative time formatting for notifications
 *
 * Converts a Date or ISO string into a human-readable relative time:
 *   "just now" → < 1 minute
 *   "Xm ago"  → < 60 minutes
 *   "Xh ago"  → < 24 hours
 *   "Xd ago"  → < 30 days
 *   Date string → older than 30 days
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Format a timestamp as a short relative time string.
 *
 * @param date - Date object or ISO 8601 string
 * @returns Relative time string (e.g. "2m ago", "1h ago", "3d ago")
 */
export function formatTimeAgo(date: Date | string): string {
  const then = typeof date === "string" ? new Date(date) : date;
  const now = Date.now();
  const diff = now - then.getTime();

  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 30 * DAY) return `${Math.floor(diff / DAY)}d ago`;

  // Older than 30 days — show a locale date (South African format)
  return then.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Johannesburg",
  });
}
