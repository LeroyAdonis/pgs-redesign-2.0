/**
 * Credit deduction service
 *
 * Core operations: check balance, deduct credits atomically,
 * add credits, and retrieve transaction history.
 *
 * Atomicity note: the Neon HTTP driver batches transactions rather
 * than running them interactively, so a read-then-write inside
 * `db.transaction()` is unreliable. Instead we use an atomic
 * `UPDATE … SET balance = balance - ? WHERE balance >= ?` pattern
 * to guarantee no overdraft in a single SQL statement.
 */

import { db } from "@/db";
import { credit, creditTransaction } from "@/db/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { inngest } from "@/inngest/client";
import type {
  CreditBalance,
  CreditDeductionResult,
  TransactionHistoryItem,
} from "./types";
import { LOW_BALANCE_THRESHOLD } from "./types";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Get the current credit balance for an organisation, including
 * usage percentage and a low-balance flag for UI warnings.
 */
export async function getBalance(orgId: string): Promise<CreditBalance> {
  const rows = await db
    .select()
    .from(credit)
    .where(eq(credit.orgId, orgId))
    .limit(1);

  if (rows.length === 0) {
    return {
      balance: 0,
      monthlyAllocation: 0,
      rolloverBalance: 0,
      rolloverExpiresAt: null,
      usagePercentage: 0,
      isLowBalance: true,
    };
  }

  const row = rows[0];
  const totalAvailable = row.monthlyAllocation + row.rolloverBalance;
  const usagePercentage =
    totalAvailable > 0
      ? ((totalAvailable - row.balance) / totalAvailable) * 100
      : 0;

  const isLowBalance =
    row.monthlyAllocation > 0
      ? row.balance <= row.monthlyAllocation * LOW_BALANCE_THRESHOLD
      : row.balance === 0;

  return {
    balance: row.balance,
    monthlyAllocation: row.monthlyAllocation,
    rolloverBalance: row.rolloverBalance,
    rolloverExpiresAt: row.rolloverExpiresAt,
    usagePercentage: Math.round(usagePercentage * 100) / 100,
    isLowBalance,
  };
}

/**
 * Quick boolean check: does the org have at least `amount` credits?
 */
export async function hasEnoughCredits(
  orgId: string,
  amount = 1,
): Promise<boolean> {
  const rows = await db
    .select({ balance: credit.balance })
    .from(credit)
    .where(eq(credit.orgId, orgId))
    .limit(1);

  if (rows.length === 0) return false;
  return rows[0].balance >= amount;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Atomically deduct credits for a published post.
 *
 * Uses a single UPDATE with a `WHERE balance >= amount` guard
 * to prevent overdrafts without interactive transactions.
 */
export async function deductCredit(
  orgId: string,
  postId: string,
  amount = 1,
): Promise<CreditDeductionResult> {
  const updated = await db
    .update(credit)
    .set({ balance: sql`${credit.balance} - ${amount}` })
    .where(and(eq(credit.orgId, orgId), gte(credit.balance, amount)))
    .returning({ newBalance: credit.balance });

  if (updated.length === 0) {
    logger.warn("Credit deduction failed — insufficient balance", {
      orgId,
      amount,
    });
    return { success: false, newBalance: 0, error: "Insufficient credits" };
  }

  const { newBalance } = updated[0];

  await db.insert(creditTransaction).values({
    orgId,
    type: "deduction",
    amount: -amount,
    runningBalance: newBalance,
    description: `Credit deduction for post ${postId}`,
    postId,
  });

  logger.info("Credit deducted", { orgId, amount, newBalance });

  // Check if remaining balance has dropped to the low-balance threshold
  const [creditRow] = await db
    .select({ monthlyAllocation: credit.monthlyAllocation })
    .from(credit)
    .where(eq(credit.orgId, orgId))
    .limit(1);

  if (
    creditRow &&
    creditRow.monthlyAllocation > 0 &&
    newBalance <= creditRow.monthlyAllocation * LOW_BALANCE_THRESHOLD
  ) {
    await inngest.send({
      name: "billing/credits.low",
      data: {
        orgId,
        userId: "", // Resolved by the Inngest handler via org owner lookup
        remaining: newBalance,
        total: creditRow.monthlyAllocation,
      },
    });

    logger.info("Billing credits low event sent", {
      orgId,
      remaining: newBalance,
      total: creditRow.monthlyAllocation,
    });
  }

  return { success: true, newBalance };
}

/**
 * Check whether a credit deduction already exists for a given post.
 *
 * Used to prevent double-deduction on retries: if the first attempt
 * succeeded but later steps failed, the retry should skip deduction.
 */
export async function hasDeductionForPost(postId: string): Promise<boolean> {
  const rows = await db
    .select({ id: creditTransaction.id })
    .from(creditTransaction)
    .where(
      and(
        eq(creditTransaction.postId, postId),
        eq(creditTransaction.type, "deduction"),
      ),
    )
    .limit(1);

  return rows.length > 0;
}

/**
 * Paginated transaction history for an organisation,
 * most-recent first.
 */
export async function getTransactionHistory(
  orgId: string,
  options?: { limit?: number; offset?: number },
): Promise<TransactionHistoryItem[]> {
  const limit = Math.min(options?.limit ?? 20, 100);
  const offset = options?.offset ?? 0;

  const rows = await db
    .select()
    .from(creditTransaction)
    .where(eq(creditTransaction.orgId, orgId))
    .orderBy(desc(creditTransaction.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    amount: row.amount,
    runningBalance: row.runningBalance,
    description: row.description,
    postId: row.postId,
    createdAt: row.createdAt,
  }));
}

/**
 * Add credits (monthly allocation, purchase, or bonus).
 */
export async function addCredits(
  orgId: string,
  amount: number,
  type: "allocation" | "purchase" | "bonus",
  description: string,
): Promise<CreditDeductionResult> {
  const updated = await db
    .update(credit)
    .set({ balance: sql`${credit.balance} + ${amount}` })
    .where(eq(credit.orgId, orgId))
    .returning({ newBalance: credit.balance });

  if (updated.length === 0) {
    logger.warn("addCredits failed — org credit record not found", { orgId });
    return {
      success: false,
      newBalance: 0,
      error: "Organization credit record not found",
    };
  }

  const { newBalance } = updated[0];

  await db.insert(creditTransaction).values({
    orgId,
    type,
    amount,
    runningBalance: newBalance,
    description,
  });

  logger.info("Credits added", { orgId, type, amount, newBalance });
  return { success: true, newBalance };
}
