/**
 * Scheduling engine — domain types
 *
 * Shared types for the post scheduling system including tier limits,
 * schedule CRUD, optimal time slots, and autonomous scheduling config.
 */

// ── Status & mode enums ─────────────────────────────────────────

/** Matches postStatusEnum in schema */
export type ScheduleStatus =
  | "draft"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed";

/** How posts are scheduled: manually by user or autonomously by AI */
export type SchedulingMode = "manual" | "autonomous";

/** Supported social platforms (mirrors platformEnum in schema) */
export type Platform =
  | "instagram"
  | "facebook"
  | "twitter"
  | "linkedin"
  | "tiktok"
  | "whatsapp"
  | "google_business";

/** Subscription tier (mirrors tierEnum in schema) */
export type Tier = "seedling" | "hustler" | "grower" | "mogul";

// ── CRUD input/output types ─────────────────────────────────────

/** Input for creating a new schedule entry */
export interface CreateScheduleInput {
  postId: string;
  socialAccountId: string;
  scheduledAt: Date;
}

/** Input for updating an existing schedule */
export interface UpdateScheduleInput {
  id: string;
  scheduledAt?: Date;
  status?: ScheduleStatus;
}

/** Schedule joined with post data for display */
export interface ScheduleWithPost {
  id: string;
  postId: string;
  socialAccountId: string;
  scheduledAt: Date;
  publishedAt: Date | null;
  failedAt: Date | null;
  retryCount: number;
  lastError: string | null;
  createdAt: Date;
  post: {
    id: string;
    orgId: string;
    content: string;
    contentLanguage: string;
    platform: Platform;
    status: ScheduleStatus;
    aiGenerated: boolean;
    createdAt: Date;
  };
}

/** Filters for listing schedules */
export interface ScheduleFilters {
  orgId: string;
  platform?: Platform;
  status?: ScheduleStatus;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

// ── Bulk operations ─────────────────────────────────────────────

/** Input for bulk scheduling posts with interval spacing */
export interface BulkScheduleInput {
  postIds: string[];
  socialAccountId: string;
  startDate: Date;
  intervalMinutes: number;
}

// ── Optimal time suggestions ────────────────────────────────────

/** A suggested optimal time slot based on analytics data */
export interface OptimalTimeSlot {
  dayOfWeek: number; // 0=Sun, 6=Sat
  hour: number; // 0–23
  engagementScore: number; // 0–1
  platform: Platform;
}

// ── Autonomous scheduling ───────────────────────────────────────

/** Configuration for autonomous post scheduling */
export interface AutonomousConfig {
  orgId: string;
  mode: SchedulingMode;
  platforms: Platform[];
  frequency: number; // posts per week
  timezone: string;
}

// ── Tier-based scheduling limits ────────────────────────────────

/** What each tier allows for scheduling features */
export interface TierSchedulingLimit {
  maxScheduledPosts: number; // -1 = unlimited
  canUseAutonomous: boolean;
  canUseBulk: boolean;
  canUseOptimalTimes: boolean;
}

/** Tier limits mapped by subscription tier */
export const TIER_SCHEDULING_LIMITS: Record<Tier, TierSchedulingLimit> = {
  seedling: {
    maxScheduledPosts: 10,
    canUseAutonomous: false,
    canUseBulk: false,
    canUseOptimalTimes: false,
  },
  hustler: {
    maxScheduledPosts: 50,
    canUseAutonomous: false,
    canUseBulk: true,
    canUseOptimalTimes: true,
  },
  grower: {
    maxScheduledPosts: 200,
    canUseAutonomous: true,
    canUseBulk: true,
    canUseOptimalTimes: true,
  },
  mogul: {
    maxScheduledPosts: -1,
    canUseAutonomous: true,
    canUseBulk: true,
    canUseOptimalTimes: true,
  },
};
