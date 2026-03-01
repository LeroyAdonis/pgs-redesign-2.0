/**
 * Inngest event functions — post publishing pipeline
 *
 * Defines background job handlers for:
 * - Publishing scheduled posts when their time arrives
 * - Retrying failed publications (max 3 retries)
 * - Periodic cron to check for due posts
 */

import { inngest } from "./client";
import { db } from "@/db";
import { postSchedule, post } from "@/db/schema";
import { eq, and, lte, inArray } from "drizzle-orm";
import { logger } from "@/lib/logger";

// ── Event type declarations ─────────────────────────────────────

type PostPublishEvent = {
  name: "post/publish";
  data: {
    scheduleId: string;
    postId: string;
  };
};

type PostRetryEvent = {
  name: "post/retry";
  data: {
    scheduleId: string;
    postId: string;
    attempt: number;
  };
};

type ScheduleCheckEvent = {
  name: "schedule/check";
  data: Record<string, never>;
};

// ── post/publish ────────────────────────────────────────────────

/**
 * Triggered when a scheduled post's time arrives.
 * Updates status to 'publishing', attempts to publish, then marks
 * as 'published' or 'failed'.
 */
export const publishPost = inngest.createFunction(
  {
    id: "post-publish",
    retries: 0, // We handle retries ourselves via post/retry
  },
  { event: "post/publish" },
  async ({ event, step }) => {
    const { scheduleId, postId } = event.data as PostPublishEvent["data"];

    // Step 1: Mark as publishing
    await step.run("mark-publishing", async () => {
      await db
        .update(post)
        .set({ status: "publishing" })
        .where(eq(post.id, postId));

      logger.info("Post marked as publishing", { postId, scheduleId });
    });

    // Step 2: Attempt to publish
    // In production, this would call platform-specific APIs
    // (Instagram Graph API, Twitter API, etc.)
    const publishResult = await step.run("publish-to-platform", async () => {
      try {
        // TODO: Call platform publishing APIs via social account service
        // For now, this is a placeholder that simulates successful publishing
        logger.info("Publishing post to platform (placeholder)", {
          postId,
          scheduleId,
        });

        return { success: true } as const;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown publishing error";
        logger.error("Failed to publish post", {
          postId,
          scheduleId,
          error: errorMessage,
        });
        return { success: false, error: errorMessage } as const;
      }
    });

    // Step 3: Update status based on result
    await step.run("update-status", async () => {
      if (publishResult.success) {
        await db
          .update(postSchedule)
          .set({ publishedAt: new Date() })
          .where(eq(postSchedule.id, scheduleId));

        await db
          .update(post)
          .set({ status: "published" })
          .where(eq(post.id, postId));

        logger.info("Post published successfully", { postId, scheduleId });
      } else {
        const [schedule] = await db
          .select({ retryCount: postSchedule.retryCount })
          .from(postSchedule)
          .where(eq(postSchedule.id, scheduleId))
          .limit(1);

        const retryCount = (schedule?.retryCount ?? 0) + 1;

        await db
          .update(postSchedule)
          .set({
            failedAt: new Date(),
            retryCount,
            lastError: publishResult.error,
          })
          .where(eq(postSchedule.id, scheduleId));

        if (retryCount < 3) {
          // Send retry event
          await inngest.send({
            name: "post/retry",
            data: {
              scheduleId,
              postId,
              attempt: retryCount,
            },
          });

          logger.warn("Post publishing failed, retry queued", {
            postId,
            scheduleId,
            attempt: retryCount,
          });
        } else {
          // Max retries reached — mark as failed
          await db
            .update(post)
            .set({ status: "failed" })
            .where(eq(post.id, postId));

          logger.error("Post publishing failed after max retries", {
            postId,
            scheduleId,
            retryCount,
          });
        }
      }
    });
  },
);

// ── post/retry ──────────────────────────────────────────────────

/**
 * Retry a failed publication. Delays increase with each attempt
 * (exponential backoff: 5min, 15min, 45min).
 */
export const retryPost = inngest.createFunction(
  {
    id: "post-retry",
    retries: 0,
  },
  { event: "post/retry" },
  async ({ event, step }) => {
    const { scheduleId, postId, attempt } =
      event.data as PostRetryEvent["data"];

    // Exponential backoff: 5min * 3^(attempt-1)
    const delayMinutes = 5 * Math.pow(3, attempt - 1);

    await step.sleep("retry-delay", `${delayMinutes}m`);

    // Re-trigger the publish flow
    await step.run("retry-publish", async () => {
      await inngest.send({
        name: "post/publish",
        data: { scheduleId, postId },
      });

      logger.info("Retry publish triggered", {
        postId,
        scheduleId,
        attempt,
        delayMinutes,
      });
    });
  },
);

// ── schedule/check (cron) ───────────────────────────────────────

/**
 * Periodic check for posts that are due to be published.
 * Runs every 5 minutes to find scheduled posts with scheduledAt <= now.
 */
export const checkScheduledPosts = inngest.createFunction(
  {
    id: "schedule-check",
    retries: 1,
  },
  { cron: "*/5 * * * *" },
  async ({ step }) => {
    // Find all due schedules
    const dueSchedules = await step.run("find-due-posts", async () => {
      const now = new Date();

      const due = await db
        .select({
          scheduleId: postSchedule.id,
          postId: postSchedule.postId,
        })
        .from(postSchedule)
        .innerJoin(post, eq(postSchedule.postId, post.id))
        .where(
          and(
            lte(postSchedule.scheduledAt, now),
            inArray(post.status, ["scheduled"]),
            // Not already published or failed
            eq(postSchedule.publishedAt, null as unknown as Date),
          ),
        );

      logger.info("Schedule check found due posts", { count: due.length });
      return due;
    });

    // Send publish events for each due post
    if (dueSchedules.length > 0) {
      await step.run("dispatch-publish-events", async () => {
        const events = dueSchedules.map((s) => ({
          name: "post/publish" as const,
          data: {
            scheduleId: s.scheduleId,
            postId: s.postId,
          },
        }));

        await inngest.send(events);

        logger.info("Dispatched publish events", {
          count: events.length,
        });
      });
    }
  },
);
