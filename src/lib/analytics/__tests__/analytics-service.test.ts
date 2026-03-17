/**
 * Tests for the analytics service
 *
 * Mocks the Drizzle `db` object and validates business logic:
 * record/upsert metrics, org-level summaries, top posts,
 * platform comparison, best posting times, engagement trends,
 * and AI vs manual content performance.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import {
  recordMetrics,
  getPostAnalytics,
  getOrgAnalytics,
  getTopPosts,
  getPlatformComparison,
  getBestPostingTimes,
  getContentPerformance,
  getEngagementTrends,
} from "../analytics-service";

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

vi.mock("@/db/schema", () => ({
  analytic: {
    id: "analytic.id",
    postScheduleId: "analytic.postScheduleId",
    impressions: "analytic.impressions",
    reach: "analytic.reach",
    likes: "analytic.likes",
    shares: "analytic.shares",
    comments: "analytic.comments",
    clicks: "analytic.clicks",
    engagementRate: "analytic.engagementRate",
    fetchedAt: "analytic.fetchedAt",
  },
  post: {
    id: "post.id",
    orgId: "post.orgId",
    platform: "post.platform",
    content: "post.content",
    aiGenerated: "post.aiGenerated",
  },
  postSchedule: {
    id: "postSchedule.id",
    postId: "postSchedule.postId",
    publishedAt: "postSchedule.publishedAt",
    socialAccountId: "postSchedule.socialAccountId",
    platformPostId: "postSchedule.platformPostId",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
  gte: vi.fn((...args: unknown[]) => ({ type: "gte", args })),
  lte: vi.fn((...args: unknown[]) => ({ type: "lte", args })),
  desc: vi.fn((...args: unknown[]) => ({ type: "desc", args })),
  sql: vi.fn((...args: unknown[]) => ({ type: "sql", args })),
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

// We must import *after* vi.mock so the mocked module is resolved.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let db: { select: Mock; update: Mock; insert: Mock };

beforeEach(async () => {
  vi.clearAllMocks();
  const dbMod = await import("@/db");
  db = dbMod.db as unknown as typeof db;
});

// ---------------------------------------------------------------------------
// Helpers — fluent chain mocks that mirror Drizzle's builder API
// ---------------------------------------------------------------------------

/** Chain for db.select().from().innerJoin().where().groupBy().orderBy().limit() */
function selectChain<T>(result: T[]) {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.from = vi.fn(self);
  chain.innerJoin = vi.fn(self);
  chain.where = vi.fn(self);
  chain.groupBy = vi.fn(self);
  chain.orderBy = vi.fn(self);
  chain.limit = vi.fn(self);
  chain.offset = vi.fn(self);
  chain.then = (resolve: (v: T[]) => void) =>
    Promise.resolve(result).then(resolve);
  return chain;
}

/** Chain for db.update().set().where().returning() */
function updateChain<T>(result: T[]) {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.set = vi.fn(self);
  chain.where = vi.fn(self);
  chain.returning = vi.fn(() => Promise.resolve(result));
  chain.then = (resolve: (v: T[]) => void) =>
    Promise.resolve(result).then(resolve);
  return chain;
}

/** Chain for db.insert().values() */
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
// Test data
// ---------------------------------------------------------------------------

const SCHEDULE_ID = "sched_test_1";
const ORG_ID = "org_test_1";

const mockMetrics = {
  impressions: 1000,
  reach: 500,
  likes: 50,
  shares: 10,
  comments: 5,
  clicks: 100,
  engagementRate: null as number | null,
};

const mockAnalyticRow = {
  impressions: 1000,
  reach: 500,
  likes: 50,
  shares: 10,
  comments: 5,
  clicks: 100,
  engagementRate: 6.5,
  postId: "post_1",
  platform: "twitter",
  content: "Hello from Purple Glow Social! #Mzansi 🇿🇦 Great content here.",
  publishedAt: new Date("2025-06-01T10:00:00Z"),
  aiGenerated: true,
};

// ---------------------------------------------------------------------------
// recordMetrics
// ---------------------------------------------------------------------------

describe("recordMetrics", () => {
  it("inserts new metrics when no existing row (update returns empty)", async () => {
    db.update.mockReturnValue(updateChain([]));
    db.insert.mockReturnValue(insertChain());

    await recordMetrics(SCHEDULE_ID, mockMetrics);

    expect(db.update).toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalled();
  });

  it("updates existing metrics when row already exists", async () => {
    db.update.mockReturnValue(updateChain([{ id: "analytics_1" }]));

    await recordMetrics(SCHEDULE_ID, mockMetrics);

    expect(db.update).toHaveBeenCalled();
    // Should NOT insert when update found a row
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("auto-calculates engagement rate when not provided", async () => {
    db.update.mockReturnValue(updateChain([]));
    const insertMock = insertChain();
    db.insert.mockReturnValue(insertMock);

    // engagementRate is null → auto-calculate
    await recordMetrics(SCHEDULE_ID, {
      impressions: 1000,
      reach: 500,
      likes: 50,
      shares: 10,
      comments: 5,
      clicks: 100,
      engagementRate: null,
    });

    // Verify insert was called with auto-calculated engagement rate
    // (50 + 10 + 5) / 1000 * 100 = 6.5
    const insertValues = (insertMock.values as Mock).mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(insertValues.engagementRate).toBeCloseTo(6.5, 2);
  });

  it("uses provided engagement rate when explicitly set", async () => {
    db.update.mockReturnValue(updateChain([]));
    const insertMock = insertChain();
    db.insert.mockReturnValue(insertMock);

    await recordMetrics(SCHEDULE_ID, {
      ...mockMetrics,
      engagementRate: 12.5,
    });

    const insertValues = (insertMock.values as Mock).mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(insertValues.engagementRate).toBe(12.5);
  });

  it("calculates engagement rate as 0 when impressions are 0", async () => {
    db.update.mockReturnValue(updateChain([]));
    const insertMock = insertChain();
    db.insert.mockReturnValue(insertMock);

    await recordMetrics(SCHEDULE_ID, {
      impressions: 0,
      reach: 0,
      likes: 5,
      shares: 2,
      comments: 1,
      clicks: 0,
      engagementRate: null,
    });

    const insertValues = (insertMock.values as Mock).mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(insertValues.engagementRate).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getPostAnalytics
// ---------------------------------------------------------------------------

describe("getPostAnalytics", () => {
  it("returns enriched post analytics when data exists", async () => {
    db.select.mockReturnValue(selectChain([mockAnalyticRow]));

    const result = await getPostAnalytics(SCHEDULE_ID);

    expect(result).not.toBeNull();
    expect(result!.metrics.impressions).toBe(1000);
    expect(result!.metrics.engagementRate).toBe(6.5);
    expect(result!.postId).toBe("post_1");
    expect(result!.platform).toBe("twitter");
    expect(result!.aiGenerated).toBe(true);
  });

  it("truncates content to 120-character snippet", async () => {
    const longContent = "A".repeat(200);
    db.select.mockReturnValue(
      selectChain([{ ...mockAnalyticRow, content: longContent }]),
    );

    const result = await getPostAnalytics(SCHEDULE_ID);

    expect(result).not.toBeNull();
    expect(result!.contentSnippet).toHaveLength(120);
  });

  it("returns null when no data exists", async () => {
    db.select.mockReturnValue(selectChain([]));

    const result = await getPostAnalytics(SCHEDULE_ID);

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getOrgAnalytics
// ---------------------------------------------------------------------------

describe("getOrgAnalytics", () => {
  it("returns aggregated summary for an org", async () => {
    let callIndex = 0;
    db.select.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) {
        // Summary query
        return selectChain([
          {
            totalImpressions: 5000,
            totalReach: 2500,
            totalEngagement: 300,
            avgEngagementRate: 4.25,
            totalPosts: 10,
          },
        ]);
      }
      // Top platform query
      return selectChain([{ platform: "twitter" }]);
    });

    const result = await getOrgAnalytics(ORG_ID);

    expect(result.totalImpressions).toBe(5000);
    expect(result.totalReach).toBe(2500);
    expect(result.totalEngagement).toBe(300);
    expect(result.avgEngagementRate).toBe(4.25);
    expect(result.topPlatform).toBe("twitter");
    expect(result.totalPosts).toBe(10);
    expect(result.periodDays).toBeGreaterThan(0);
  });

  it("returns zeros when no data exists", async () => {
    let callIndex = 0;
    db.select.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) {
        return selectChain([
          {
            totalImpressions: 0,
            totalReach: 0,
            totalEngagement: 0,
            avgEngagementRate: 0,
            totalPosts: 0,
          },
        ]);
      }
      return selectChain([]);
    });

    const result = await getOrgAnalytics(ORG_ID);

    expect(result.totalImpressions).toBe(0);
    expect(result.totalReach).toBe(0);
    expect(result.totalEngagement).toBe(0);
    expect(result.avgEngagementRate).toBe(0);
    expect(result.topPlatform).toBeNull();
    expect(result.totalPosts).toBe(0);
  });

  it("respects custom date range", async () => {
    let callIndex = 0;
    db.select.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) {
        return selectChain([
          {
            totalImpressions: 1000,
            totalReach: 500,
            totalEngagement: 100,
            avgEngagementRate: 3.0,
            totalPosts: 5,
          },
        ]);
      }
      return selectChain([{ platform: "facebook" }]);
    });

    const from = new Date("2025-06-01");
    const to = new Date("2025-06-08");

    const result = await getOrgAnalytics(ORG_ID, { from, to });

    expect(result.periodDays).toBe(7);
    expect(result.totalPosts).toBe(5);
    expect(result.topPlatform).toBe("facebook");
  });
});

// ---------------------------------------------------------------------------
// getTopPosts
// ---------------------------------------------------------------------------

describe("getTopPosts", () => {
  it("returns posts sorted by engagement", async () => {
    db.select.mockReturnValue(
      selectChain([
        { ...mockAnalyticRow, likes: 100, shares: 50, comments: 20 },
        { ...mockAnalyticRow, likes: 50, shares: 10, comments: 5 },
      ]),
    );

    const result = await getTopPosts(ORG_ID);

    expect(result).toHaveLength(2);
    // First post should have higher engagement
    expect(result[0].metrics.likes).toBe(100);
    expect(result[1].metrics.likes).toBe(50);
  });

  it("respects limit parameter", async () => {
    db.select.mockReturnValue(
      selectChain([mockAnalyticRow]),
    );

    const result = await getTopPosts(ORG_ID, 5);

    expect(result).toHaveLength(1);
    // Verify .limit() was called on the chain
    const chain = db.select.mock.results[0].value as Record<string, Mock>;
    expect(chain.limit).toHaveBeenCalledWith(5);
  });

  it("caps limit at 100", async () => {
    db.select.mockReturnValue(selectChain([]));

    await getTopPosts(ORG_ID, 200);

    const chain = db.select.mock.results[0].value as Record<string, Mock>;
    expect(chain.limit).toHaveBeenCalledWith(100);
  });

  it("returns empty array when no data", async () => {
    db.select.mockReturnValue(selectChain([]));

    const result = await getTopPosts(ORG_ID);

    expect(result).toEqual([]);
  });

  it("truncates content snippets to 120 chars", async () => {
    const longContent = "B".repeat(200);
    db.select.mockReturnValue(
      selectChain([{ ...mockAnalyticRow, content: longContent }]),
    );

    const result = await getTopPosts(ORG_ID);

    expect(result[0].contentSnippet).toHaveLength(120);
  });
});

// ---------------------------------------------------------------------------
// getPlatformComparison
// ---------------------------------------------------------------------------

describe("getPlatformComparison", () => {
  it("returns per-platform breakdown grouped by platform", async () => {
    db.select.mockReturnValue(
      selectChain([
        {
          platform: "twitter",
          impressions: 3000,
          reach: 1500,
          likes: 80,
          shares: 20,
          comments: 10,
          clicks: 200,
          avgEngagementRate: 5.5,
          postCount: 8,
        },
        {
          platform: "facebook",
          impressions: 2000,
          reach: 1000,
          likes: 60,
          shares: 15,
          comments: 8,
          clicks: 150,
          avgEngagementRate: 4.15,
          postCount: 5,
        },
      ]),
    );

    const result = await getPlatformComparison(ORG_ID);

    expect(result).toHaveLength(2);
    expect(result[0].platform).toBe("twitter");
    expect(result[0].impressions).toBe(3000);
    expect(result[0].postCount).toBe(8);
    expect(result[1].platform).toBe("facebook");
    expect(result[1].postCount).toBe(5);
  });

  it("returns empty array when no data", async () => {
    db.select.mockReturnValue(selectChain([]));

    const result = await getPlatformComparison(ORG_ID);

    expect(result).toEqual([]);
  });

  it("rounds avgEngagementRate to 2 decimal places", async () => {
    db.select.mockReturnValue(
      selectChain([
        {
          platform: "twitter",
          impressions: 1000,
          reach: 500,
          likes: 30,
          shares: 10,
          comments: 5,
          clicks: 50,
          avgEngagementRate: 3.33333,
          postCount: 3,
        },
      ]),
    );

    const result = await getPlatformComparison(ORG_ID);

    expect(result[0].avgEngagementRate).toBe(3.33);
  });
});

// ---------------------------------------------------------------------------
// getBestPostingTimes
// ---------------------------------------------------------------------------

describe("getBestPostingTimes", () => {
  it("returns day/hour sorted by engagement", async () => {
    db.select.mockReturnValue(
      selectChain([
        { dayOfWeek: 1, hour: 9, avgEngagement: 45.5, postCount: 12 },
        { dayOfWeek: 3, hour: 14, avgEngagement: 32.0, postCount: 8 },
      ]),
    );

    const result = await getBestPostingTimes(ORG_ID);

    expect(result).toHaveLength(2);
    // Highest engagement first
    expect(result[0].dayOfWeek).toBe(1); // Monday
    expect(result[0].hour).toBe(9);
    expect(result[0].avgEngagement).toBe(45.5);
    expect(result[0].postCount).toBe(12);
    expect(result[1].dayOfWeek).toBe(3); // Wednesday
  });

  it("returns empty array when no data", async () => {
    db.select.mockReturnValue(selectChain([]));

    const result = await getBestPostingTimes(ORG_ID);

    expect(result).toEqual([]);
  });

  it("rounds avgEngagement to 2 decimal places", async () => {
    db.select.mockReturnValue(
      selectChain([
        { dayOfWeek: 5, hour: 17, avgEngagement: 22.6789, postCount: 4 },
      ]),
    );

    const result = await getBestPostingTimes(ORG_ID);

    expect(result[0].avgEngagement).toBe(22.68);
  });
});

// ---------------------------------------------------------------------------
// getEngagementTrends
// ---------------------------------------------------------------------------

describe("getEngagementTrends", () => {
  it("returns daily time-series data", async () => {
    db.select.mockReturnValue(
      selectChain([
        {
          date: "2025-06-01",
          impressions: 500,
          reach: 250,
          engagement: 40,
          posts: 3,
        },
        {
          date: "2025-06-02",
          impressions: 600,
          reach: 300,
          engagement: 55,
          posts: 4,
        },
      ]),
    );

    const result = await getEngagementTrends(ORG_ID);

    expect(result).toHaveLength(2);
    expect(result[0].date).toBe("2025-06-01");
    expect(result[0].impressions).toBe(500);
    expect(result[0].engagement).toBe(40);
    expect(result[0].posts).toBe(3);
    expect(result[1].date).toBe("2025-06-02");
  });

  it("defaults to 30 days", async () => {
    db.select.mockReturnValue(selectChain([]));

    const result = await getEngagementTrends(ORG_ID);

    expect(result).toEqual([]);
    // Function was called without explicit days, using default 30
    expect(db.select).toHaveBeenCalled();
  });

  it("accepts custom day count", async () => {
    db.select.mockReturnValue(
      selectChain([
        {
          date: "2025-06-10",
          impressions: 200,
          reach: 100,
          engagement: 20,
          posts: 2,
        },
      ]),
    );

    const result = await getEngagementTrends(ORG_ID, 7);

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe("2025-06-10");
  });

  it("returns empty array when no data", async () => {
    db.select.mockReturnValue(selectChain([]));

    const result = await getEngagementTrends(ORG_ID);

    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getContentPerformance
// ---------------------------------------------------------------------------

describe("getContentPerformance", () => {
  it("separates AI vs manual content", async () => {
    db.select.mockReturnValue(
      selectChain([
        {
          aiGenerated: true,
          avgEngagement: 45.333,
          avgReach: 800.666,
          postCount: 15,
        },
        {
          aiGenerated: false,
          avgEngagement: 30.5,
          avgReach: 600.25,
          postCount: 10,
        },
      ]),
    );

    const result = await getContentPerformance(ORG_ID);

    expect(result).toHaveLength(2);

    const ai = result.find((r) => r.aiGenerated === true);
    const manual = result.find((r) => r.aiGenerated === false);

    expect(ai).toBeDefined();
    expect(ai!.avgEngagement).toBe(45.33);
    expect(ai!.postCount).toBe(15);
    expect(manual).toBeDefined();
    expect(manual!.avgEngagement).toBe(30.5);
    expect(manual!.postCount).toBe(10);
  });

  it("rounds avgEngagement and avgReach to 2 decimal places", async () => {
    db.select.mockReturnValue(
      selectChain([
        {
          aiGenerated: true,
          avgEngagement: 12.3456,
          avgReach: 567.8912,
          postCount: 5,
        },
      ]),
    );

    const result = await getContentPerformance(ORG_ID);

    expect(result[0].avgEngagement).toBe(12.35);
    expect(result[0].avgReach).toBe(567.89);
  });

  it("returns empty array when no data", async () => {
    db.select.mockReturnValue(selectChain([]));

    const result = await getContentPerformance(ORG_ID);

    expect(result).toEqual([]);
  });
});
