/**
 * Calendar-specific types for the scheduling calendar views.
 */

/** A scheduled post as returned by the schedule API */
export interface CalendarSchedule {
  id: string;
  postId: string;
  content: string;
  platform: string;
  status: string;
  scheduledAt: string;
  socialAccountId: string;
}

/** Available view modes for the calendar */
export type CalendarViewMode = "month" | "week" | "day";

/** Platform color map for visual coding of calendar events */
export const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E4405F",
  facebook: "#1877F2",
  twitter: "#000000",
  x: "#000000",
  linkedin: "#0A66C2",
  tiktok: "#00F2EA",
  whatsapp: "#25D366",
  "google-business": "#4285F4",
};

/** Status color classes for event badges */
export const STATUS_CLASSES: Record<string, string> = {
  draft: "bg-gray-400",
  scheduled: "bg-blue-500",
  publishing: "bg-yellow-500",
  published: "bg-green-500",
  failed: "bg-red-500",
};
