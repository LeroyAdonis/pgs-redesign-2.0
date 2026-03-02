/**
 * Inngest event functions — post publishing pipeline
 *
 * Defines background job handlers for:
 * - Publishing scheduled posts when their time arrives
 * - Retrying failed publications (max 3 retries)
 * - Periodic cron to check for due posts
 *
 * Publishing flow:
 *   1. Mark post as "publishing"
 *   2. Look up social account + decrypt access token
 *   3. Fetch post content and media
 *   4. Call platform publisher adapter
 *   5. Deduct credit on success
 *   6. Update status (published / retry / failed)
 */

import { inngest } from "./client";
import { db } from "@/db";
import {
  postSchedule,
  post,
  socialAccount,
  postMedia,
  credit,
} from "@/db/schema";
import { eq, and, lte, inArray } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { decrypt } from "@/lib/crypto";
import { getPublisher } from "@/lib/publishers";
import { deductCredit } from "@/lib/credits";
import { LOW_BALANCE_THRESHOLD } from "@/lib/credits";
import type { PublishResult } from "@/lib/publishers/types";
import type { Platform } from "@/lib/social/types";

// ── Event type declarations ─────────────────────────────────────

type PostPublishEvent = {
  name: "post/publish";
  data: {
    scheduleId: string;
    postId: string;
    orgId: string;
  };
};

type PostRetryEvent = {
  name: "post/retry";
  data: {
    scheduleId: string;
    postId: string;
    orgId: string;
    attempt: number;
  };
};

type ScheduleCheckEvent = {
  name: "schedule/check";
  data: Record<string, never>;
};

// Suppress lint — ScheduleCheckEvent used for documentation only
void (undefined as unknown as ScheduleCheckEvent);

// ── post/publish ────────────────────────────────────────────────

/**
 * Triggered when a scheduled post's time arrives.
 * Updates status to 'publishing', publishes via platform adapter,
 * deducts credit on success, and handles retry/failure logic.
 */
export const publishPost = inngest.createFunction(
  {
    id: "post-publish",
    retries: 0, // We handle retries ourselves via post/retry
  },
  { event: "post/publish" },
  async ({ event, step }) => {
    const { scheduleId, postId, orgId } =
      event.data as PostPublishEvent["data"];

    // Step 1: Mark as publishing
    await step.run("mark-publishing", async () => {
      await db
        .update(post)
        .set({ status: "publishing" })
        .where(eq(post.id, postId));

      logger.info("Post marked as publishing", { postId, scheduleId });
    });

    // Step 2: Publish to the platform via the publisher adapter
    const publishResult = await step.run(
      "publish-to-platform",
      async (): Promise<PublishResult> => {
        try {
          // 2a: Look up the schedule → social account
          const [schedule] = await db
            .select({
              socialAccountId: postSchedule.socialAccountId,
            })
            .from(postSchedule)
            .where(eq(postSchedule.id, scheduleId))
            .limit(1);

          if (!schedule) {
            return {
              success: false,
              error: `Schedule ${scheduleId} not found`,
              retryable: false,
            };
          }

          // 2b: Get the social account (platform + encrypted token)
          const [account] = await db
            .select({
              platform: socialAccount.platform,
              accessTokenEncrypted: socialAccount.accessTokenEncrypted,
              isActive: socialAccount.isActive,
            })
            .from(socialAccount)
            .where(eq(socialAccount.id, schedule.socialAccountId))
            .limit(1);

          if (!account) {
            return {
              success: false,
              error: `Social account ${schedule.socialAccountId} not found`,
              retryable: false,
            };
          }

          if (!account.isActive) {
            return {
              success: false,
              error: "Social account is disconnected",
              retryable: false,
            };
          }

          if (!account.accessTokenEncrypted) {
            return {
              success: false,
              error: "No access token stored for social account",
              retryable: false,
            };
          }

          // 2c: Decrypt the access token
          const accessToken = decrypt(account.accessTokenEncrypted);

          // 2d: Get post content
          const [postData] = await db
            .select({ content: post.content })
            .from(post)
            .where(eq(post.id, postId))
            .limit(1);

          if (!postData) {
            return {
              success: false,
              error: `Post ${postId} not found`,
              retryable: false,
            };
          }

          // 2e: Get post media attachments
          const media = await db
            .select({
              url: postMedia.url,
              mediaType: postMedia.mediaType,
              altText: postMedia.altText,
            })
            .from(postMedia)
            .where(eq(postMedia.postId, postId));

          // 2f: Call the platform publisher
          const platform = account.platform as Platform;
          const publisher = getPublisher(platform);

          const result = await publisher.publish({
            postId,
            content: postData.content,
            platform,
            accessToken,
            media: media.map((m) => ({
              url: m.url,
              type: m.mediaType as "image" | "video" | "gif",
              altText: m.altText ?? undefined,
            })),
          });

          logger.info("Platform publish completed", {
            postId,
            scheduleId,
            platform,
            success: result.success,
            platformPostId: result.platformPostId,
          });

          return result;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Unknown publishing error";
          logger.error("Failed to publish post", {
            postId,
            scheduleId,
            error: errorMessage,
          });
          return {
            success: false,
            error: errorMessage,
            retryable: true,
          };
        }
      },
    );

    // Step 3: On success, deduct credits and check for low balance
    if (publishResult.success) {
      await step.run("deduct-credit", async () => {
        try {
          const result = await deductCredit(orgId, postId);
          logger.info("Credit deducted for published post", {
            postId,
            orgId,
            newBalance: result.newBalance,
          });

          // Check if remaining balance is below the low-balance threshold
          if (result.success) {
            const [creditRow] = await db
              .select({ monthlyAllocation: credit.monthlyAllocation })
              .from(credit)
              .where(eq(credit.orgId, orgId))
              .limit(1);

            if (creditRow && creditRow.monthlyAllocation > 0) {
              const isLow =
                result.newBalance <=
                creditRow.monthlyAllocation * LOW_BALANCE_THRESHOLD;

              if (isLow) {
                // Look up post creator to notify them
                const [postRecord] = await db
                  .select({ createdById: post.createdById })
                  .from(post)
                  .where(eq(post.id, postId))
                  .limit(1);

                if (postRecord) {
                  await inngest.send({
                    name: "notification/low-credits",
                    data: {
                      userId: postRecord.createdById,
                      remaining: result.newBalance,
                      total: creditRow.monthlyAllocation,
                    },
                  });

                  logger.info("Low credits event sent", {
                    orgId,
                    remaining: result.newBalance,
                    total: creditRow.monthlyAllocation,
                  });
                }
              }
            }
          }
        } catch (error) {
          // Credit deduction failure should NOT roll back a successful publish.
          // Log it and let billing reconciliation handle it.
          logger.error("Failed to deduct credit after publish", {
            postId,
            orgId,
            error:
              error instanceof Error ? error.message : "Unknown error",
          });
        }
      });
    }

    // Step 4: Update status based on result
    await step.run("update-status", async () => {
      if (publishResult.success) {
        await db
          .update(postSchedule)
          .set({
            publishedAt: new Date(),
            platformPostId: publishResult.platformPostId ?? null,
          })
          .where(eq(postSchedule.id, scheduleId));

        await db
          .update(post)
          .set({ status: "published" })
          .where(eq(post.id, postId));

        logger.info("Post published successfully", {
          postId,
          scheduleId,
          platformPostId: publishResult.platformPostId,
        });
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

        if (retryCount < 3 && publishResult.retryable) {
          // Send retry event
          await inngest.send({
            name: "post/retry",
            data: {
              scheduleId,
              postId,
              orgId,
              attempt: retryCount,
            },
          });

          logger.warn("Post publishing failed, retry queued", {
            postId,
            scheduleId,
            attempt: retryCount,
            error: publishResult.error,
          });
        } else {
          // Max retries reached or non-retryable — mark as failed
          await db
            .update(post)
            .set({ status: "failed" })
            .where(eq(post.id, postId));

          logger.error("Post publishing failed permanently", {
            postId,
            scheduleId,
            retryCount,
            retryable: publishResult.retryable,
            error: publishResult.error,
          });
        }
      }
    });

    // Step 5: Trigger analytics fetch after successful publish
    if (publishResult.success) {
      await step.run("trigger-analytics", async () => {
        await inngest.send({
          name: "analytics/fetch-initial",
          data: { postScheduleId: scheduleId },
        });

        logger.info("Analytics fetch-initial event sent", {
          postId,
          scheduleId,
        });
      });
    }

    // Step 6: Send notification events
    await step.run("send-notifications", async () => {
      // Look up the post creator and platform for notification context
      const [postRecord] = await db
        .select({
          createdById: post.createdById,
          platform: post.platform,
        })
        .from(post)
        .where(eq(post.id, postId))
        .limit(1);

      if (!postRecord) return;

      if (publishResult.success) {
        await inngest.send({
          name: "notification/post-published",
          data: {
            userId: postRecord.createdById,
            postId,
            platform: postRecord.platform,
            platformUrl: publishResult.platformUrl,
          },
        });
      } else {
        // Only notify on final failure (non-retryable or max retries reached)
        const [schedule] = await db
          .select({ retryCount: postSchedule.retryCount })
          .from(postSchedule)
          .where(eq(postSchedule.id, scheduleId))
          .limit(1);

        const retryCount = schedule?.retryCount ?? 0;
        const isFinalFailure =
          !publishResult.retryable || retryCount >= 3;

        if (isFinalFailure) {
          await inngest.send({
            name: "notification/post-failed",
            data: {
              userId: postRecord.createdById,
              postId,
              platform: postRecord.platform,
              error: publishResult.error ?? "Unknown error",
              retryable: false,
            },
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
    const { scheduleId, postId, orgId, attempt } =
      event.data as PostRetryEvent["data"];

    // Exponential backoff: 5min * 3^(attempt-1)
    const delayMinutes = 5 * Math.pow(3, attempt - 1);

    await step.sleep("retry-delay", `${delayMinutes}m`);

    // Re-trigger the publish flow
    await step.run("retry-publish", async () => {
      await inngest.send({
        name: "post/publish",
        data: { scheduleId, postId, orgId },
      });

      logger.info("Retry publish triggered", {
        postId,
        scheduleId,
        orgId,
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
    // Find all due schedules (includes orgId from the post table)
    const dueSchedules = await step.run("find-due-posts", async () => {
      const now = new Date();

      const due = await db
        .select({
          scheduleId: postSchedule.id,
          postId: postSchedule.postId,
          orgId: post.orgId,
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
            orgId: s.orgId,
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
