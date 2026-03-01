/**
 * Shared types for the Posts management page.
 */

export interface PostSchedule {
  id: string;
  scheduledAt: string;
  publishedAt: string | null;
  failedAt: string | null;
  socialAccountId: string;
}

export interface PostWithSchedule {
  id: string;
  content: string;
  platform: string;
  status: string;
  aiGenerated: boolean;
  createdAt: string;
  schedules: PostSchedule[];
}

export interface PostFiltersState {
  platform: string | null;
  status: string | null;
  dateFrom: string | null;
  dateTo: string | null;
}

export type SchedulingMode = "manual" | "autonomous";

export type PostStatus =
  | "draft"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed";

export type PlatformId =
  | "instagram"
  | "facebook"
  | "twitter"
  | "linkedin"
  | "tiktok"
  | "whatsapp"
  | "google_business";

/** Subscription tier that governs feature access */
export type SubscriptionTier = "seedling" | "hustler" | "grower" | "mogul";
