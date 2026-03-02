/**
 * Tests for Inngest billing notification functions
 *
 * Validates that each billing event type creates the correct
 * notification via the notification-triggers module.
 *
 * Mocks: DB (org owner lookup), notification triggers, Inngest client.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — must be declared before imports
// ---------------------------------------------------------------------------

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
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

// Mock notification triggers
const mockNotifySubscriptionActivated = vi.fn();
const mockNotifyPaymentSucceeded = vi.fn();
const mockNotifyBillingCreditsLow = vi.fn();
const mockNotifySubscriptionCanceled = vi.fn();
const mockNotifyTierChanged = vi.fn();

vi.mock("@/lib/notifications/notification-triggers", () => ({
  notifySubscriptionActivated: (...args: unknown[]) =>
    mockNotifySubscriptionActivated(...args),
  notifyPaymentSucceeded: (...args: unknown[]) =>
    mockNotifyPaymentSucceeded(...args),
  notifyBillingCreditsLow: (...args: unknown[]) =>
    mockNotifyBillingCreditsLow(...args),
  notifySubscriptionCanceled: (...args: unknown[]) =>
    mockNotifySubscriptionCanceled(...args),
  notifyTierChanged: (...args: unknown[]) =>
    mockNotifyTierChanged(...args),
}));

// Mock Inngest client — createFunction returns the handler
vi.mock("@/inngest/client", () => ({
  inngest: {
    createFunction: (...args: unknown[]) => args[args.length - 1],
  },
}));

// Import after mocks — these are the raw handler functions
import {
  notifyOnSubscriptionActivated,
  notifyOnPaymentSucceeded,
  notifyOnBillingCreditsLow,
  notifyOnSubscriptionCanceled,
  notifyOnTierChanged,
} from "../billing-notification-functions";

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let db: { select: Mock };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function selectChain<T>(result: T[]) {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.from = vi.fn(self);
  chain.where = vi.fn(self);
  chain.limit = vi.fn(self);
  chain.then = (resolve: (v: T[]) => void) =>
    Promise.resolve(result).then(resolve);
  return chain;
}

const mockStepRun = vi.fn();

function createContext(eventData: Record<string, unknown>) {
  mockStepRun.mockImplementation(
    async (_name: string, fn: () => Promise<unknown>) => fn(),
  );
  return {
    event: { data: eventData },
    step: { run: mockStepRun },
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const ORG_ID = "org_test_123";
const OWNER_ID = "user_owner_456";

beforeEach(async () => {
  vi.clearAllMocks();
  const dbMod = await import("@/db");
  db = dbMod.db as unknown as typeof db;
});

// ---------------------------------------------------------------------------
// notifyOnSubscriptionActivated
// ---------------------------------------------------------------------------

describe("notifyOnSubscriptionActivated", () => {
  it("creates subscription activated notification for org owner", async () => {
    db.select.mockReturnValue(selectChain([{ ownerId: OWNER_ID }]));

    const handler = notifyOnSubscriptionActivated as unknown as (
      ctx: ReturnType<typeof createContext>,
    ) => Promise<void>;

    await handler(
      createContext({
        orgId: ORG_ID,
        tier: "hustler",
        displayName: "Hustler",
        creditAllocation: 50,
      }),
    );

    expect(mockNotifySubscriptionActivated).toHaveBeenCalledWith(OWNER_ID, {
      tier: "hustler",
      displayName: "Hustler",
      creditAllocation: 50,
    });
  });

  it("skips notification when org owner not found", async () => {
    db.select.mockReturnValue(selectChain([]));

    const handler = notifyOnSubscriptionActivated as unknown as (
      ctx: ReturnType<typeof createContext>,
    ) => Promise<void>;

    await handler(
      createContext({
        orgId: ORG_ID,
        tier: "hustler",
        displayName: "Hustler",
        creditAllocation: 50,
      }),
    );

    expect(mockNotifySubscriptionActivated).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// notifyOnPaymentSucceeded
// ---------------------------------------------------------------------------

describe("notifyOnPaymentSucceeded", () => {
  it("creates payment succeeded notification for org owner", async () => {
    db.select.mockReturnValue(selectChain([{ ownerId: OWNER_ID }]));

    const handler = notifyOnPaymentSucceeded as unknown as (
      ctx: ReturnType<typeof createContext>,
    ) => Promise<void>;

    await handler(
      createContext({
        orgId: ORG_ID,
        tier: "grower",
        displayName: "Grower",
        creditAllocation: 200,
        periodEnd: "2025-02-01T00:00:00Z",
      }),
    );

    expect(mockNotifyPaymentSucceeded).toHaveBeenCalledWith(OWNER_ID, {
      tier: "grower",
      displayName: "Grower",
      creditAllocation: 200,
      periodEnd: "2025-02-01T00:00:00Z",
    });
  });

  it("skips notification when org owner not found", async () => {
    db.select.mockReturnValue(selectChain([]));

    const handler = notifyOnPaymentSucceeded as unknown as (
      ctx: ReturnType<typeof createContext>,
    ) => Promise<void>;

    await handler(
      createContext({
        orgId: ORG_ID,
        tier: "grower",
        displayName: "Grower",
        creditAllocation: 200,
        periodEnd: "2025-02-01T00:00:00Z",
      }),
    );

    expect(mockNotifyPaymentSucceeded).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// notifyOnBillingCreditsLow
// ---------------------------------------------------------------------------

describe("notifyOnBillingCreditsLow", () => {
  it("uses provided userId when available", async () => {
    const handler = notifyOnBillingCreditsLow as unknown as (
      ctx: ReturnType<typeof createContext>,
    ) => Promise<void>;

    await handler(
      createContext({
        orgId: ORG_ID,
        userId: "user_explicit_789",
        remaining: 5,
        total: 50,
      }),
    );

    expect(mockNotifyBillingCreditsLow).toHaveBeenCalledWith(
      "user_explicit_789",
      {
        remaining: 5,
        total: 50,
        percentage: 10,
      },
    );
    // Should NOT have queried DB since userId was provided
    expect(db.select).not.toHaveBeenCalled();
  });

  it("resolves userId from org owner when userId is empty", async () => {
    db.select.mockReturnValue(selectChain([{ ownerId: OWNER_ID }]));

    const handler = notifyOnBillingCreditsLow as unknown as (
      ctx: ReturnType<typeof createContext>,
    ) => Promise<void>;

    await handler(
      createContext({
        orgId: ORG_ID,
        userId: "",
        remaining: 3,
        total: 100,
      }),
    );

    expect(mockNotifyBillingCreditsLow).toHaveBeenCalledWith(OWNER_ID, {
      remaining: 3,
      total: 100,
      percentage: 3,
    });
  });

  it("skips when neither userId nor org owner is found", async () => {
    db.select.mockReturnValue(selectChain([]));

    const handler = notifyOnBillingCreditsLow as unknown as (
      ctx: ReturnType<typeof createContext>,
    ) => Promise<void>;

    await handler(
      createContext({
        orgId: ORG_ID,
        userId: "",
        remaining: 5,
        total: 50,
      }),
    );

    expect(mockNotifyBillingCreditsLow).not.toHaveBeenCalled();
  });

  it("calculates correct percentage", async () => {
    const handler = notifyOnBillingCreditsLow as unknown as (
      ctx: ReturnType<typeof createContext>,
    ) => Promise<void>;

    await handler(
      createContext({
        orgId: ORG_ID,
        userId: "user_1",
        remaining: 25,
        total: 200,
      }),
    );

    expect(mockNotifyBillingCreditsLow).toHaveBeenCalledWith("user_1", {
      remaining: 25,
      total: 200,
      percentage: 13, // Math.round(25/200 * 100) = 13
    });
  });

  it("handles zero total gracefully", async () => {
    const handler = notifyOnBillingCreditsLow as unknown as (
      ctx: ReturnType<typeof createContext>,
    ) => Promise<void>;

    await handler(
      createContext({
        orgId: ORG_ID,
        userId: "user_1",
        remaining: 0,
        total: 0,
      }),
    );

    expect(mockNotifyBillingCreditsLow).toHaveBeenCalledWith("user_1", {
      remaining: 0,
      total: 0,
      percentage: 0,
    });
  });
});

// ---------------------------------------------------------------------------
// notifyOnSubscriptionCanceled
// ---------------------------------------------------------------------------

describe("notifyOnSubscriptionCanceled", () => {
  it("creates cancellation notification for org owner", async () => {
    db.select.mockReturnValue(selectChain([{ ownerId: OWNER_ID }]));

    const handler = notifyOnSubscriptionCanceled as unknown as (
      ctx: ReturnType<typeof createContext>,
    ) => Promise<void>;

    await handler(
      createContext({
        orgId: ORG_ID,
        tier: "hustler",
        displayName: "Hustler",
        endsAt: "2025-02-01T00:00:00Z",
      }),
    );

    expect(mockNotifySubscriptionCanceled).toHaveBeenCalledWith(OWNER_ID, {
      tier: "hustler",
      displayName: "Hustler",
      endsAt: "2025-02-01T00:00:00Z",
    });
  });

  it("skips notification when org owner not found", async () => {
    db.select.mockReturnValue(selectChain([]));

    const handler = notifyOnSubscriptionCanceled as unknown as (
      ctx: ReturnType<typeof createContext>,
    ) => Promise<void>;

    await handler(
      createContext({
        orgId: ORG_ID,
        tier: "hustler",
        displayName: "Hustler",
        endsAt: "2025-02-01T00:00:00Z",
      }),
    );

    expect(mockNotifySubscriptionCanceled).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// notifyOnTierChanged
// ---------------------------------------------------------------------------

describe("notifyOnTierChanged", () => {
  it("creates tier changed notification with all data", async () => {
    db.select.mockReturnValue(selectChain([{ ownerId: OWNER_ID }]));

    const handler = notifyOnTierChanged as unknown as (
      ctx: ReturnType<typeof createContext>,
    ) => Promise<void>;

    await handler(
      createContext({
        orgId: ORG_ID,
        fromTier: "hustler",
        fromDisplayName: "Hustler",
        toTier: "grower",
        toDisplayName: "Grower",
        newCreditAllocation: 200,
        newSocialAccounts: 15,
      }),
    );

    expect(mockNotifyTierChanged).toHaveBeenCalledWith(OWNER_ID, {
      fromTier: "hustler",
      fromDisplayName: "Hustler",
      toTier: "grower",
      toDisplayName: "Grower",
      newCreditAllocation: 200,
      newSocialAccounts: 15,
    });
  });

  it("skips notification when org owner not found", async () => {
    db.select.mockReturnValue(selectChain([]));

    const handler = notifyOnTierChanged as unknown as (
      ctx: ReturnType<typeof createContext>,
    ) => Promise<void>;

    await handler(
      createContext({
        orgId: ORG_ID,
        fromTier: "hustler",
        fromDisplayName: "Hustler",
        toTier: "grower",
        toDisplayName: "Grower",
        newCreditAllocation: 200,
        newSocialAccounts: 15,
      }),
    );

    expect(mockNotifyTierChanged).not.toHaveBeenCalled();
  });

  it("handles downgrade tier change notification", async () => {
    db.select.mockReturnValue(selectChain([{ ownerId: OWNER_ID }]));

    const handler = notifyOnTierChanged as unknown as (
      ctx: ReturnType<typeof createContext>,
    ) => Promise<void>;

    await handler(
      createContext({
        orgId: ORG_ID,
        fromTier: "mogul",
        fromDisplayName: "Mogul",
        toTier: "seedling",
        toDisplayName: "Seedling",
        newCreditAllocation: 10,
        newSocialAccounts: 2,
      }),
    );

    expect(mockNotifyTierChanged).toHaveBeenCalledWith(OWNER_ID, {
      fromTier: "mogul",
      fromDisplayName: "Mogul",
      toTier: "seedling",
      toDisplayName: "Seedling",
      newCreditAllocation: 10,
      newSocialAccounts: 2,
    });
  });
});
