/**
 * Core scheduling CRUD service
 *
 * All database operations for creating, reading, updating, and deleting
 * post schedules. Uses Drizzle ORM query builder with joins to post
 * and socialAccount tables.
 */

import { db } from "@/db";
import {
  post,
  postSchedule,
  socialAccount,
  organization,
} from "@/db/schema";
import {
  eq,
  and,
  between,
  desc,
  count,
  inArray,
  gte,
  lte,
  sql,
} from "drizzle-orm";
import { logger } from "@/lib/logger";
import type {
  CreateScheduleInput,
  UpdateScheduleInput,
  ScheduleFilters,
  ScheduleWithPost,
  BulkScheduleInput,
  Platform,
  ScheduleStatus,
} from "./types";

// ── Helpers ─────────────────────────────────────────────────────

/** Map a joined DB row to ScheduleWithPost shape */
function mapScheduleRow(row: {
  post_schedule: typeof postSchedule.$inferSelect;
  post: typeof post.$inferSelect;
}): ScheduleWithPost {
  return {
    id: row.post_schedule.id,
    postId: row.post_schedule.postId,
    socialAccountId: row.post_schedule.socialAccountId,
    scheduledAt: row.post_schedule.scheduledAt,
    publishedAt: row.post_schedule.publishedAt,
    failedAt: row.post_schedule.failedAt,
    retryCount: row.post_schedule.retryCount,
    lastError: row.post_schedule.lastError,
    createdAt: row.post_schedule.createdAt,
    post: {
      id: row.post.id,
      orgId: row.post.orgId,
      content: row.post.content,
      contentLanguage: row.post.contentLanguage,
      platform: row.post.platform as Platform,
      status: row.post.status as ScheduleStatus,
      aiGenerated: row.post.aiGenerated,
      createdAt: row.post.createdAt,
    },
  };
}

// ── Single schedule CRUD ────────────────────────────────────────

/**
 * Create a schedule entry and update post status to 'scheduled'.
 */
export async function createSchedule(
  input: CreateScheduleInput,
): Promise<typeof postSchedule.$inferSelect> {
  logger.info("Creating schedule", {
    postId: input.postId,
    scheduledAt: input.scheduledAt.toISOString(),
  });

  const [schedule] = await db
    .insert(postSchedule)
    .values({
      postId: input.postId,
      socialAccountId: input.socialAccountId,
      scheduledAt: input.scheduledAt,
    })
    .returning();

  if (!schedule) {
    throw new Error("Failed to create schedule entry");
  }

  // Update post status to 'scheduled'
  await db
    .update(post)
    .set({ status: "scheduled" })
    .where(eq(post.id, input.postId));

  logger.info("Schedule created", { scheduleId: schedule.id });
  return schedule;
}

/**
 * Update a schedule (reschedule time or change status).
 */
export async function updateSchedule(
  input: UpdateScheduleInput,
): Promise<typeof postSchedule.$inferSelect> {
  const updates: Record<string, unknown> = {};

  if (input.scheduledAt !== undefined) {
    updates.scheduledAt = input.scheduledAt;
  }

  if (input.status !== undefined) {
    // Status changes are tracked on the post, not the schedule itself.
    // The schedule tracks publishedAt/failedAt timestamps.
    if (input.status === "published") {
      updates.publishedAt = new Date();
    } else if (input.status === "failed") {
      updates.failedAt = new Date();
    }
  }

  const [updated] = await db
    .update(postSchedule)
    .set(updates)
    .where(eq(postSchedule.id, input.id))
    .returning();

  if (!updated) {
    throw new Error(`Schedule ${input.id} not found`);
  }

  // If a status was provided, also update the post status
  if (input.status !== undefined) {
    await db
      .update(post)
      .set({ status: input.status })
      .where(eq(post.id, updated.postId));
  }

  logger.info("Schedule updated", { scheduleId: input.id });
  return updated;
}

/**
 * Delete a schedule and revert the post status to 'draft'.
 */
export async function deleteSchedule(id: string): Promise<void> {
  // Fetch the schedule to get postId before deleting
  const [existing] = await db
    .select({ postId: postSchedule.postId })
    .from(postSchedule)
    .where(eq(postSchedule.id, id))
    .limit(1);

  if (!existing) {
    throw new Error(`Schedule ${id} not found`);
  }

  await db.delete(postSchedule).where(eq(postSchedule.id, id));

  // Revert post status to draft
  await db
    .update(post)
    .set({ status: "draft" })
    .where(eq(post.id, existing.postId));

  logger.info("Schedule deleted", { scheduleId: id, postId: existing.postId });
}

// ── List / query schedules ──────────────────────────────────────

/**
 * Get paginated schedules for an org with optional filters.
 */
export async function getSchedulesByOrg(
  filters: ScheduleFilters,
): Promise<{ schedules: ScheduleWithPost[]; total: number }> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const offset = (page - 1) * limit;

  // Build WHERE conditions
  const conditions = [eq(post.orgId, filters.orgId)];

  if (filters.platform) {
    conditions.push(eq(post.platform, filters.platform));
  }
  if (filters.status) {
    conditions.push(eq(post.status, filters.status));
  }
  if (filters.dateFrom && filters.dateTo) {
    conditions.push(
      between(postSchedule.scheduledAt, filters.dateFrom, filters.dateTo),
    );
  } else if (filters.dateFrom) {
    conditions.push(gte(postSchedule.scheduledAt, filters.dateFrom));
  } else if (filters.dateTo) {
    conditions.push(lte(postSchedule.scheduledAt, filters.dateTo));
  }

  const whereClause = and(...conditions);

  // Get total count
  const [countResult] = await db
    .select({ value: count() })
    .from(postSchedule)
    .innerJoin(post, eq(postSchedule.postId, post.id))
    .where(whereClause);

  const total = countResult?.value ?? 0;

  // Get paginated results
  const rows = await db
    .select()
    .from(postSchedule)
    .innerJoin(post, eq(postSchedule.postId, post.id))
    .where(whereClause)
    .orderBy(desc(postSchedule.scheduledAt))
    .limit(limit)
    .offset(offset);

  const schedules = rows.map(mapScheduleRow);

  return { schedules, total };
}

/**
 * Get schedules within a date range for calendar display.
 */
export async function getSchedulesForCalendar(
  orgId: string,
  startDate: Date,
  endDate: Date,
): Promise<ScheduleWithPost[]> {
  const rows = await db
    .select()
    .from(postSchedule)
    .innerJoin(post, eq(postSchedule.postId, post.id))
    .where(
      and(
        eq(post.orgId, orgId),
        between(postSchedule.scheduledAt, startDate, endDate),
      ),
    )
    .orderBy(postSchedule.scheduledAt);

  return rows.map(mapScheduleRow);
}

// ── Bulk operations ─────────────────────────────────────────────

/**
 * Create multiple schedules with interval spacing between each.
 */
export async function bulkCreateSchedules(
  input: BulkScheduleInput,
): Promise<(typeof postSchedule.$inferSelect)[]> {
  const schedules: (typeof postSchedule.$inferSelect)[] = [];

  for (let i = 0; i < input.postIds.length; i++) {
    const scheduledAt = new Date(
      input.startDate.getTime() + i * input.intervalMinutes * 60 * 1000,
    );

    const schedule = await createSchedule({
      postId: input.postIds[i]!,
      socialAccountId: input.socialAccountId,
      scheduledAt,
    });

    schedules.push(schedule);
  }

  logger.info("Bulk schedules created", {
    count: schedules.length,
    socialAccountId: input.socialAccountId,
  });

  return schedules;
}

/**
 * Bulk update status for multiple schedules.
 */
export async function bulkUpdateStatus(
  ids: string[],
  status: ScheduleStatus,
): Promise<void> {
  if (ids.length === 0) return;

  // Get post IDs for the schedules
  const scheduleRows = await db
    .select({ postId: postSchedule.postId })
    .from(postSchedule)
    .where(inArray(postSchedule.id, ids));

  const postIds = scheduleRows.map((r) => r.postId);

  // Update post statuses
  if (postIds.length > 0) {
    await db
      .update(post)
      .set({ status })
      .where(inArray(post.id, postIds));
  }

  // If status is "published" or "failed", update schedule timestamps
  if (status === "published") {
    await db
      .update(postSchedule)
      .set({ publishedAt: new Date() })
      .where(inArray(postSchedule.id, ids));
  } else if (status === "failed") {
    await db
      .update(postSchedule)
      .set({ failedAt: new Date() })
      .where(inArray(postSchedule.id, ids));
  }

  logger.info("Bulk status update", { count: ids.length, status });
}

/**
 * Bulk delete schedules and revert posts to draft.
 */
export async function bulkDeleteSchedules(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  // Get post IDs before deleting
  const scheduleRows = await db
    .select({ postId: postSchedule.postId })
    .from(postSchedule)
    .where(inArray(postSchedule.id, ids));

  const postIds = scheduleRows.map((r) => r.postId);

  // Delete schedules
  await db.delete(postSchedule).where(inArray(postSchedule.id, ids));

  // Revert posts to draft
  if (postIds.length > 0) {
    await db
      .update(post)
      .set({ status: "draft" })
      .where(inArray(post.id, postIds));
  }

  logger.info("Bulk schedules deleted", { count: ids.length });
}

// ── Count ───────────────────────────────────────────────────────

/**
 * Get the count of active schedules for an org (for tier limit checks).
 * Counts schedules where the post status is 'scheduled' or 'publishing'.
 */
export async function getScheduleCount(orgId: string): Promise<number> {
  const [result] = await db
    .select({ value: count() })
    .from(postSchedule)
    .innerJoin(post, eq(postSchedule.postId, post.id))
    .where(
      and(
        eq(post.orgId, orgId),
        inArray(post.status, ["scheduled", "publishing"]),
      ),
    );

  return result?.value ?? 0;
}

/**
 * Get the org's current tier from the organization table.
 */
export async function getOrgTier(
  orgId: string,
): Promise<string> {
  const [org] = await db
    .select({ tier: organization.tier })
    .from(organization)
    .where(eq(organization.id, orgId))
    .limit(1);

  return org?.tier ?? "seedling";
}
