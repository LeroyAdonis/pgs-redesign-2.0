/**
 * Scheduling engine — barrel exports
 *
 * Public API for the scheduling layer. All scheduling operations
 * should be imported from this module.
 */

// ── Types ───────────────────────────────────────────────────────
export type {
  ScheduleStatus,
  SchedulingMode,
  Platform,
  Tier,
  CreateScheduleInput,
  UpdateScheduleInput,
  ScheduleWithPost,
  ScheduleFilters,
  BulkScheduleInput,
  OptimalTimeSlot,
  AutonomousConfig,
  TierSchedulingLimit,
} from "./types";

export { TIER_SCHEDULING_LIMITS } from "./types";

// ── Scheduling CRUD ─────────────────────────────────────────────
export {
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getSchedulesByOrg,
  getSchedulesForCalendar,
  bulkCreateSchedules,
  bulkUpdateStatus,
  bulkDeleteSchedules,
  getScheduleCount,
  getOrgTier,
} from "./scheduling-service";

// ── Optimal times ───────────────────────────────────────────────
export {
  getOptimalTimes,
  suggestNextSlot,
} from "./optimal-times";

// ── Autonomous scheduling ───────────────────────────────────────
export {
  getAutonomousConfig,
  generateWeeklyBatch,
  autoScheduleBatch,
  checkTierLimits,
} from "./autonomous-service";
