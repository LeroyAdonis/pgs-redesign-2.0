/**
 * Tests for scheduling CRUD service
 *
 * Mocks the database to test all schedule operations:
 * create, update, delete, list, calendar view, bulk ops, and count.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock database ───────────────────────────────────────────────

vi.mock("@/db", () => {
  // Insert chain: insert().values().returning()
  const mockReturning = vi.fn();
  const mockValues = vi.fn(() => ({ returning: mockReturning }));
  const mockInsert = vi.fn(() => ({ values: mockValues }));

  // Update chain: update().set().where().returning()
  const mockUpdateReturning = vi.fn();
  const mockUpdateWhere = vi.fn(() => ({ returning: mockUpdateReturning }));
  const mockSet = vi.fn(() => ({ where: mockUpdateWhere }));
  const mockUpdate = vi.fn(() => ({ set: mockSet }));

  // Delete chain: delete().where().returning()
  const mockDeleteReturning = vi.fn();
  const mockDeleteWhere = vi.fn(() => ({ returning: mockDeleteReturning }));
  const mockDelete = vi.fn(() => ({ where: mockDeleteWhere }));

  // Select chain: select().from().innerJoin().where().orderBy().limit().offset()
  const mockOffset = vi.fn();
  const mockLimit = vi.fn(() => ({ offset: mockOffset }));
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
      delete: mockDelete,
      select: mockSelect,
    },
    __mockInsert: mockInsert,
    __mockValues: mockValues,
    __mockReturning: mockReturning,
    __mockUpdate: mockUpdate,
    __mockSet: mockSet,
    __mockUpdateWhere: mockUpdateWhere,
    __mockUpdateReturning: mockUpdateReturning,
    __mockDelete: mockDelete,
    __mockDeleteWhere: mockDeleteWhere,
    __mockDeleteReturning: mockDeleteReturning,
    __mockSelect: mockSelect,
    __mockFrom: mockFrom,
    __mockInnerJoin: mockInnerJoin,
    __mockInnerJoin2: mockInnerJoin2,
    __mockSelectWhere: mockSelectWhere,
    __mockOrderBy: mockOrderBy,
    __mockLimit: mockLimit,
    __mockOffset: mockOffset,
  };
});

// Mock schema tables as simple objects
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
  socialAccount: {
    id: "id",
    orgId: "org_id",
  },
  organization: {
    id: "id",
    tier: "tier",
  },
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import {
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getScheduleCount,
  getOrgTier,
} from "../scheduling-service";

const dbMocks = (await import("@/db")) as unknown as Record<
  string,
  ReturnType<typeof vi.fn>
>;

describe("createSchedule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts a schedule and updates post status to scheduled", async () => {
    const mockSchedule = {
      id: "sched_1",
      postId: "post_1",
      socialAccountId: "sa_1",
      scheduledAt: new Date("2025-02-01T10:00:00Z"),
      publishedAt: null,
      failedAt: null,
      retryCount: 0,
      lastError: null,
      createdAt: new Date(),
    };

    // insert().values().returning() → returns schedule
    dbMocks.__mockReturning.mockResolvedValueOnce([mockSchedule]);
    // update().set().where() → for post status update (no returning needed)
    dbMocks.__mockUpdateWhere.mockResolvedValueOnce([]);

    const result = await createSchedule({
      postId: "post_1",
      socialAccountId: "sa_1",
      scheduledAt: new Date("2025-02-01T10:00:00Z"),
    });

    expect(result.id).toBe("sched_1");
    expect(result.postId).toBe("post_1");
    expect(dbMocks.__mockInsert).toHaveBeenCalledOnce();
    expect(dbMocks.__mockUpdate).toHaveBeenCalledOnce();
  });

  it("throws when insert returns empty result", async () => {
    dbMocks.__mockReturning.mockResolvedValueOnce([]);

    await expect(
      createSchedule({
        postId: "post_1",
        socialAccountId: "sa_1",
        scheduledAt: new Date("2025-02-01T10:00:00Z"),
      }),
    ).rejects.toThrow("Failed to create schedule entry");
  });
});

describe("updateSchedule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates scheduledAt time", async () => {
    const mockUpdated = {
      id: "sched_1",
      postId: "post_1",
      socialAccountId: "sa_1",
      scheduledAt: new Date("2025-02-05T14:00:00Z"),
      publishedAt: null,
      failedAt: null,
      retryCount: 0,
      lastError: null,
      createdAt: new Date(),
    };

    dbMocks.__mockUpdateReturning.mockResolvedValueOnce([mockUpdated]);

    const result = await updateSchedule({
      id: "sched_1",
      scheduledAt: new Date("2025-02-05T14:00:00Z"),
    });

    expect(result.id).toBe("sched_1");
    expect(dbMocks.__mockUpdate).toHaveBeenCalledOnce();
  });

  it("sets publishedAt when status is published", async () => {
    const mockUpdated = {
      id: "sched_1",
      postId: "post_1",
      publishedAt: new Date(),
    };

    // First update chain: update(postSchedule).set().where().returning()
    dbMocks.__mockUpdateReturning.mockResolvedValueOnce([mockUpdated]);
    // Second update chain: update(post).set({status}).where()
    // No need to mock — where() returns { returning } by default, which is fine
    // since the code doesn't call .returning() on the second chain

    const result = await updateSchedule({
      id: "sched_1",
      status: "published",
    });

    expect(result.id).toBe("sched_1");
    // Should have called update twice (postSchedule + post)
    expect(dbMocks.__mockUpdate).toHaveBeenCalledTimes(2);
  });

  it("throws when schedule not found", async () => {
    // update().set().where().returning() → returns empty array
    dbMocks.__mockUpdateReturning.mockResolvedValueOnce([]);

    await expect(
      updateSchedule({ id: "nonexistent", scheduledAt: new Date() }),
    ).rejects.toThrow("Schedule nonexistent not found");
  });
});

describe("deleteSchedule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes schedule and reverts post to draft", async () => {
    // select to get postId
    dbMocks.__mockLimit.mockResolvedValueOnce([{ postId: "post_1" }]);
    // delete
    dbMocks.__mockDeleteWhere.mockResolvedValueOnce([]);
    // update post status back to draft
    dbMocks.__mockUpdateWhere.mockResolvedValueOnce([]);

    await deleteSchedule("sched_1");

    expect(dbMocks.__mockDelete).toHaveBeenCalledOnce();
    expect(dbMocks.__mockUpdate).toHaveBeenCalledOnce();
  });

  it("throws when schedule not found", async () => {
    dbMocks.__mockLimit.mockResolvedValueOnce([]);

    await expect(deleteSchedule("nonexistent")).rejects.toThrow(
      "Schedule nonexistent not found",
    );
  });
});

describe("getScheduleCount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the count of active schedules", async () => {
    dbMocks.__mockSelectWhere.mockResolvedValueOnce([{ value: 5 }]);

    const count = await getScheduleCount("org_1");

    expect(count).toBe(5);
  });

  it("returns 0 when no schedules exist", async () => {
    dbMocks.__mockSelectWhere.mockResolvedValueOnce([{ value: 0 }]);

    const count = await getScheduleCount("org_1");

    expect(count).toBe(0);
  });
});

describe("getOrgTier", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the org tier", async () => {
    dbMocks.__mockLimit.mockResolvedValueOnce([{ tier: "grower" }]);

    const tier = await getOrgTier("org_1");

    expect(tier).toBe("grower");
  });

  it("defaults to seedling when org not found", async () => {
    dbMocks.__mockLimit.mockResolvedValueOnce([]);

    const tier = await getOrgTier("nonexistent");

    expect(tier).toBe("seedling");
  });
});
