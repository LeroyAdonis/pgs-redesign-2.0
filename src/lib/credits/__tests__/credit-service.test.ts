/**
 * Tests for the credit deduction service
 *
 * Mocks the Drizzle `db` object and validates business logic:
 * balance queries, deductions, additions, and history retrieval.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import {
  getBalance,
  hasEnoughCredits,
  deductCredit,
  getTransactionHistory,
  addCredits,
} from "../credit-service";

// ---------------------------------------------------------------------------
// DB mock
// ---------------------------------------------------------------------------

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// We must import *after* vi.mock so the mocked module is resolved.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let db: { select: Mock; update: Mock; insert: Mock };

beforeEach(async () => {
  vi.clearAllMocks();
  // Re-import so each test gets fresh mocks
  const dbMod = await import("@/db");
  db = dbMod.db as unknown as typeof db;
});

// ---------------------------------------------------------------------------
// Helpers — create fluent chain mocks that mirror Drizzle's builder API
// ---------------------------------------------------------------------------

/** Chain for db.select().from().where().limit().offset().orderBy() */
function selectChain<T>(result: T[]) {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.from = vi.fn(self);
  chain.where = vi.fn(self);
  chain.limit = vi.fn(self);
  chain.offset = vi.fn(self);
  chain.orderBy = vi.fn(self);
  // Drizzle chains are thenable — awaiting resolves to the result array
  chain.then = (resolve: (v: T[]) => void) => Promise.resolve(result).then(resolve);
  return chain;
}

/** Chain for db.update().set().where().returning() */
function updateChain<T>(result: T[]) {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.set = vi.fn(self);
  chain.where = vi.fn(self);
  chain.returning = vi.fn(() => Promise.resolve(result));
  chain.then = (resolve: (v: T[]) => void) => Promise.resolve(result).then(resolve);
  return chain;
}

/** Chain for db.insert().values() */
function insertChain() {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.values = vi.fn(self);
  chain.returning = vi.fn(() => Promise.resolve([]));
  chain.then = (resolve: (v: unknown[]) => void) => Promise.resolve([]).then(resolve);
  return chain;
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const ORG_ID = "org_test_123";

const mockCreditRow = {
  id: "cred_1",
  orgId: ORG_ID,
  balance: 80,
  monthlyAllocation: 100,
  rolloverBalance: 20,
  rolloverExpiresAt: null,
  lastResetAt: new Date("2025-01-01"),
};

const mockTransaction = {
  id: "tx_1",
  orgId: ORG_ID,
  type: "deduction" as const,
  amount: -1,
  runningBalance: 79,
  description: "Credit deduction for post post_1",
  postId: "post_1",
  createdAt: new Date("2025-06-01T10:00:00Z"),
};

// ---------------------------------------------------------------------------
// getBalance
// ---------------------------------------------------------------------------

describe("getBalance", () => {
  it("returns zero balance when org has no credit record", async () => {
    db.select.mockReturnValue(selectChain([]));

    const result = await getBalance(ORG_ID);

    expect(result).toEqual({
      balance: 0,
      monthlyAllocation: 0,
      rolloverBalance: 0,
      rolloverExpiresAt: null,
      usagePercentage: 0,
      isLowBalance: true,
    });
  });

  it("returns correct balance with usage percentage", async () => {
    db.select.mockReturnValue(selectChain([mockCreditRow]));

    const result = await getBalance(ORG_ID);

    expect(result.balance).toBe(80);
    expect(result.monthlyAllocation).toBe(100);
    expect(result.rolloverBalance).toBe(20);
    // totalAvailable = 100 + 20 = 120; used = 120 - 80 = 40; pct = 40/120*100 ≈ 33.33
    expect(result.usagePercentage).toBeCloseTo(33.33, 1);
    expect(result.isLowBalance).toBe(false);
  });

  it("flags isLowBalance when balance ≤ 10% of monthly allocation", async () => {
    const lowRow = { ...mockCreditRow, balance: 10 }; // 10 = 10% of 100
    db.select.mockReturnValue(selectChain([lowRow]));

    const result = await getBalance(ORG_ID);

    expect(result.isLowBalance).toBe(true);
  });

  it("flags isLowBalance when balance is below threshold", async () => {
    const lowRow = { ...mockCreditRow, balance: 5 }; // 5 < 10% of 100
    db.select.mockReturnValue(selectChain([lowRow]));

    const result = await getBalance(ORG_ID);

    expect(result.isLowBalance).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// hasEnoughCredits
// ---------------------------------------------------------------------------

describe("hasEnoughCredits", () => {
  it("returns false when org has no credit record", async () => {
    db.select.mockReturnValue(selectChain([]));

    expect(await hasEnoughCredits(ORG_ID)).toBe(false);
  });

  it("returns true when balance is sufficient", async () => {
    db.select.mockReturnValue(selectChain([{ balance: 10 }]));

    expect(await hasEnoughCredits(ORG_ID, 5)).toBe(true);
  });

  it("returns true when balance equals requested amount", async () => {
    db.select.mockReturnValue(selectChain([{ balance: 5 }]));

    expect(await hasEnoughCredits(ORG_ID, 5)).toBe(true);
  });

  it("returns false when balance is insufficient", async () => {
    db.select.mockReturnValue(selectChain([{ balance: 2 }]));

    expect(await hasEnoughCredits(ORG_ID, 5)).toBe(false);
  });

  it("defaults to checking for 1 credit", async () => {
    db.select.mockReturnValue(selectChain([{ balance: 1 }]));

    expect(await hasEnoughCredits(ORG_ID)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// deductCredit
// ---------------------------------------------------------------------------

describe("deductCredit", () => {
  it("deducts credit and creates transaction on success", async () => {
    db.update.mockReturnValue(updateChain([{ newBalance: 79 }]));
    db.insert.mockReturnValue(insertChain());

    const result = await deductCredit(ORG_ID, "post_1");

    expect(result).toEqual({ success: true, newBalance: 79 });
    expect(db.update).toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalled();
  });

  it("returns error when balance is insufficient (no rows updated)", async () => {
    db.update.mockReturnValue(updateChain([]));

    const result = await deductCredit(ORG_ID, "post_1");

    expect(result).toEqual({
      success: false,
      newBalance: 0,
      error: "Insufficient credits",
    });
    // Should NOT have inserted a transaction
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("supports custom deduction amounts", async () => {
    db.update.mockReturnValue(updateChain([{ newBalance: 75 }]));
    db.insert.mockReturnValue(insertChain());

    const result = await deductCredit(ORG_ID, "post_2", 5);

    expect(result).toEqual({ success: true, newBalance: 75 });
  });
});

// ---------------------------------------------------------------------------
// getTransactionHistory
// ---------------------------------------------------------------------------

describe("getTransactionHistory", () => {
  it("returns paginated transaction list", async () => {
    db.select.mockReturnValue(selectChain([mockTransaction]));

    const result = await getTransactionHistory(ORG_ID, {
      limit: 10,
      offset: 0,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: "tx_1",
      type: "deduction",
      amount: -1,
      runningBalance: 79,
      description: "Credit deduction for post post_1",
      postId: "post_1",
      createdAt: mockTransaction.createdAt,
    });
  });

  it("defaults to limit 20, offset 0", async () => {
    db.select.mockReturnValue(selectChain([]));

    await getTransactionHistory(ORG_ID);

    // Verify limit(20) was called on the chain
    const chain = db.select.mock.results[0].value;
    expect(chain.limit).toHaveBeenCalledWith(20);
    expect(chain.offset).toHaveBeenCalledWith(0);
  });

  it("caps limit at 100", async () => {
    db.select.mockReturnValue(selectChain([]));

    await getTransactionHistory(ORG_ID, { limit: 500 });

    const chain = db.select.mock.results[0].value;
    expect(chain.limit).toHaveBeenCalledWith(100);
  });

  it("returns empty array when no transactions exist", async () => {
    db.select.mockReturnValue(selectChain([]));

    const result = await getTransactionHistory(ORG_ID);

    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// addCredits
// ---------------------------------------------------------------------------

describe("addCredits", () => {
  it("adds credits and creates transaction", async () => {
    db.update.mockReturnValue(updateChain([{ newBalance: 130 }]));
    db.insert.mockReturnValue(insertChain());

    const result = await addCredits(
      ORG_ID,
      50,
      "purchase",
      "Credit pack purchase",
    );

    expect(result).toEqual({ success: true, newBalance: 130 });
    expect(db.update).toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalled();
  });

  it("returns error when org credit record does not exist", async () => {
    db.update.mockReturnValue(updateChain([]));

    const result = await addCredits(
      ORG_ID,
      50,
      "bonus",
      "Welcome bonus",
    );

    expect(result).toEqual({
      success: false,
      newBalance: 0,
      error: "Organization credit record not found",
    });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("supports allocation type", async () => {
    db.update.mockReturnValue(updateChain([{ newBalance: 100 }]));
    db.insert.mockReturnValue(insertChain());

    const result = await addCredits(
      ORG_ID,
      100,
      "allocation",
      "Monthly allocation reset",
    );

    expect(result).toEqual({ success: true, newBalance: 100 });
  });
});
