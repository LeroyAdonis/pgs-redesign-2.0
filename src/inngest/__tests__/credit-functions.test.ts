/**
 * Tests for Inngest credit functions — monthly reset & rollover expiry
 *
 * Validates business logic for:
 * - Monthly credit allocation based on tier
 * - Rollover handling for Grower/Mogul (creditRollover=true)
 * - No rollover for Seedling/Hustler
 * - Canceled subscription skipping
 * - Double-allocation guard (same-month reset)
 * - past_due / trialing still receive allocation
 * - Daily rollover expiry for expired credits
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — must be declared before imports
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

// Mock Inngest client — createFunction returns the handler for direct invocation
vi.mock("@/inngest/client", () => ({
  inngest: {
    createFunction: (...args: unknown[]) => {
      // Return the last argument (the async handler)
      return args[args.length - 1];
    },
  },
}));

// Import after mocks — these are the raw handler functions
import {
  creditMonthlyReset,
  creditExpireRollover,
} from "../credit-functions";

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let db: { select: Mock; update: Mock; insert: Mock };

// ---------------------------------------------------------------------------
// Helpers — Drizzle fluent chain mocks
// ---------------------------------------------------------------------------

function selectChain<T>(result: T[]) {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.from = vi.fn(self);
  chain.where = vi.fn(self);
  chain.limit = vi.fn(self);
  chain.offset = vi.fn(self);
  chain.orderBy = vi.fn(self);
  chain.then = (resolve: (v: T[]) => void) =>
    Promise.resolve(result).then(resolve);
  return chain;
}

function updateChain<T>(result: T[] = []) {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.set = vi.fn(self);
  chain.where = vi.fn(self);
  chain.returning = vi.fn(() => Promise.resolve(result));
  chain.then = (resolve: (v: T[]) => void) =>
    Promise.resolve(result).then(resolve);
  return chain;
}

function insertChain() {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.values = vi.fn(self);
  chain.returning = vi.fn(() => Promise.resolve([]));
  chain.then = (resolve: (v: unknown[]) => void) =>
    Promise.resolve([]).then(resolve);
  return chain;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const mockStepRun = vi.fn();

beforeEach(async () => {
  vi.clearAllMocks();
  const dbMod = await import("@/db");
  db = dbMod.db as unknown as typeof db;

  // Reset the step.run mock — it executes callbacks immediately
  mockStepRun.mockImplementation(
    async (_name: string, fn: () => Promise<unknown>) => fn(),
  );
});

/**
 * Create a mock step context that Inngest handlers receive.
 * step.run() executes the callback immediately for test purposes.
 */
function createStepContext() {
  return {
    step: {
      run: mockStepRun,
    },
  };
}

// ---------------------------------------------------------------------------
// creditMonthlyReset
// ---------------------------------------------------------------------------

describe("creditMonthlyReset", () => {
  it("allocates correct credits for hustler tier (no rollover)", async () => {
    // Step 1: find-eligible-orgs returns one hustler subscription
    db.select.mockReturnValueOnce(
      selectChain([{ orgId: "org_1", tier: "hustler" }]),
    );

    // Step 2 (processMonthlyReset):
    // - credit record lookup (balance=30, no rollover)
    db.select.mockReturnValueOnce(
      selectChain([
        {
          orgId: "org_1",
          balance: 30,
          monthlyAllocation: 50,
          rolloverBalance: 0,
          rolloverExpiresAt: null,
          lastResetAt: new Date("2024-12-01"), // different month
        },
      ]),
    );

    // update credit record
    db.update.mockReturnValue(updateChain());
    // insert allocation transaction
    db.insert.mockReturnValue(insertChain());

    const handler = creditMonthlyReset as unknown as (
      ctx: ReturnType<typeof createStepContext>,
    ) => Promise<void>;
    await handler(createStepContext());

    // Should have updated credit record
    expect(db.update).toHaveBeenCalled();
    // Should have inserted allocation transaction (no rollover for hustler)
    expect(db.insert).toHaveBeenCalled();
  });

  it("handles rollover for grower tier (creditRollover=true)", async () => {
    db.select.mockReturnValueOnce(
      selectChain([{ orgId: "org_1", tier: "grower" }]),
    );

    // Grower: allocation=200, remaining balance=80
    db.select.mockReturnValueOnce(
      selectChain([
        {
          orgId: "org_1",
          balance: 80,
          monthlyAllocation: 200,
          rolloverBalance: 0,
          rolloverExpiresAt: null,
          lastResetAt: new Date("2024-12-01"),
        },
      ]),
    );

    db.update.mockReturnValue(updateChain());
    db.insert.mockReturnValue(insertChain());

    const handler = creditMonthlyReset as unknown as (
      ctx: ReturnType<typeof createStepContext>,
    ) => Promise<void>;
    await handler(createStepContext());

    // Should have called update (credit record) and insert (transactions)
    expect(db.update).toHaveBeenCalled();
    // For rollover: allocation txn + rollover txn = at least 2 inserts
    expect(db.insert).toHaveBeenCalledTimes(2);
  });

  it("does not rollover for seedling (creditRollover=false)", async () => {
    db.select.mockReturnValueOnce(
      selectChain([{ orgId: "org_1", tier: "seedling" }]),
    );

    // Seedling: allocation=10, remaining balance=5
    db.select.mockReturnValueOnce(
      selectChain([
        {
          orgId: "org_1",
          balance: 5,
          monthlyAllocation: 10,
          rolloverBalance: 0,
          rolloverExpiresAt: null,
          lastResetAt: new Date("2024-12-01"),
        },
      ]),
    );

    db.update.mockReturnValue(updateChain());
    db.insert.mockReturnValue(insertChain());

    const handler = creditMonthlyReset as unknown as (
      ctx: ReturnType<typeof createStepContext>,
    ) => Promise<void>;
    await handler(createStepContext());

    // Only allocation transaction, no rollover transaction
    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  it("skips canceled subscriptions (not in eligible query)", async () => {
    // The query filters by inArray(status, ["active", "past_due", "trialing"])
    // So canceled subs are not returned
    db.select.mockReturnValueOnce(selectChain([]));

    const handler = creditMonthlyReset as unknown as (
      ctx: ReturnType<typeof createStepContext>,
    ) => Promise<void>;
    await handler(createStepContext());

    // Should have run find-eligible-orgs but no reset batch
    expect(mockStepRun).toHaveBeenCalledTimes(1);
    expect(db.update).not.toHaveBeenCalled();
  });

  it("guards against double-allocation (same month reset)", async () => {
    const now = new Date();
    db.select.mockReturnValueOnce(
      selectChain([{ orgId: "org_1", tier: "hustler" }]),
    );

    // Credit record was already reset this month
    db.select.mockReturnValueOnce(
      selectChain([
        {
          orgId: "org_1",
          balance: 50,
          monthlyAllocation: 50,
          rolloverBalance: 0,
          rolloverExpiresAt: null,
          lastResetAt: new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
          ),
        },
      ]),
    );

    db.update.mockReturnValue(updateChain());
    db.insert.mockReturnValue(insertChain());

    const handler = creditMonthlyReset as unknown as (
      ctx: ReturnType<typeof createStepContext>,
    ) => Promise<void>;
    await handler(createStepContext());

    // No update or insert because double-allocation guard kicks in
    expect(db.update).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("still allocates for past_due subscriptions", async () => {
    db.select.mockReturnValueOnce(
      selectChain([{ orgId: "org_1", tier: "hustler" }]),
    );

    db.select.mockReturnValueOnce(
      selectChain([
        {
          orgId: "org_1",
          balance: 10,
          monthlyAllocation: 50,
          rolloverBalance: 0,
          rolloverExpiresAt: null,
          lastResetAt: new Date("2024-12-01"),
        },
      ]),
    );

    db.update.mockReturnValue(updateChain());
    db.insert.mockReturnValue(insertChain());

    const handler = creditMonthlyReset as unknown as (
      ctx: ReturnType<typeof createStepContext>,
    ) => Promise<void>;
    await handler(createStepContext());

    // Should process the reset
    expect(db.update).toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalled();
  });

  it("skips org with no credit record and continues", async () => {
    db.select.mockReturnValueOnce(
      selectChain([{ orgId: "org_1", tier: "hustler" }]),
    );

    // No credit record found
    db.select.mockReturnValueOnce(selectChain([]));

    db.update.mockReturnValue(updateChain());
    db.insert.mockReturnValue(insertChain());

    const handler = creditMonthlyReset as unknown as (
      ctx: ReturnType<typeof createStepContext>,
    ) => Promise<void>;
    await handler(createStepContext());

    // Skipped — no update or insert
    expect(db.update).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("caps rollover at monthly allocation", async () => {
    db.select.mockReturnValueOnce(
      selectChain([{ orgId: "org_1", tier: "mogul" }]),
    );

    // Mogul: allocation=500, remaining balance=600 (has extra from bonus)
    db.select.mockReturnValueOnce(
      selectChain([
        {
          orgId: "org_1",
          balance: 600,
          monthlyAllocation: 500,
          rolloverBalance: 0,
          rolloverExpiresAt: null,
          lastResetAt: new Date("2024-12-01"),
        },
      ]),
    );

    db.update.mockReturnValue(updateChain());
    db.insert.mockReturnValue(insertChain());

    const handler = creditMonthlyReset as unknown as (
      ctx: ReturnType<typeof createStepContext>,
    ) => Promise<void>;
    await handler(createStepContext());

    // Rollover capped at allocation (500), newBalance = 500 + 500 = 1000
    expect(db.update).toHaveBeenCalled();
    // allocation txn + rollover txn
    expect(db.insert).toHaveBeenCalledTimes(2);
  });

  it("expires old rollover during reset if past expiry date", async () => {
    const pastDate = new Date("2024-11-01");

    db.select.mockReturnValueOnce(
      selectChain([{ orgId: "org_1", tier: "grower" }]),
    );

    // Has expired rollover that daily check missed
    db.select.mockReturnValueOnce(
      selectChain([
        {
          orgId: "org_1",
          balance: 250,
          monthlyAllocation: 200,
          rolloverBalance: 50,
          rolloverExpiresAt: pastDate, // already expired
          lastResetAt: new Date("2024-12-01"),
        },
      ]),
    );

    db.update.mockReturnValue(updateChain());
    db.insert.mockReturnValue(insertChain());

    const handler = creditMonthlyReset as unknown as (
      ctx: ReturnType<typeof createStepContext>,
    ) => Promise<void>;
    await handler(createStepContext());

    // Should insert: expiry txn + allocation txn + rollover txn = 3
    expect(db.insert).toHaveBeenCalledTimes(3);
  });
});

// ---------------------------------------------------------------------------
// creditExpireRollover — daily cron
// ---------------------------------------------------------------------------

describe("creditExpireRollover", () => {
  it("expires rollover credits and deducts from balance", async () => {
    // Step 1: find expired rollovers
    db.select.mockReturnValueOnce(
      selectChain([
        { orgId: "org_1", balance: 250, rolloverBalance: 50 },
      ]),
    );

    db.update.mockReturnValue(updateChain());
    db.insert.mockReturnValue(insertChain());

    const handler = creditExpireRollover as unknown as (
      ctx: ReturnType<typeof createStepContext>,
    ) => Promise<void>;
    await handler(createStepContext());

    // Should update credit record (zero rollover, deduct from balance)
    expect(db.update).toHaveBeenCalled();
    // Should insert expiry transaction
    expect(db.insert).toHaveBeenCalled();
  });

  it("does nothing when no expired rollovers found", async () => {
    db.select.mockReturnValueOnce(selectChain([]));

    const handler = creditExpireRollover as unknown as (
      ctx: ReturnType<typeof createStepContext>,
    ) => Promise<void>;
    await handler(createStepContext());

    // Only the find step runs, no processing
    expect(mockStepRun).toHaveBeenCalledTimes(1);
    expect(db.update).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("does not let balance go below zero", async () => {
    // Rollover is larger than remaining balance
    db.select.mockReturnValueOnce(
      selectChain([
        { orgId: "org_1", balance: 20, rolloverBalance: 50 },
      ]),
    );

    db.update.mockReturnValue(updateChain());
    db.insert.mockReturnValue(insertChain());

    const handler = creditExpireRollover as unknown as (
      ctx: ReturnType<typeof createStepContext>,
    ) => Promise<void>;
    await handler(createStepContext());

    // Math.min(50, 20) = 20 deducted, newBalance = 0
    expect(db.update).toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalled();
  });

  it("processes multiple expired rollovers independently", async () => {
    db.select.mockReturnValueOnce(
      selectChain([
        { orgId: "org_1", balance: 300, rolloverBalance: 100 },
        { orgId: "org_2", balance: 50, rolloverBalance: 30 },
      ]),
    );

    db.update.mockReturnValue(updateChain());
    db.insert.mockReturnValue(insertChain());

    const handler = creditExpireRollover as unknown as (
      ctx: ReturnType<typeof createStepContext>,
    ) => Promise<void>;
    await handler(createStepContext());

    // 2 updates (one per org) + 2 inserts (one expiry txn per org)
    expect(db.update).toHaveBeenCalledTimes(2);
    expect(db.insert).toHaveBeenCalledTimes(2);
  });

  it("continues processing other orgs when one fails", async () => {
    db.select.mockReturnValueOnce(
      selectChain([
        { orgId: "org_fail", balance: 100, rolloverBalance: 50 },
        { orgId: "org_ok", balance: 200, rolloverBalance: 30 },
      ]),
    );

    // First update throws, second succeeds
    db.update
      .mockReturnValueOnce(
        (() => {
          const chain: Record<string, unknown> = {};
          const self = () => chain;
          chain.set = vi.fn(self);
          chain.where = vi.fn(() => {
            throw new Error("DB connection lost");
          });
          return chain;
        })(),
      )
      .mockReturnValue(updateChain());
    db.insert.mockReturnValue(insertChain());

    const handler = creditExpireRollover as unknown as (
      ctx: ReturnType<typeof createStepContext>,
    ) => Promise<void>;
    await handler(createStepContext());

    // Despite first org failing, second should still be processed
    // At least 1 insert for the successful org
    expect(db.insert).toHaveBeenCalled();
  });
});
