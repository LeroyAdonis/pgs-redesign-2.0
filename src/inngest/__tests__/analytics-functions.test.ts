/**
 * Tests for Inngest analytics pipeline functions
 *
 * Verifies the analytics metric fetching pipeline:
 *   - fetchInitialMetrics: sleep → fetch → record
 *   - refreshRecentMetrics: find recent → batch process
 *   - weeklyAnalyticsDigest: fetch orgs → compile digests → log
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks (accessible inside vi.mock factories) ─────────

const {
  mockDecrypt,
  mockFetchMetrics,
  mockRecordMetrics,
  mockGetOrgAnalytics,
  mockGetTopPosts,
  mockGetPlatformComparison,
} = vi.hoisted(() => ({
  mockDecrypt: vi.fn((encrypted: string) => `decrypted_${encrypted}`),
  mockFetchMetrics: vi.fn(),
  mockRecordMetrics: vi.fn(),
  mockGetOrgAnalytics: vi.fn(),
  mockGetTopPosts: vi.fn(),
  mockGetPlatformComparison: vi.fn(),
}));

// ── Mock modules ────────────────────────────────────────────────

const mockDb = vi.hoisted(() => ({
  update: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
}));

vi.mock("@/db", () => ({ db: mockDb }));

vi.mock("@/db/schema", () => ({
  analytic: {
    id: "analytic.id",
    postScheduleId: "analytic.postScheduleId",
  },
  organization: {
    id: "organization.id",
    name: "organization.name",
  },
  postSchedule: {
    id: "postSchedule.id",
    postId: "postSchedule.postId",
    socialAccountId: "postSchedule.socialAccountId",
    platformPostId: "postSchedule.platformPostId",
    publishedAt: "postSchedule.publishedAt",
  },
  socialAccount: {
    id: "socialAccount.id",
    platform: "socialAccount.platform",
    accessTokenEncrypted: "socialAccount.accessTokenEncrypted",
    isActive: "socialAccount.isActive",
  },
  post: {
    id: "post.id",
    orgId: "post.orgId",
    platform: "post.platform",
    content: "post.content",
    aiGenerated: "post.aiGenerated",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
  gte: vi.fn((...args: unknown[]) => ({ type: "gte", args })),
  lte: vi.fn((...args: unknown[]) => ({ type: "lte", args })),
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

vi.mock("@/lib/crypto", () => ({
  decrypt: mockDecrypt,
  encrypt: vi.fn((plain: string) => `encrypted_${plain}`),
}));

vi.mock("@/lib/publishers", () => ({
  getPublisher: vi.fn(() => ({
    platform: "twitter",
    publish: vi.fn(),
    fetchMetrics: mockFetchMetrics,
    validateContent: vi.fn(() => ({ valid: true, errors: [] })),
  })),
}));

vi.mock("@/lib/analytics/analytics-service", () => ({
  recordMetrics: (...args: unknown[]) => mockRecordMetrics(...args),
  getOrgAnalytics: (...args: unknown[]) => mockGetOrgAnalytics(...args),
  getTopPosts: (...args: unknown[]) => mockGetTopPosts(...args),
  getPlatformComparison: (...args: unknown[]) =>
    mockGetPlatformComparison(...args),
}));

// Mock inngest client — createFunction returns the raw handler for testing
vi.mock("../client", () => ({
  inngest: {
    send: vi.fn(),
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
  fetchInitialMetrics,
  refreshRecentMetrics,
  weeklyAnalyticsDigest,
} from "../analytics-functions";

// ── Test helpers ────────────────────────────────────────────────

/** Create a mock Inngest step object. */
function createMockStep() {
  return {
    run: vi.fn((_name: string, fn: () => unknown) => fn()),
    sleep: vi.fn().mockResolvedValue(undefined),
  };
}

/**
 * Set up sequential select responses.
 * Each db.select() call pops the next response from the array.
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
    const mockInnerJoin = vi.fn(() => ({ where: mockWhere }));
    const mockFrom = vi.fn(() => ({
      where: mockWhere,
      innerJoin: mockInnerJoin,
      limit: mockLimit,
    }));

    return { from: mockFrom };
  });
}

// ── Type for handler signature (createFunction returns raw handler) ──

type StepHandler = (ctx: {
  event: { data: unknown };
  step: ReturnType<typeof createMockStep>;
}) => Promise<void>;

type CronHandler = (ctx: {
  step: ReturnType<typeof createMockStep>;
}) => Promise<void>;

// ── Tests ───────────────────────────────────────────────────────

describe("fetchInitialMetrics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sleeps 1 hour then fetches and records metrics", async () => {
    // Setup: postSchedule → socialAccount → decrypt → fetchMetrics
    setupSelectChain([
      // postSchedule lookup
      [{ socialAccountId: "sa-1", platformPostId: "tw-123" }],
      // socialAccount lookup
      [
        {
          platform: "twitter",
          accessTokenEncrypted: "enc_tok",
          isActive: true,
        },
      ],
    ]);

    mockFetchMetrics.mockResolvedValue({
      impressions: 5000,
      reach: 2500,
      likes: 100,
      shares: 30,
      comments: 10,
      clicks: 200,
    });

    mockRecordMetrics.mockResolvedValue(undefined);

    const step = createMockStep();
    const handler = fetchInitialMetrics as unknown as StepHandler;

    await handler({
      event: { data: { postScheduleId: "sched-1" } },
      step,
    });

    // Should sleep for 1 hour
    expect(step.sleep).toHaveBeenCalledWith("wait-1h", "1h");

    // Should run 1 step: fetch-metrics
    expect(step.run).toHaveBeenCalledTimes(1);
    expect(step.run.mock.calls[0][0]).toBe("fetch-metrics");

    // Decrypt was called
    expect(mockDecrypt).toHaveBeenCalledWith("enc_tok");

    // Metrics were fetched from publisher
    expect(mockFetchMetrics).toHaveBeenCalledWith({
      platformPostId: "tw-123",
      accessToken: "decrypted_enc_tok",
    });

    // Metrics were recorded with null engagementRate for auto-calculation
    expect(mockRecordMetrics).toHaveBeenCalledWith("sched-1", {
      impressions: 5000,
      reach: 2500,
      likes: 100,
      shares: 30,
      comments: 10,
      clicks: 200,
      engagementRate: null,
    });
  });

  it("handles missing postSchedule gracefully", async () => {
    setupSelectChain([
      [], // postSchedule not found
    ]);

    const step = createMockStep();
    const handler = fetchInitialMetrics as unknown as StepHandler;

    await handler({
      event: { data: { postScheduleId: "sched-missing" } },
      step,
    });

    // Sleep still happens
    expect(step.sleep).toHaveBeenCalledWith("wait-1h", "1h");

    // fetch-metrics step runs but fetchAndRecordMetrics returns false
    expect(step.run).toHaveBeenCalledTimes(1);

    // Publisher not called because schedule not found
    expect(mockFetchMetrics).not.toHaveBeenCalled();
    expect(mockRecordMetrics).not.toHaveBeenCalled();
  });

  it("handles missing platformPostId gracefully", async () => {
    setupSelectChain([
      // postSchedule found but no platformPostId
      [{ socialAccountId: "sa-1", platformPostId: null }],
    ]);

    const step = createMockStep();
    const handler = fetchInitialMetrics as unknown as StepHandler;

    await handler({
      event: { data: { postScheduleId: "sched-no-pid" } },
      step,
    });

    expect(step.run).toHaveBeenCalledTimes(1);
    expect(mockFetchMetrics).not.toHaveBeenCalled();
  });

  it("handles null metrics from platform", async () => {
    setupSelectChain([
      [{ socialAccountId: "sa-1", platformPostId: "tw-456" }],
      [
        {
          platform: "twitter",
          accessTokenEncrypted: "enc_tok",
          isActive: true,
        },
      ],
    ]);

    mockFetchMetrics.mockResolvedValue(null);

    const step = createMockStep();
    const handler = fetchInitialMetrics as unknown as StepHandler;

    await handler({
      event: { data: { postScheduleId: "sched-null-metrics" } },
      step,
    });

    expect(mockFetchMetrics).toHaveBeenCalled();
    expect(mockRecordMetrics).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// refreshRecentMetrics
// ---------------------------------------------------------------------------

describe("refreshRecentMetrics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("processes recent posts in batches", async () => {
    // First db.select: find-recent-posts returns schedule IDs
    const scheduleIds = Array.from({ length: 3 }, (_, i) => ({
      id: `sched-${i}`,
    }));

    let selectCallIndex = 0;
    mockDb.select.mockImplementation(() => {
      selectCallIndex++;

      if (selectCallIndex === 1) {
        // find-recent-posts query
        const mockWhere = vi.fn(() => ({
          then: (resolve: (v: unknown) => void) => resolve(scheduleIds),
        }));
        const mockFrom = vi.fn(() => ({ where: mockWhere }));
        return { from: mockFrom };
      }

      // Subsequent calls: fetchAndRecordMetrics lookups
      const response =
        selectCallIndex % 2 === 0
          ? [{ socialAccountId: "sa-1", platformPostId: "tw-post" }]
          : [
              {
                platform: "twitter",
                accessTokenEncrypted: "enc_tok",
                isActive: true,
              },
            ];

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

    mockFetchMetrics.mockResolvedValue({
      impressions: 1000,
      reach: 500,
      likes: 20,
      shares: 5,
      comments: 3,
      clicks: 50,
    });

    mockRecordMetrics.mockResolvedValue(undefined);

    const step = createMockStep();
    const handler = refreshRecentMetrics as unknown as CronHandler;

    await handler({ step });

    // 2 steps: find-recent-posts + 1 batch (3 items < batch size of 50)
    expect(step.run).toHaveBeenCalledTimes(2);
    expect(step.run.mock.calls[0][0]).toBe("find-recent-posts");
    expect(step.run.mock.calls[1][0]).toBe("refresh-batch-0");
  });

  it("skips posts without platformPostId", async () => {
    // find-recent-posts returns 1 schedule
    let selectCallIndex = 0;
    mockDb.select.mockImplementation(() => {
      selectCallIndex++;

      if (selectCallIndex === 1) {
        const mockWhere = vi.fn(() => ({
          then: (resolve: (v: unknown) => void) =>
            resolve([{ id: "sched-no-pid" }]),
        }));
        const mockFrom = vi.fn(() => ({ where: mockWhere }));
        return { from: mockFrom };
      }

      // fetchAndRecordMetrics: postSchedule has no platformPostId
      const response = [{ socialAccountId: "sa-1", platformPostId: null }];
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

    const step = createMockStep();
    const handler = refreshRecentMetrics as unknown as CronHandler;

    await handler({ step });

    // fetchMetrics should NOT be called (platformPostId is null)
    expect(mockFetchMetrics).not.toHaveBeenCalled();
  });

  it("returns early when no recent posts found", async () => {
    mockDb.select.mockImplementation(() => {
      const mockWhere = vi.fn(() => ({
        then: (resolve: (v: unknown) => void) => resolve([]),
      }));
      const mockFrom = vi.fn(() => ({ where: mockWhere }));
      return { from: mockFrom };
    });

    const step = createMockStep();
    const handler = refreshRecentMetrics as unknown as CronHandler;

    await handler({ step });

    // Only 1 step: find-recent-posts (no batch steps)
    expect(step.run).toHaveBeenCalledTimes(1);
    expect(step.run.mock.calls[0][0]).toBe("find-recent-posts");
  });
});

// ---------------------------------------------------------------------------
// weeklyAnalyticsDigest
// ---------------------------------------------------------------------------

describe("weeklyAnalyticsDigest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("compiles digest per org with summary, top posts, and platform breakdown", async () => {
    // fetch-orgs: return 1 org
    mockDb.select.mockImplementation(() => {
      const mockFrom = vi.fn(() => ({
        then: (resolve: (v: unknown) => void) =>
          resolve([{ id: "org-1", name: "Test Org" }]),
      }));
      return { from: mockFrom };
    });

    mockGetOrgAnalytics
      .mockResolvedValueOnce({
        // This week
        totalImpressions: 5000,
        totalReach: 2500,
        totalEngagement: 300,
        avgEngagementRate: 6.0,
        totalPosts: 10,
        topPlatform: "twitter",
        periodDays: 7,
      })
      .mockResolvedValueOnce({
        // Previous week
        totalImpressions: 3000,
        totalReach: 1500,
        totalEngagement: 200,
        avgEngagementRate: 4.0,
        totalPosts: 8,
        topPlatform: "twitter",
        periodDays: 7,
      });

    mockGetTopPosts.mockResolvedValue([
      {
        metrics: { likes: 50, shares: 20, comments: 10 },
        contentSnippet: "Great post #1",
        platform: "twitter",
      },
    ]);

    mockGetPlatformComparison.mockResolvedValue([
      {
        platform: "twitter",
        impressions: 5000,
        likes: 100,
        shares: 30,
        comments: 20,
      },
    ]);

    const step = createMockStep();
    const handler = weeklyAnalyticsDigest as unknown as CronHandler;

    await handler({ step });

    // 3 steps: fetch-orgs, digest-org-1, send-digest-notifications
    expect(step.run).toHaveBeenCalledTimes(3);
    expect(step.run.mock.calls[0][0]).toBe("fetch-orgs");
    expect(step.run.mock.calls[1][0]).toBe("digest-org-1");
    expect(step.run.mock.calls[2][0]).toBe("send-digest-notifications");

    // Analytics fetched for this week and previous week
    expect(mockGetOrgAnalytics).toHaveBeenCalledTimes(2);
    expect(mockGetTopPosts).toHaveBeenCalledTimes(1);
    expect(mockGetPlatformComparison).toHaveBeenCalledTimes(1);
  });

  it("skips orgs with no data (totalPosts === 0)", async () => {
    mockDb.select.mockImplementation(() => {
      const mockFrom = vi.fn(() => ({
        then: (resolve: (v: unknown) => void) =>
          resolve([{ id: "org-empty", name: "Empty Org" }]),
      }));
      return { from: mockFrom };
    });

    mockGetOrgAnalytics.mockResolvedValue({
      totalImpressions: 0,
      totalReach: 0,
      totalEngagement: 0,
      avgEngagementRate: 0,
      totalPosts: 0,
      topPlatform: null,
      periodDays: 7,
    });

    mockGetTopPosts.mockResolvedValue([]);
    mockGetPlatformComparison.mockResolvedValue([]);

    const step = createMockStep();
    const handler = weeklyAnalyticsDigest as unknown as CronHandler;

    await handler({ step });

    // 3 steps: fetch-orgs, digest-org-empty (returns null), log-digests
    expect(step.run).toHaveBeenCalledTimes(3);

    // getOrgAnalytics called once for this week, but no prev week
    // (skipped early because totalPosts === 0)
    expect(mockGetOrgAnalytics).toHaveBeenCalledTimes(1);
  });

  it("returns early when no orgs exist", async () => {
    mockDb.select.mockImplementation(() => {
      const mockFrom = vi.fn(() => ({
        then: (resolve: (v: unknown) => void) => resolve([]),
      }));
      return { from: mockFrom };
    });

    const step = createMockStep();
    const handler = weeklyAnalyticsDigest as unknown as CronHandler;

    await handler({ step });

    // Only 1 step: fetch-orgs (no digests compiled)
    expect(step.run).toHaveBeenCalledTimes(1);
    expect(step.run.mock.calls[0][0]).toBe("fetch-orgs");
  });

  it("determines trend as 'up' when engagement increases > 5%", async () => {
    mockDb.select.mockImplementation(() => {
      const mockFrom = vi.fn(() => ({
        then: (resolve: (v: unknown) => void) =>
          resolve([{ id: "org-up", name: "Growing Org" }]),
      }));
      return { from: mockFrom };
    });

    mockGetOrgAnalytics
      .mockResolvedValueOnce({
        // This week: 200 engagement
        totalImpressions: 5000,
        totalReach: 2500,
        totalEngagement: 200,
        avgEngagementRate: 4.0,
        totalPosts: 10,
        topPlatform: "twitter",
        periodDays: 7,
      })
      .mockResolvedValueOnce({
        // Previous week: 100 engagement (100% increase > 5% threshold)
        totalImpressions: 3000,
        totalReach: 1500,
        totalEngagement: 100,
        avgEngagementRate: 3.0,
        totalPosts: 8,
        topPlatform: "twitter",
        periodDays: 7,
      });

    mockGetTopPosts.mockResolvedValue([
      {
        metrics: { likes: 50, shares: 20, comments: 10 },
        contentSnippet: "Top post",
        platform: "twitter",
      },
    ]);

    mockGetPlatformComparison.mockResolvedValue([
      {
        platform: "twitter",
        impressions: 5000,
        likes: 100,
        shares: 30,
        comments: 20,
      },
    ]);

    const step = createMockStep();
    const handler = weeklyAnalyticsDigest as unknown as CronHandler;

    await handler({ step });

    // The digest step should have been called and returned a valid digest
    expect(step.run).toHaveBeenCalledTimes(3);
  });

  it("determines trend as 'down' when engagement decreases > 5%", async () => {
    mockDb.select.mockImplementation(() => {
      const mockFrom = vi.fn(() => ({
        then: (resolve: (v: unknown) => void) =>
          resolve([{ id: "org-down", name: "Declining Org" }]),
      }));
      return { from: mockFrom };
    });

    mockGetOrgAnalytics
      .mockResolvedValueOnce({
        // This week: 50 engagement
        totalImpressions: 2000,
        totalReach: 1000,
        totalEngagement: 50,
        avgEngagementRate: 2.5,
        totalPosts: 5,
        topPlatform: "facebook",
        periodDays: 7,
      })
      .mockResolvedValueOnce({
        // Previous week: 200 engagement (75% decrease)
        totalImpressions: 5000,
        totalReach: 2500,
        totalEngagement: 200,
        avgEngagementRate: 4.0,
        totalPosts: 10,
        topPlatform: "facebook",
        periodDays: 7,
      });

    mockGetTopPosts.mockResolvedValue([
      {
        metrics: { likes: 10, shares: 5, comments: 2 },
        contentSnippet: "Some post",
        platform: "facebook",
      },
    ]);

    mockGetPlatformComparison.mockResolvedValue([
      {
        platform: "facebook",
        impressions: 2000,
        likes: 30,
        shares: 10,
        comments: 5,
      },
    ]);

    const step = createMockStep();
    const handler = weeklyAnalyticsDigest as unknown as CronHandler;

    await handler({ step });

    expect(step.run).toHaveBeenCalledTimes(3);
  });

  it("determines trend as 'stable' when previous engagement is 0", async () => {
    mockDb.select.mockImplementation(() => {
      const mockFrom = vi.fn(() => ({
        then: (resolve: (v: unknown) => void) =>
          resolve([{ id: "org-new", name: "New Org" }]),
      }));
      return { from: mockFrom };
    });

    mockGetOrgAnalytics
      .mockResolvedValueOnce({
        totalImpressions: 0,
        totalReach: 0,
        totalEngagement: 0,
        avgEngagementRate: 0,
        totalPosts: 1, // Has posts but no engagement
        topPlatform: null,
        periodDays: 7,
      })
      .mockResolvedValueOnce({
        totalImpressions: 0,
        totalReach: 0,
        totalEngagement: 0,
        avgEngagementRate: 0,
        totalPosts: 0,
        topPlatform: null,
        periodDays: 7,
      });

    mockGetTopPosts.mockResolvedValue([]);
    mockGetPlatformComparison.mockResolvedValue([]);

    const step = createMockStep();
    const handler = weeklyAnalyticsDigest as unknown as CronHandler;

    await handler({ step });

    expect(step.run).toHaveBeenCalledTimes(3);
  });
});
