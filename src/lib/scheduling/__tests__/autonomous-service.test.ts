/**
 * Tests for autonomous scheduling service
 *
 * Tests tier limit checking, batch scheduling, and config placeholder.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock database ───────────────────────────────────────────────

vi.mock("@/db", () => {
  const mockReturning = vi.fn();
  const mockValues = vi.fn(() => ({ returning: mockReturning }));
  const mockInsert = vi.fn(() => ({ values: mockValues }));

  const mockUpdateReturning = vi.fn();
  const mockUpdateWhere = vi.fn(() => ({ returning: mockUpdateReturning }));
  const mockSet = vi.fn(() => ({ where: mockUpdateWhere }));
  const mockUpdate = vi.fn(() => ({ set: mockSet }));

  const mockLimit = vi.fn();
  const mockOrderBy = vi.fn(() => ({ limit: mockLimit }));
  const mockSelectWhere = vi.fn(() => ({
    orderBy: mockOrderBy,
    limit: mockLimit,
  }));
  const mockInnerJoin2 = vi.fn(() => ({
    where: mockSelectWhere,
    orderBy: mockOrderBy,
  }));
  const mockInnerJoin = vi.fn(() => ({
    where: mockSelectWhere,
    innerJoin: mockInnerJoin2,
    orderBy: mockOrderBy,
  }));
  const mockFrom = vi.fn(() => ({
    where: mockSelectWhere,
    innerJoin: mockInnerJoin,
    limit: mockLimit,
  }));
  const mockSelect = vi.fn(() => ({ from: mockFrom }));

  return {
    db: {
      insert: mockInsert,
      update: mockUpdate,
      select: mockSelect,
    },
    __mockInsert: mockInsert,
    __mockValues: mockValues,
    __mockReturning: mockReturning,
    __mockUpdate: mockUpdate,
    __mockSet: mockSet,
    __mockUpdateWhere: mockUpdateWhere,
    __mockSelect: mockSelect,
    __mockFrom: mockFrom,
    __mockInnerJoin: mockInnerJoin,
    __mockInnerJoin2: mockInnerJoin2,
    __mockSelectWhere: mockSelectWhere,
    __mockOrderBy: mockOrderBy,
    __mockLimit: mockLimit,
  };
});

vi.mock("@/db/schema", () => ({
  post: {
    id: "id",
    orgId: "org_id",
    status: "status",
    platform: "platform",
    createdAt: "created_at",
  },
  postSchedule: {
    id: "id",
    postId: "post_id",
    socialAccountId: "social_account_id",
    scheduledAt: "scheduled_at",
    publishedAt: "published_at",
    failedAt: "failed_at",
    retryCount: "retry_count",
    lastError: "last_error",
    createdAt: "created_at",
  },
  organization: {
    id: "id",
    tier: "tier",
    ownerId: "owner_id",
  },
  socialAccount: {
    id: "id",
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import {
  getAutonomousConfig,
  checkTierLimits,
  generateWeeklyBatch,
} from "../autonomous-service";

const dbMocks = (await import("@/db")) as unknown as Record<
  string,
  ReturnType<typeof vi.fn>
>;

describe("getAutonomousConfig", () => {
  it("returns null (placeholder)", async () => {
    const config = await getAutonomousConfig("org_1");
    expect(config).toBeNull();
  });
});

describe("checkTierLimits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows scheduling when within seedling limits", async () => {
    // checkTierLimits calls getOrgTier then getScheduleCount.
    // getOrgTier chain:   select().from().where().limit()
    // getScheduleCount: select().from().innerJoin().where()
    // Both use mockSelectWhere, so we need proper ordering:
    //   1st call (getOrgTier): return chainable { orderBy, limit }
    //   2nd call (getScheduleCount): return resolved value

    dbMocks.__mockSelectWhere
      .mockReturnValueOnce({
        orderBy: dbMocks.__mockOrderBy,
        limit: dbMocks.__mockLimit,
      })
      .mockResolvedValueOnce([{ value: 5 }]);

    // getOrgTier ends at .limit(1) → returns tier
    dbMocks.__mockLimit.mockResolvedValueOnce([{ tier: "seedling" }]);

    const result = await checkTierLimits("org_1", 3);

    expect(result.allowed).toBe(true);
    expect(result.currentCount).toBe(5);
    expect(result.maxAllowed).toBe(10);
  });

  it("denies scheduling when it would exceed seedling limits", async () => {
    dbMocks.__mockSelectWhere
      .mockReturnValueOnce({
        orderBy: dbMocks.__mockOrderBy,
        limit: dbMocks.__mockLimit,
      })
      .mockResolvedValueOnce([{ value: 8 }]);
    dbMocks.__mockLimit.mockResolvedValueOnce([{ tier: "seedling" }]);

    const result = await checkTierLimits("org_1", 5);

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("seedling");
    expect(result.reason).toContain("10");
    expect(result.currentCount).toBe(8);
    expect(result.maxAllowed).toBe(10);
  });

  it("always allows mogul tier (unlimited)", async () => {
    dbMocks.__mockSelectWhere
      .mockReturnValueOnce({
        orderBy: dbMocks.__mockOrderBy,
        limit: dbMocks.__mockLimit,
      })
      .mockResolvedValueOnce([{ value: 500 }]);
    dbMocks.__mockLimit.mockResolvedValueOnce([{ tier: "mogul" }]);

    const result = await checkTierLimits("org_1", 100);

    expect(result.allowed).toBe(true);
    expect(result.maxAllowed).toBe(-1);
  });

  it("uses hustler limits with 50 max", async () => {
    dbMocks.__mockSelectWhere
      .mockReturnValueOnce({
        orderBy: dbMocks.__mockOrderBy,
        limit: dbMocks.__mockLimit,
      })
      .mockResolvedValueOnce([{ value: 48 }]);
    dbMocks.__mockLimit.mockResolvedValueOnce([{ tier: "hustler" }]);

    const result = await checkTierLimits("org_1", 3);

    expect(result.allowed).toBe(false);
    expect(result.maxAllowed).toBe(50);
  });

  it("defaults to seedling when org not found", async () => {
    dbMocks.__mockSelectWhere
      .mockReturnValueOnce({
        orderBy: dbMocks.__mockOrderBy,
        limit: dbMocks.__mockLimit,
      })
      .mockResolvedValueOnce([{ value: 0 }]);
    dbMocks.__mockLimit.mockResolvedValueOnce([]);

    const result = await checkTierLimits("nonexistent", 5);

    expect(result.allowed).toBe(true);
    expect(result.maxAllowed).toBe(10);
  });
});

describe("generateWeeklyBatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates draft posts for each platform", async () => {
    // checkTierLimits calls: getOrgTier (select.from.where.limit) + getScheduleCount (select.from.innerJoin.where)
    dbMocks.__mockSelectWhere
      .mockReturnValueOnce({
        orderBy: dbMocks.__mockOrderBy,
        limit: dbMocks.__mockLimit,
      })
      .mockResolvedValueOnce([{ value: 10 }]);
    dbMocks.__mockLimit.mockResolvedValueOnce([{ tier: "grower" }]);

    // get org owner: select().from().where().limit()
    dbMocks.__mockSelectWhere.mockReturnValueOnce({
      orderBy: dbMocks.__mockOrderBy,
      limit: dbMocks.__mockLimit,
    });
    dbMocks.__mockLimit.mockResolvedValueOnce([{ ownerId: "user_1" }]);

    // Two insert().values().returning() calls for two platforms
    dbMocks.__mockReturning
      .mockResolvedValueOnce([{ id: "post_1" }])
      .mockResolvedValueOnce([{ id: "post_2" }]);

    const result = await generateWeeklyBatch(
      "org_1",
      ["instagram", "twitter"],
      "en",
    );

    expect(result.postIds).toEqual(["post_1", "post_2"]);
    expect(dbMocks.__mockInsert).toHaveBeenCalledTimes(2);
  });

  it("throws when tier limit is exceeded", async () => {
    // checkTierLimits: getOrgTier returns seedling, getScheduleCount returns 10 (at limit)
    dbMocks.__mockSelectWhere
      .mockReturnValueOnce({
        orderBy: dbMocks.__mockOrderBy,
        limit: dbMocks.__mockLimit,
      })
      .mockResolvedValueOnce([{ value: 10 }]);
    dbMocks.__mockLimit.mockResolvedValueOnce([{ tier: "seedling" }]);

    await expect(
      generateWeeklyBatch("org_1", ["instagram", "twitter"], "en"),
    ).rejects.toThrow("would exceed your seedling tier limit");
  });
});
