/**
 * Type definitions for admin system health monitoring
 *
 * Shared between the API route (server) and client components.
 * Defines the shape of health data for platforms, rate limits,
 * errors, and uptime tracking.
 */

export type HealthStatus = "healthy" | "degraded" | "down";

export type Platform =
  | "instagram"
  | "facebook"
  | "twitter"
  | "linkedin"
  | "tiktok";

export type ErrorSeverity = "info" | "warning" | "error" | "critical";

/** Health status for a single platform API */
export interface PlatformHealth {
  platform: Platform;
  status: HealthStatus;
  responseTimeMs: number;
  lastChecked: string; // ISO timestamp
  message?: string;
}

/** Rate limit usage for a single platform */
export interface RateLimitInfo {
  platform: Platform;
  endpoint: string;
  used: number;
  limit: number;
  resetsAt: string; // ISO timestamp
}

/** A single error log entry */
export interface ErrorEntry {
  id: string;
  timestamp: string; // ISO timestamp
  source: string;
  message: string;
  severity: ErrorSeverity;
  stackTrace?: string;
}

/** Uptime record for a single service */
export interface UptimeRecord {
  service: string;
  uptimePercent: number;
  currentStreakDays: number;
  /** Array of 90 booleans: true = up, false = down, index 0 = 90 days ago */
  dailyStatus: boolean[];
}

/** Full system health response from /api/admin/system */
export interface SystemHealthData {
  overallStatus: HealthStatus;
  platforms: PlatformHealth[];
  rateLimits: RateLimitInfo[];
  errors: ErrorEntry[];
  uptime: UptimeRecord[];
  generatedAt: string; // ISO timestamp
}
