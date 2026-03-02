/**
 * Tests for Inngest publishing pipeline functions
 *
 * Verifies the core publishing flow:
 *   - publishPost: lookup → publish → credit deduction → status update
 *   - retryPost: exponential backoff → re-trigger
 *   - checkScheduledPosts: find due posts → dispatch events
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks (accessible inside vi.mock factories) ─────────

const {
  mockPublish,
  mockDeductCredit,
  mockSend,
  mockDecrypt,
} = vi.hoisted(() => ({
  mockPublish: vi.fn(),
  mockDeductCredit: vi.fn(),
  mockSend: vi.fn(),
  mockDecrypt: vi.fn((encrypted: string) => `decrypted_${encrypted}`),
}));

// ── Mock modules ────────────────────────────────────────────────

// The db mock is special: we build chain-able query objects dynamically
// in the test helpers (setupSelectChain, setupUpdateChain) rather than
// in the factory, because each test needs different return values.
const mockDb = vi.hoisted(() => ({
  update: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
}));

vi.mock("@/db", () => ({ db: mockDb }));

vi.mock("@/db/schema", () => ({
  post: {
    id: "post.id",
    orgId: "post.orgId",
    status: "post.status",
    content: "post.content",
    createdById: "post.createdById",
    platform: "post.platform",
  },
  postSchedule: {
    id: "postSchedule.id",
    postId: "postSchedule.postId",
    socialAccountId: "postSchedule.socialAccountId",
    scheduledAt: "postSchedule.scheduledAt",
    publishedAt: "postSchedule.publishedAt",
    platformPostId: "postSchedule.platformPostId",
    retryCount: "postSchedule.retryCount",
    failedAt: "postSchedule.failedAt",
    lastError: "postSchedule.lastError",
  },
  socialAccount: {
    id: "socialAccount.id",
    platform: "socialAccount.platform",
    accessTokenEncrypted: "socialAccount.accessTokenEncrypted",
    isActive: "socialAccount.isActive",
  },
  postMedia: {
    postId: "postMedia.postId",
    url: "postMedia.url",
    mediaType: "postMedia.mediaType",
    altText: "postMedia.altText",
  },
  credit: {
    orgId: "credit.orgId",
    monthlyAllocation: "credit.monthlyAllocation",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
  lte: vi.fn((...args: unknown[]) => ({ type: "lte", args })),
  inArray: vi.fn((...args: unknown[]) => ({ type: "inArray", args })),
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
    publish: mockPublish,
    validateContent: vi.fn(() => ({ valid: true, errors: [] })),
  })),
}));

vi.mock("@/lib/credits", () => ({
  deductCredit: (...args: unknown[]) => mockDeductCredit(...args),
  hasEnoughCredits: vi.fn().mockResolvedValue(true),
  hasDeductionForPost: vi.fn().mockResolvedValue(false),
  LOW_BALANCE_THRESHOLD: 0.1,
}));

// Mock inngest client — createFunction returns the raw handler for testing
vi.mock("../client", () => ({
  inngest: {
    send: (...args: unknown[]) => mockSend(...args),
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
  publishPost,
  retryPost,
  checkScheduledPosts,
} from "../functions";

// ── Test helpers ────────────────────────────────────────────────

/** Create a mock Inngest step object. */
function createMockStep() {
  return {
    run: vi.fn((_name: string, fn: () => unknown) => fn()),
    sleep: vi.fn().mockResolvedValue(undefined),
  };
}

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
      // Allow thenable (for queries without .limit())
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

/** Set up the mock DB update chain. */
function setupUpdateChain() {
  mockDb.update.mockImplementation(() => {
    const mockWhere = vi.fn().mockResolvedValue(undefined);
    const mockSet = vi.fn(() => ({ where: mockWhere }));
    return { set: mockSet };
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

describe("publishPost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupUpdateChain();
  });

  it("publishes successfully and deducts credit", async () => {
    setupSelectChain([
      [{ socialAccountId: "sa-1" }],
      [{ platform: "twitter", accessTokenEncrypted: "enc_token_123", isActive: true }],
      [{ content: "Hello #Mzansi! 🇿🇦" }],
      [], // no media
      [{ monthlyAllocation: 100 }], // credit row for low-balance check
      [{ createdById: "user-1", platform: "twitter" }], // send-notifications post lookup
    ]);

    mockPublish.mockResolvedValue({
      success: true,
      platformPostId: "tw-123",
      platformUrl: "https://twitter.com/i/status/tw-123",
      retryable: false,
    });

    mockDeductCredit.mockResolvedValue({ success: true, newBalance: 42 });

    const step = createMockStep();
    const handler = publishPost as unknown as StepHandler;

    await handler({
      event: {
        data: { scheduleId: "sched-1", postId: "post-1", orgId: "org-1" },
      },
      step,
    });

    // 7 steps: mark-publishing, check-credits, publish-to-platform, deduct-credit, update-status, trigger-analytics, send-notifications
    expect(step.run).toHaveBeenCalledTimes(7);
    expect(step.run.mock.calls[0][0]).toBe("mark-publishing");
    expect(step.run.mock.calls[1][0]).toBe("check-credits");
    expect(step.run.mock.calls[2][0]).toBe("publish-to-platform");
    expect(step.run.mock.calls[3][0]).toBe("deduct-credit");
    expect(step.run.mock.calls[4][0]).toBe("update-status");
    expect(step.run.mock.calls[5][0]).toBe("trigger-analytics");
    expect(step.run.mock.calls[6][0]).toBe("send-notifications");

    // Publisher called with decrypted token
    expect(mockPublish).toHaveBeenCalledWith({
      postId: "post-1",
      content: "Hello #Mzansi! 🇿🇦",
      platform: "twitter",
      accessToken: "decrypted_enc_token_123",
      media: [],
    });

    // Credit deducted
    expect(mockDeductCredit).toHaveBeenCalledWith("org-1", "post-1");

    // DB updated (mark-publishing + update-status)
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("queues retry on retryable failure", async () => {
    setupSelectChain([
      [{ socialAccountId: "sa-1" }],
      [{ platform: "twitter", accessTokenEncrypted: "enc_token_123", isActive: true }],
      [{ content: "Hello world" }],
      [], // no media
      [{ retryCount: 0 }], // current retry count
    ]);

    mockPublish.mockResolvedValue({
      success: false,
      error: "Rate limit exceeded",
      retryable: true,
    });

    mockSend.mockResolvedValue(undefined);

    const step = createMockStep();
    const handler = publishPost as unknown as StepHandler;

    await handler({
      event: {
        data: { scheduleId: "sched-1", postId: "post-1", orgId: "org-1" },
      },
      step,
    });

    // Credit should NOT be deducted on failure
    expect(mockDeductCredit).not.toHaveBeenCalled();

    // Retry event sent
    expect(mockSend).toHaveBeenCalledWith({
      name: "post/retry",
      data: {
        scheduleId: "sched-1",
        postId: "post-1",
        orgId: "org-1",
        attempt: 1,
      },
    });

    // 5 steps: mark-publishing, check-credits, publish-to-platform, update-status, send-notifications
    expect(step.run).toHaveBeenCalledTimes(5);
  });

  it("marks post as failed after max retries", async () => {
    setupSelectChain([
      [{ socialAccountId: "sa-1" }],
      [{ platform: "twitter", accessTokenEncrypted: "enc_token_123", isActive: true }],
      [{ content: "Hello world" }],
      [], // no media
      [{ retryCount: 2 }], // at 2 → increments to 3 (>= max)
    ]);

    mockPublish.mockResolvedValue({
      success: false,
      error: "API down",
      retryable: true,
    });

    const step = createMockStep();
    const handler = publishPost as unknown as StepHandler;

    await handler({
      event: {
        data: { scheduleId: "sched-1", postId: "post-1", orgId: "org-1" },
      },
      step,
    });

    // No retry sent (max retries exhausted)
    expect(mockSend).not.toHaveBeenCalled();

    // Post marked as failed via db.update
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("marks post as failed on non-retryable error", async () => {
    setupSelectChain([
      [{ socialAccountId: "sa-1" }],
      [{ platform: "twitter", accessTokenEncrypted: "enc_token_123", isActive: true }],
      [{ content: "Hello world" }],
      [], // no media
      [{ retryCount: 0 }], // even at 0 retries — non-retryable fails immediately
    ]);

    mockPublish.mockResolvedValue({
      success: false,
      error: "Account suspended",
      retryable: false,
    });

    const step = createMockStep();
    const handler = publishPost as unknown as StepHandler;

    await handler({
      event: {
        data: { scheduleId: "sched-1", postId: "post-1", orgId: "org-1" },
      },
      step,
    });

    // No retry sent (non-retryable)
    expect(mockSend).not.toHaveBeenCalled();

    // Credit not deducted
    expect(mockDeductCredit).not.toHaveBeenCalled();
  });

  it("handles missing social account gracefully", async () => {
    setupSelectChain([
      [{ socialAccountId: "sa-1" }],
      [], // social account not found
    ]);

    const step = createMockStep();
    const handler = publishPost as unknown as StepHandler;

    await handler({
      event: {
        data: { scheduleId: "sched-1", postId: "post-1", orgId: "org-1" },
      },
      step,
    });

    // Publisher not called
    expect(mockPublish).not.toHaveBeenCalled();

    // Credit not deducted
    expect(mockDeductCredit).not.toHaveBeenCalled();
  });
});

describe("retryPost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delays then re-triggers publish event with orgId", async () => {
    mockSend.mockResolvedValue(undefined);

    const step = createMockStep();
    const handler = retryPost as unknown as StepHandler;

    await handler({
      event: {
        data: {
          scheduleId: "sched-1",
          postId: "post-1",
          orgId: "org-1",
          attempt: 2,
        },
      },
      step,
    });

    // Exponential backoff: 5 * 3^(2-1) = 15 minutes
    expect(step.sleep).toHaveBeenCalledWith("retry-delay", "15m");

    // Re-send post/publish with orgId
    expect(mockSend).toHaveBeenCalledWith({
      name: "post/publish",
      data: {
        scheduleId: "sched-1",
        postId: "post-1",
        orgId: "org-1",
      },
    });
  });

  it("applies correct exponential backoff per attempt", async () => {
    mockSend.mockResolvedValue(undefined);

    const handler = retryPost as unknown as StepHandler;

    // Attempt 1: 5 * 3^0 = 5 minutes
    const step1 = createMockStep();
    await handler({
      event: {
        data: { scheduleId: "s-1", postId: "p-1", orgId: "o-1", attempt: 1 },
      },
      step: step1,
    });
    expect(step1.sleep).toHaveBeenCalledWith("retry-delay", "5m");

    // Attempt 3: 5 * 3^2 = 45 minutes
    const step3 = createMockStep();
    await handler({
      event: {
        data: { scheduleId: "s-1", postId: "p-1", orgId: "o-1", attempt: 3 },
      },
      step: step3,
    });
    expect(step3.sleep).toHaveBeenCalledWith("retry-delay", "45m");
  });
});

describe("checkScheduledPosts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupUpdateChain();
  });

  it("finds due posts and dispatches events with orgId", async () => {
    const dueSchedules = [
      { scheduleId: "sched-1", postId: "post-1", orgId: "org-1" },
      { scheduleId: "sched-2", postId: "post-2", orgId: "org-1" },
      { scheduleId: "sched-3", postId: "post-3", orgId: "org-2" },
    ];

    mockDb.select.mockImplementation(() => {
      const mockWhere = vi.fn().mockResolvedValue(dueSchedules);
      const mockInnerJoin = vi.fn(() => ({ where: mockWhere }));
      const mockFrom = vi.fn(() => ({
        innerJoin: mockInnerJoin,
        where: mockWhere,
      }));
      return { from: mockFrom };
    });

    mockSend.mockResolvedValue(undefined);

    const step = createMockStep();
    const handler = checkScheduledPosts as unknown as CronHandler;

    await handler({ step });

    // 2 steps: find-due-posts, dispatch-publish-events
    expect(step.run).toHaveBeenCalledTimes(2);
    expect(step.run.mock.calls[0][0]).toBe("find-due-posts");
    expect(step.run.mock.calls[1][0]).toBe("dispatch-publish-events");

    // 3 events dispatched with orgId
    expect(mockSend).toHaveBeenCalledWith([
      { name: "post/publish", data: { scheduleId: "sched-1", postId: "post-1", orgId: "org-1" } },
      { name: "post/publish", data: { scheduleId: "sched-2", postId: "post-2", orgId: "org-1" } },
      { name: "post/publish", data: { scheduleId: "sched-3", postId: "post-3", orgId: "org-2" } },
    ]);
  });

  it("skips dispatch when no due posts found", async () => {
    mockDb.select.mockImplementation(() => {
      const mockWhere = vi.fn().mockResolvedValue([]);
      const mockInnerJoin = vi.fn(() => ({ where: mockWhere }));
      const mockFrom = vi.fn(() => ({
        innerJoin: mockInnerJoin,
        where: mockWhere,
      }));
      return { from: mockFrom };
    });

    const step = createMockStep();
    const handler = checkScheduledPosts as unknown as CronHandler;

    await handler({ step });

    // Only find-due-posts (no dispatch)
    expect(step.run).toHaveBeenCalledTimes(1);
    expect(step.run.mock.calls[0][0]).toBe("find-due-posts");

    // inngest.send not called
    expect(mockSend).not.toHaveBeenCalled();
  });
});
