/**
 * Inngest functions — credit reset pipeline
 *
 * Background jobs for monthly credit allocation and rollover expiry:
 *
 * - credit/monthly-reset: Cron on 1st of each month at midnight UTC (2am SAST).
 *   Resets credit balances based on subscription tier, handles rollover for
 *   eligible tiers (Grower/Mogul), and creates audit trail transactions.
 *
 * - credit/expire-rollover: Daily cron at 1am UTC (3am SAST).
 *   Expires rollover credits that have passed their rolloverExpiresAt date
 *   and deducts them from the current balance.
 *
 * Edge cases handled:
 * - Canceled subscriptions → skipped entirely
 * - past_due / trialing → still allocated (grace period)
 * - Mid-month subscriptions → skipped if lastResetAt is in the current month
 * - Missing credit records → skipped with warning
 * - Batch processing with per-org error isolation
 */

import { inngest } from "./client";
import { db } from "@/db";
import { credit, creditTransaction, subscription } from "@/db/schema";
import { eq, and, lt, inArray, gt } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { TIER_CONFIGS } from "@/lib/payments/tier-config";
import type { Tier } from "@/lib/payments/tier-config";

// ── Constants ───────────────────────────────────────────────────

/** Process orgs in batches to avoid Inngest step timeouts */
const RESET_BATCH_SIZE = 50;

// ── Helpers ─────────────────────────────────────────────────────

/**
 * Process monthly credit reset for a single organisation.
 * Returns true if reset was applied, false if skipped.
 */
async function processMonthlyReset(
  orgId: string,
  tier: Tier,
): Promise<boolean> {
  const now = new Date();
  const tierConfig = TIER_CONFIGS[tier];

  if (!tierConfig) {
    logger.warn("credit/monthly-reset: unknown tier", { orgId, tier });
    return false;
  }

  // Get current credit record
  const [creditRow] = await db
    .select()
    .from(credit)
    .where(eq(credit.orgId, orgId))
    .limit(1);

  if (!creditRow) {
    logger.warn("credit/monthly-reset: no credit record found", { orgId });
    return false;
  }

  // Guard against double-allocation: skip if lastResetAt is in the current month
  if (creditRow.lastResetAt) {
    const lastReset = creditRow.lastResetAt;
    if (
      lastReset.getUTCFullYear() === now.getUTCFullYear() &&
      lastReset.getUTCMonth() === now.getUTCMonth()
    ) {
      logger.info("credit/monthly-reset: already reset this month, skipping", {
        orgId,
        lastResetAt: lastReset.toISOString(),
      });
      return false;
    }
  }

  const allocation = tierConfig.creditAllocation;
  const allowsRollover = tierConfig.features.creditRollover;

  let newRolloverBalance = 0;
  let rolloverExpiresAt: Date | null = null;
  let expiredRolloverAmount = 0;

  if (allowsRollover) {
    // Check if previous rollover has expired (hasn't been caught by daily check)
    if (
      creditRow.rolloverBalance > 0 &&
      creditRow.rolloverExpiresAt &&
      creditRow.rolloverExpiresAt < now
    ) {
      expiredRolloverAmount = creditRow.rolloverBalance;
    }

    // Calculate new rollover from remaining balance,
    // excluding any expired rollover that hasn't been deducted yet
    const effectiveBalance = creditRow.balance - expiredRolloverAmount;
    const remainingBalance = Math.max(0, effectiveBalance);

    // Cap rollover at monthly allocation
    newRolloverBalance = Math.min(remainingBalance, allocation);

    // Set rollover expiry to 1 month from now
    rolloverExpiresAt = new Date(now);
    rolloverExpiresAt.setUTCMonth(rolloverExpiresAt.getUTCMonth() + 1);
  }

  const newBalance = allocation + newRolloverBalance;

  // Update credit record
  await db
    .update(credit)
    .set({
      balance: newBalance,
      monthlyAllocation: allocation,
      rolloverBalance: newRolloverBalance,
      rolloverExpiresAt,
      lastResetAt: now,
    })
    .where(eq(credit.orgId, orgId));

  // ── Audit trail transactions ──────────────────────────────────

  // Running balance tracks the balance at each point in the reset sequence:
  //   1. Expire old rollover  → balance drops
  //   2. Reset to 0           → implicit (not a transaction)
  //   3. Monthly allocation   → balance = allocation
  //   4. New rollover added   → balance = allocation + rollover

  // 1. Record expired rollover (if any)
  if (expiredRolloverAmount > 0) {
    await db.insert(creditTransaction).values({
      orgId,
      type: "expiry",
      amount: -expiredRolloverAmount,
      runningBalance: creditRow.balance - expiredRolloverAmount,
      description: `Rollover credits expired (${expiredRolloverAmount} credits)`,
    });
  }

  // 2. Record new monthly allocation
  await db.insert(creditTransaction).values({
    orgId,
    type: "allocation",
    amount: allocation,
    runningBalance: allocation,
    description: `Monthly ${tierConfig.displayName} allocation (${allocation} credits)`,
  });

  // 3. Record rollover (if any)
  if (newRolloverBalance > 0) {
    await db.insert(creditTransaction).values({
      orgId,
      type: "rollover",
      amount: newRolloverBalance,
      runningBalance: newBalance,
      description: `Rolled over ${newRolloverBalance} unused credits from previous month`,
    });
  }

  logger.info("credit/monthly-reset: org reset complete", {
    orgId,
    tier,
    previousBalance: creditRow.balance,
    newBalance,
    allocation,
    rolloverBalance: newRolloverBalance,
    expiredRollover: expiredRolloverAmount,
  });

  return true;
}

// ── credit/monthly-reset (cron: 1st of month) ──────────────────

/**
 * Monthly credit reset — runs on the 1st of each month.
 *
 * Queries all active/past_due/trialing subscriptions, resets credit
 * balances to the tier's monthly allocation, and handles rollover
 * for eligible tiers (Grower, Mogul).
 *
 * Processes orgs in batches of 50 with per-org error isolation.
 */
export const creditMonthlyReset = inngest.createFunction(
  {
    id: "credit-monthly-reset",
    retries: 2,
  },
  { cron: "0 0 1 * *" }, // 1st of month, midnight UTC = 2am SAST (UTC+2)
  async ({ step }) => {
    // Step 1: Find all eligible subscriptions (skip canceled)
    const eligibleOrgs = await step.run("find-eligible-orgs", async () => {
      const rows = await db
        .select({
          orgId: subscription.orgId,
          tier: subscription.tier,
        })
        .from(subscription)
        .where(
          inArray(subscription.status, ["active", "past_due", "trialing"]),
        );

      logger.info("credit/monthly-reset: found eligible subscriptions", {
        count: rows.length,
      });

      return rows;
    });

    if (eligibleOrgs.length === 0) return;

    // Step 2: Process in batches for step-timeout safety
    const batchCount = Math.ceil(eligibleOrgs.length / RESET_BATCH_SIZE);

    for (let i = 0; i < batchCount; i++) {
      const batch = eligibleOrgs.slice(
        i * RESET_BATCH_SIZE,
        (i + 1) * RESET_BATCH_SIZE,
      );

      await step.run(`reset-batch-${i}`, async () => {
        let succeeded = 0;
        let skipped = 0;
        let failed = 0;

        for (const org of batch) {
          try {
            const processed = await processMonthlyReset(
              org.orgId,
              org.tier as Tier,
            );
            if (processed) succeeded++;
            else skipped++;
          } catch (error) {
            failed++;
            logger.error("credit/monthly-reset: org reset failed", {
              orgId: org.orgId,
              tier: org.tier,
              error:
                error instanceof Error ? error.message : "Unknown error",
            });
          }
        }

        logger.info("credit/monthly-reset: batch complete", {
          batchIndex: i,
          succeeded,
          skipped,
          failed,
          total: batch.length,
        });
      });
    }
  },
);

// ── credit/expire-rollover (daily cron) ─────────────────────────

/**
 * Daily rollover expiry check.
 *
 * Finds credit records where rolloverExpiresAt < now and
 * rolloverBalance > 0, deducts the rollover from the current
 * balance (floored at 0), and creates an expiry transaction.
 *
 * This acts as a safety net for mid-month rollover expiry —
 * the monthly reset also handles expiry as part of its flow.
 */
export const creditExpireRollover = inngest.createFunction(
  {
    id: "credit-expire-rollover",
    retries: 2,
  },
  { cron: "0 1 * * *" }, // Daily 1am UTC = 3am SAST (UTC+2)
  async ({ step }) => {
    // Step 1: Find all credits with expired rollover
    const expiredCredits = await step.run(
      "find-expired-rollovers",
      async () => {
        const now = new Date();

        const rows = await db
          .select({
            orgId: credit.orgId,
            balance: credit.balance,
            rolloverBalance: credit.rolloverBalance,
          })
          .from(credit)
          .where(
            and(
              lt(credit.rolloverExpiresAt, now),
              gt(credit.rolloverBalance, 0),
            ),
          );

        logger.info("credit/expire-rollover: found expired rollovers", {
          count: rows.length,
        });

        return rows;
      },
    );

    if (expiredCredits.length === 0) return;

    // Step 2: Process each expired rollover
    await step.run("process-expired-rollovers", async () => {
      let succeeded = 0;
      let failed = 0;

      for (const row of expiredCredits) {
        try {
          // Deduct rollover from balance (don't go below 0)
          const deductAmount = Math.min(row.rolloverBalance, row.balance);
          const newBalance = row.balance - deductAmount;

          await db
            .update(credit)
            .set({
              balance: newBalance,
              rolloverBalance: 0,
              rolloverExpiresAt: null,
            })
            .where(eq(credit.orgId, row.orgId));

          // Create expiry transaction
          await db.insert(creditTransaction).values({
            orgId: row.orgId,
            type: "expiry",
            amount: -deductAmount,
            runningBalance: newBalance,
            description: `Rollover credits expired (${deductAmount} credits removed)`,
          });

          succeeded++;

          logger.info("credit/expire-rollover: rollover expired", {
            orgId: row.orgId,
            expiredAmount: deductAmount,
            newBalance,
          });
        } catch (error) {
          failed++;
          logger.error("credit/expire-rollover: expiry failed", {
            orgId: row.orgId,
            error:
              error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      logger.info("credit/expire-rollover: run complete", {
        total: expiredCredits.length,
        succeeded,
        failed,
      });
    });
  },
);
