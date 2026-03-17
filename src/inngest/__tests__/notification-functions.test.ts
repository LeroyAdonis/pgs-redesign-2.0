/**
 * Tests for Inngest notification pipeline functions
 *
 * Verifies event-driven notification creation:
 *   - Post published / failed → user notification via triggers
 *   - Low credits → percentage calculation + warning
 *   - Token expiry check → cron job finds expiring tokens, notifies owners
 *   - Admin signup / subscription change → notifies all admin users
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks (accessible inside vi.mock factories) ─────────

const {
  mockNotifyPostPublished,
  mockNotifyPostFailed,
  mockNotifyLowCredits,
  mockNotifyTokenExpiring,
  mockNotifyAdminSignup,
  mockNotifyAdminSubscriptionChange,
} = vi.hoisted(() => ({
  mockNotifyPostPublished: vi.fn().mockResolvedValue(undefined),
  mockNotifyPostFailed: vi.fn().mockResolvedValue(undefined),
  mockNotifyLowCredits: vi.fn().mockResolvedValue(undefined),
  mockNotifyTokenExpiring: vi.fn().mockResolvedValue(undefined),
  mockNotifyAdminSignup: vi.fn().mockResolvedValue(undefined),
  mockNotifyAdminSubscriptionChange: vi.fn().mockResolvedValue(undefined),
}));

const mockDb = vi.hoisted(() => ({
  select: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
}));

// ── Mock modules ────────────────────────────────────────────────

vi.mock("@/db", () => ({ db: mockDb }));

vi.mock("@/db/schema", () => ({
  socialAccount: {
    id: "socialAccount.id",
    platform: "socialAccount.platform",
    tokenExpiresAt: "socialAccount.tokenExpiresAt",
    orgId: "socialAccount.orgId",
    isActive: "socialAccount.isActive",
  },
  organization: {
    id: "organization.id",
    ownerId: "organization.ownerId",
  },
  user: {
    id: "user.id",
    role: "user.role",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
  lte: vi.fn((...args: unknown[]) => ({ type: "lte", args })),
  gte: vi.fn((...args: unknown[]) => ({ type: "gte", args })),
  isNotNull: vi.fn((...args: unknown[]) => ({ type: "isNotNull", args })),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/notifications/notification-triggers", () => ({
  notifyPostPublished: (...args: unknown[]) => mockNotifyPostPublished(...args),
  notifyPostFailed: (...args: unknown[]) => mockNotifyPostFailed(...args),
  notifyLowCredits: (...args: unknown[]) => mockNotifyLowCredits(...args),
  notifyTokenExpiring: (...args: unknown[]) => mockNotifyTokenExpiring(...args),
  notifyAdminSignup: (...args: unknown[]) => mockNotifyAdminSignup(...args),
  notifyAdminSubscriptionChange: (...args: unknown[]) =>
    mockNotifyAdminSubscriptionChange(...args),
}));

// Mock inngest client — createFunction returns the raw handler for testing
vi.mock("../client", () => ({
  inngest: {
    createFunction: vi.fn(
      (
        _config: unknown,
        _trigger: unknown,
        handler: (...args: unknown[]) => unknown,
      ) => handler,
    ),
  },
}));

// ── Import after mocks ──────────────────────────────────────────

import {
  notifyOnPostPublished,
  notifyOnPostFailed,
  notifyOnLowCredits,
  checkExpiringTokens,
  notifyOnSignup,
  notifyOnSubscriptionChange,
} from "../notification-functions";

// ── Test helpers ────────────────────────────────────────────────

/** Create a mock Inngest step object */
function createMockStep() {
  return {
    run: vi.fn((_name: string, fn: () => unknown) => fn()),
    sleep: vi.fn().mockResolvedValue(undefined),
  };
}

type StepHandler = (ctx: {
  event: { data: unknown };
  step: ReturnType<typeof createMockStep>;
}) => Promise<void>;

type CronHandler = (ctx: {
  step: ReturnType<typeof createMockStep>;
}) => Promise<void>;

/**
 * Set up the mock DB select chain to return specific data for
 * sequential calls. Each call to db.select() pops the next response.
 */
function setupSelectChain(responses: unknown[][]) {
  let callIndex = 0;

  mockDb.select.mockImplementation(() => {
    const response = responses[callIndex] ?? [];
    callIndex++;

    const mockLimit = vi.fn().mockResolvedValue(response);
    const mockWhere = vi.fn(() => ({
      limit: mockLimit,
      then: (resolve: (v: unknown) => void) => resolve(response),
    }));
    const mockFrom = vi.fn(() => ({
      where: mockWhere,
      limit: mockLimit,
    }));

    return { from: mockFrom };
  });
}

// ── Tests ───────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// notifyOnPostPublished
// ---------------------------------------------------------------------------

describe("notifyOnPostPublished", () => {
  it("creates notification with correct data", async () => {
    const step = createMockStep();
    const handler = notifyOnPostPublished as unknown as StepHandler;

    await handler({
      event: {
        data: {
          userId: "user_1",
          postId: "post_1",
          platform: "twitter",
          platformUrl: "https://twitter.com/i/status/123",
        },
      },
      step,
    });

    expect(step.run).toHaveBeenCalledTimes(1);
    expect(step.run.mock.calls[0][0]).toBe("create-notification");

    expect(mockNotifyPostPublished).toHaveBeenCalledWith("user_1", {
      postId: "post_1",
      platform: "twitter",
      platformUrl: "https://twitter.com/i/status/123",
    });
  });
});

// ---------------------------------------------------------------------------
// notifyOnPostFailed
// ---------------------------------------------------------------------------

describe("notifyOnPostFailed", () => {
  it("creates notification with error info", async () => {
    const step = createMockStep();
    const handler = notifyOnPostFailed as unknown as StepHandler;

    await handler({
      event: {
        data: {
          userId: "user_1",
          postId: "post_2",
          platform: "facebook",
          error: "API timeout",
          retryable: true,
        },
      },
      step,
    });

    expect(step.run).toHaveBeenCalledTimes(1);
    expect(step.run.mock.calls[0][0]).toBe("create-notification");

    expect(mockNotifyPostFailed).toHaveBeenCalledWith("user_1", {
      postId: "post_2",
      platform: "facebook",
      error: "API timeout",
      retryable: true,
    });
  });

  it("passes retryable=false for non-retryable errors", async () => {
    const step = createMockStep();
    const handler = notifyOnPostFailed as unknown as StepHandler;

    await handler({
      event: {
        data: {
          userId: "user_1",
          postId: "post_3",
          platform: "instagram",
          error: "Account suspended",
          retryable: false,
        },
      },
      step,
    });

    expect(mockNotifyPostFailed).toHaveBeenCalledWith(
      "user_1",
      expect.objectContaining({ retryable: false }),
    );
  });
});

// ---------------------------------------------------------------------------
// notifyOnLowCredits
// ---------------------------------------------------------------------------

describe("notifyOnLowCredits", () => {
  it("calculates percentage correctly and creates notification", async () => {
    const step = createMockStep();
    const handler = notifyOnLowCredits as unknown as StepHandler;

    await handler({
      event: {
        data: {
          userId: "user_1",
          remaining: 15,
          total: 100,
        },
      },
      step,
    });

    expect(step.run).toHaveBeenCalledTimes(1);
    expect(step.run.mock.calls[0][0]).toBe("create-notification");

    expect(mockNotifyLowCredits).toHaveBeenCalledWith("user_1", {
      remaining: 15,
      total: 100,
      percentage: 15, // Math.round(15/100 * 100) = 15
    });
  });

  it("handles zero total gracefully (percentage = 0)", async () => {
    const step = createMockStep();
    const handler = notifyOnLowCredits as unknown as StepHandler;

    await handler({
      event: {
        data: {
          userId: "user_1",
          remaining: 0,
          total: 0,
        },
      },
      step,
    });

    expect(mockNotifyLowCredits).toHaveBeenCalledWith("user_1", {
      remaining: 0,
      total: 0,
      percentage: 0,
    });
  });

  it("rounds percentage to nearest integer", async () => {
    const step = createMockStep();
    const handler = notifyOnLowCredits as unknown as StepHandler;

    await handler({
      event: {
        data: {
          userId: "user_1",
          remaining: 7,
          total: 30,
        },
      },
      step,
    });

    // 7/30 * 100 = 23.333... → rounds to 23
    expect(mockNotifyLowCredits).toHaveBeenCalledWith("user_1", {
      remaining: 7,
      total: 30,
      percentage: 23,
    });
  });
});

// ---------------------------------------------------------------------------
// checkExpiringTokens
// ---------------------------------------------------------------------------

describe("checkExpiringTokens", () => {
  it("finds expiring tokens and notifies org owners", async () => {
    const expiryDate = new Date("2025-06-25T00:00:00Z");

    // First call: find expiring social accounts
    // Second call: find org owner
    setupSelectChain([
      [
        {
          socialAccountId: "sa_1",
          platform: "instagram",
          tokenExpiresAt: expiryDate,
          orgId: "org_1",
        },
      ],
      [{ ownerId: "owner_user_1" }],
    ]);

    const step = createMockStep();
    const handler = checkExpiringTokens as unknown as CronHandler;

    await handler({ step });

    // Two steps: find-expiring-tokens, notify-owners
    expect(step.run).toHaveBeenCalledTimes(2);
    expect(step.run.mock.calls[0][0]).toBe("find-expiring-tokens");
    expect(step.run.mock.calls[1][0]).toBe("notify-owners");

    expect(mockNotifyTokenExpiring).toHaveBeenCalledWith("owner_user_1", {
      socialAccountId: "sa_1",
      platform: "instagram",
      expiresAt: expiryDate.toISOString(),
    });
  });

  it("skips notify step when no expiring tokens found", async () => {
    setupSelectChain([[]]);

    const step = createMockStep();
    const handler = checkExpiringTokens as unknown as CronHandler;

    await handler({ step });

    // Only find-expiring-tokens step
    expect(step.run).toHaveBeenCalledTimes(1);
    expect(step.run.mock.calls[0][0]).toBe("find-expiring-tokens");

    expect(mockNotifyTokenExpiring).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// notifyOnSignup
// ---------------------------------------------------------------------------

describe("notifyOnSignup", () => {
  it("notifies all admin users about new signup", async () => {
    // findAdminUsers query
    setupSelectChain([
      [{ id: "admin_1" }, { id: "admin_2" }],
    ]);

    const step = createMockStep();
    const handler = notifyOnSignup as unknown as StepHandler;

    await handler({
      event: {
        data: {
          newUserId: "new_user_1",
          email: "new@example.com",
        },
      },
      step,
    });

    expect(step.run).toHaveBeenCalledTimes(1);
    expect(step.run.mock.calls[0][0]).toBe("notify-admins");

    // Each admin gets a notification
    expect(mockNotifyAdminSignup).toHaveBeenCalledTimes(2);
    expect(mockNotifyAdminSignup).toHaveBeenCalledWith("admin_1", {
      newUserId: "new_user_1",
      email: "new@example.com",
    });
    expect(mockNotifyAdminSignup).toHaveBeenCalledWith("admin_2", {
      newUserId: "new_user_1",
      email: "new@example.com",
    });
  });

  it("handles no admin users gracefully", async () => {
    setupSelectChain([[]]);

    const step = createMockStep();
    const handler = notifyOnSignup as unknown as StepHandler;

    await handler({
      event: {
        data: {
          newUserId: "new_user_1",
          email: "new@example.com",
        },
      },
      step,
    });

    expect(mockNotifyAdminSignup).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// notifyOnSubscriptionChange
// ---------------------------------------------------------------------------

describe("notifyOnSubscriptionChange", () => {
  it("notifies all admin users about subscription change", async () => {
    setupSelectChain([
      [{ id: "admin_1" }, { id: "admin_2" }, { id: "admin_3" }],
    ]);

    const step = createMockStep();
    const handler = notifyOnSubscriptionChange as unknown as StepHandler;

    await handler({
      event: {
        data: {
          userId: "sub_user_1",
          fromTier: "free",
          toTier: "pro",
          action: "upgrade",
        },
      },
      step,
    });

    expect(step.run).toHaveBeenCalledTimes(1);
    expect(step.run.mock.calls[0][0]).toBe("notify-admins");

    expect(mockNotifyAdminSubscriptionChange).toHaveBeenCalledTimes(3);
    expect(mockNotifyAdminSubscriptionChange).toHaveBeenCalledWith("admin_1", {
      userId: "sub_user_1",
      fromTier: "free",
      toTier: "pro",
      action: "upgrade",
    });
  });

  it("handles no admin users gracefully", async () => {
    setupSelectChain([[]]);

    const step = createMockStep();
    const handler = notifyOnSubscriptionChange as unknown as StepHandler;

    await handler({
      event: {
        data: {
          userId: "sub_user_1",
          fromTier: "pro",
          toTier: "free",
          action: "downgrade",
        },
      },
      step,
    });

    expect(mockNotifyAdminSubscriptionChange).not.toHaveBeenCalled();
  });
});
