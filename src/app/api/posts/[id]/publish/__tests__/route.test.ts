import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockSession } from "@/test/api-test-utils";

// ── Mock chain helpers ──────────────────────────────────────────

function mockChain(result: unknown = []) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "from",
    "where",
    "limit",
    "offset",
    "orderBy",
    "leftJoin",
    "set",
    "values",
  ];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.returning = vi.fn().mockResolvedValue(result);
  chain.then = (
    onFulfilled?: (v: unknown) => unknown,
    onRejected?: (e: unknown) => unknown,
  ) => Promise.resolve(result).then(onFulfilled, onRejected);
  return chain;
}

function mockRejectedChain(error: Error) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "from",
    "where",
    "limit",
    "offset",
    "orderBy",
    "leftJoin",
    "set",
    "values",
  ];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.returning = vi.fn().mockRejectedValue(error);
  chain.then = (
    onFulfilled?: (v: unknown) => unknown,
    onRejected?: (e: unknown) => unknown,
  ) => Promise.reject(error).then(onFulfilled, onRejected);
  return chain;
}

// ── Mocks ───────────────────────────────────────────────────────

const mockRequireServerSession = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockHasEnoughCredits = vi.fn();
const mockInngestSend = vi.fn();
const mockRateLimitCheck = vi.fn();

vi.mock("@/lib/auth-session", () => ({
  requireServerSession: (...args: unknown[]) =>
    mockRequireServerSession(...args),
}));

vi.mock("@/db", () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}));

vi.mock("@/db/schema", () => ({
  post: Symbol("post"),
  postSchedule: Symbol("postSchedule"),
  organizationMember: Symbol("organizationMember"),
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => args),
  and: vi.fn((...args: unknown[]) => args),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/lib/credits/credit-service", () => ({
  hasEnoughCredits: (...args: unknown[]) => mockHasEnoughCredits(...args),
}));

vi.mock("@/inngest/client", () => ({
  inngest: {
    send: (...args: unknown[]) => mockInngestSend(...args),
  },
}));

vi.mock("@/lib/security/rate-limit", () => ({
  createRateLimiter: () => ({
    check: (...args: unknown[]) => mockRateLimitCheck(...args),
    reset: vi.fn(),
  }),
}));

// ── Import after mocks ─────────────────────────────────────────

import { POST } from "../route";
import { NextRequest } from "next/server";

// ── Helpers ─────────────────────────────────────────────────────

function routeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makePublishRequest(): NextRequest {
  return new NextRequest("http://localhost:3000/api/posts/post-1/publish", {
    method: "POST",
  });
}

// ── Fixtures ────────────────────────────────────────────────────

const FAKE_POST_DRAFT = {
  id: "post-1",
  orgId: "org-1",
  createdById: "test-user-1",
  content: "Lekker post for Mzansi!",
  contentLanguage: "en",
  platform: "twitter",
  status: "draft",
  aiGenerated: false,
  createdAt: new Date("2025-06-01"),
  updatedAt: new Date("2025-06-01"),
};

const FAKE_POST_PUBLISHED = {
  ...FAKE_POST_DRAFT,
  status: "published",
};

const FAKE_POST_PUBLISHING = {
  ...FAKE_POST_DRAFT,
  status: "publishing",
};

const FAKE_MEMBERSHIP = {
  id: "mem-1",
  orgId: "org-1",
  userId: "test-user-1",
  role: "member",
};

const FAKE_SCHEDULE = {
  id: "sched-1",
  postId: "post-1",
  socialAccountId: "sa-1",
  scheduledAt: new Date("2025-06-10"),
};

/**
 * Sets up all mocks for the happy-path publish flow.
 * Individual tests override specific mocks to test guard conditions.
 */
function setupHappyPath() {
  mockRequireServerSession.mockResolvedValue(mockSession());
  mockRateLimitCheck.mockReturnValue({
    allowed: true,
    remaining: 19,
    resetAt: new Date(),
  });

  // 1st select: post lookup
  mockSelect.mockReturnValueOnce(mockChain([FAKE_POST_DRAFT]));
  // 2nd select: membership check
  mockSelect.mockReturnValueOnce(mockChain([FAKE_MEMBERSHIP]));
  // 3rd select: schedule lookup
  mockSelect.mockReturnValueOnce(mockChain([FAKE_SCHEDULE]));

  mockHasEnoughCredits.mockResolvedValue(true);
  mockInngestSend.mockResolvedValue(undefined);
  mockUpdate.mockReturnValue(mockChain([]));
}

// ── Setup ───────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ───────────────────────────────────────────────────────

describe("POST /api/posts/[id]/publish", () => {
  // ─ Auth ─

  it("re-throws the redirect Response when session is missing", async () => {
    const redirectResponse = new Response(null, {
      status: 302,
      headers: { Location: "/login" },
    });
    mockRequireServerSession.mockRejectedValue(redirectResponse);

    await expect(
      POST(makePublishRequest(), routeParams("post-1")),
    ).rejects.toBe(redirectResponse);
  });

  // ─ Rate limiting ─

  it("returns 429 when rate limit is exceeded", async () => {
    mockRequireServerSession.mockResolvedValue(mockSession());
    mockRateLimitCheck.mockReturnValue({
      allowed: false,
      remaining: 0,
      resetAt: new Date(),
    });

    const res = await POST(makePublishRequest(), routeParams("post-1"));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.success).toBe(false);
    expect(body.error).toContain("Too many requests");
  });

  // ─ Post existence ─

  it("returns 404 when post does not exist", async () => {
    mockRequireServerSession.mockResolvedValue(mockSession());
    mockRateLimitCheck.mockReturnValue({
      allowed: true,
      remaining: 19,
      resetAt: new Date(),
    });
    mockSelect.mockReturnValueOnce(mockChain([])); // post not found

    const res = await POST(makePublishRequest(), routeParams("nonexistent"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe("Post not found");
  });

  // ─ Org membership (authorization) ─

  it("returns 403 when user does not belong to the post's org", async () => {
    mockRequireServerSession.mockResolvedValue(mockSession());
    mockRateLimitCheck.mockReturnValue({
      allowed: true,
      remaining: 19,
      resetAt: new Date(),
    });

    // Post exists
    mockSelect.mockReturnValueOnce(mockChain([FAKE_POST_DRAFT]));
    // No membership found
    mockSelect.mockReturnValueOnce(mockChain([]));

    const res = await POST(makePublishRequest(), routeParams("post-1"));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toContain("do not have access");
  });

  // ─ Status validation ─

  it("returns 400 when post is already published", async () => {
    mockRequireServerSession.mockResolvedValue(mockSession());
    mockRateLimitCheck.mockReturnValue({
      allowed: true,
      remaining: 19,
      resetAt: new Date(),
    });

    mockSelect.mockReturnValueOnce(mockChain([FAKE_POST_PUBLISHED]));
    mockSelect.mockReturnValueOnce(mockChain([FAKE_MEMBERSHIP]));

    const res = await POST(makePublishRequest(), routeParams("post-1"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain("cannot be published");
    expect(body.error).toContain("published");
  });

  it("returns 400 when post is currently publishing", async () => {
    mockRequireServerSession.mockResolvedValue(mockSession());
    mockRateLimitCheck.mockReturnValue({
      allowed: true,
      remaining: 19,
      resetAt: new Date(),
    });

    mockSelect.mockReturnValueOnce(mockChain([FAKE_POST_PUBLISHING]));
    mockSelect.mockReturnValueOnce(mockChain([FAKE_MEMBERSHIP]));

    const res = await POST(makePublishRequest(), routeParams("post-1"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("cannot be published");
  });

  // ─ Credit check ─

  it("returns 402 when organization has insufficient credits", async () => {
    mockRequireServerSession.mockResolvedValue(mockSession());
    mockRateLimitCheck.mockReturnValue({
      allowed: true,
      remaining: 19,
      resetAt: new Date(),
    });

    mockSelect.mockReturnValueOnce(mockChain([FAKE_POST_DRAFT]));
    mockSelect.mockReturnValueOnce(mockChain([FAKE_MEMBERSHIP]));
    mockHasEnoughCredits.mockResolvedValue(false);

    const res = await POST(makePublishRequest(), routeParams("post-1"));
    const body = await res.json();

    expect(res.status).toBe(402);
    expect(body.success).toBe(false);
    expect(body.error).toContain("Insufficient credits");
  });

  it("passes the correct orgId to hasEnoughCredits", async () => {
    setupHappyPath();

    await POST(makePublishRequest(), routeParams("post-1"));

    expect(mockHasEnoughCredits).toHaveBeenCalledWith("org-1");
  });

  // ─ Schedule existence ─

  it("returns 400 when no schedule exists for the post", async () => {
    mockRequireServerSession.mockResolvedValue(mockSession());
    mockRateLimitCheck.mockReturnValue({
      allowed: true,
      remaining: 19,
      resetAt: new Date(),
    });

    mockSelect.mockReturnValueOnce(mockChain([FAKE_POST_DRAFT]));
    mockSelect.mockReturnValueOnce(mockChain([FAKE_MEMBERSHIP]));
    mockHasEnoughCredits.mockResolvedValue(true);
    mockSelect.mockReturnValueOnce(mockChain([])); // no schedule

    const res = await POST(makePublishRequest(), routeParams("post-1"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("No schedule found");
  });

  // ─ Success: Inngest event dispatch ─

  it("sends post/publish event to Inngest on success", async () => {
    setupHappyPath();

    const res = await POST(makePublishRequest(), routeParams("post-1"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe("Post publish initiated");
    expect(body.postId).toBe("post-1");
    expect(body.scheduleId).toBe("sched-1");

    // Verify Inngest event was sent with correct payload
    expect(mockInngestSend).toHaveBeenCalledTimes(1);
    expect(mockInngestSend).toHaveBeenCalledWith({
      name: "post/publish",
      data: {
        scheduleId: "sched-1",
        postId: "post-1",
        orgId: "org-1",
      },
    });
  });

  it("updates post status to 'publishing' optimistically", async () => {
    setupHappyPath();

    await POST(makePublishRequest(), routeParams("post-1"));

    // db.update() was called to set status = "publishing"
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  // ─ Publishable from "failed" and "scheduled" statuses ─

  it("allows publishing from 'scheduled' status", async () => {
    const scheduledPost = { ...FAKE_POST_DRAFT, status: "scheduled" };

    mockRequireServerSession.mockResolvedValue(mockSession());
    mockRateLimitCheck.mockReturnValue({
      allowed: true,
      remaining: 19,
      resetAt: new Date(),
    });
    mockSelect.mockReturnValueOnce(mockChain([scheduledPost]));
    mockSelect.mockReturnValueOnce(mockChain([FAKE_MEMBERSHIP]));
    mockHasEnoughCredits.mockResolvedValue(true);
    mockSelect.mockReturnValueOnce(mockChain([FAKE_SCHEDULE]));
    mockInngestSend.mockResolvedValue(undefined);
    mockUpdate.mockReturnValue(mockChain([]));

    const res = await POST(makePublishRequest(), routeParams("post-1"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("allows publishing from 'failed' status (retry)", async () => {
    const failedPost = { ...FAKE_POST_DRAFT, status: "failed" };

    mockRequireServerSession.mockResolvedValue(mockSession());
    mockRateLimitCheck.mockReturnValue({
      allowed: true,
      remaining: 19,
      resetAt: new Date(),
    });
    mockSelect.mockReturnValueOnce(mockChain([failedPost]));
    mockSelect.mockReturnValueOnce(mockChain([FAKE_MEMBERSHIP]));
    mockHasEnoughCredits.mockResolvedValue(true);
    mockSelect.mockReturnValueOnce(mockChain([FAKE_SCHEDULE]));
    mockInngestSend.mockResolvedValue(undefined);
    mockUpdate.mockReturnValue(mockChain([]));

    const res = await POST(makePublishRequest(), routeParams("post-1"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  // ─ Error handling ─

  it("returns 500 on unexpected database error", async () => {
    mockRequireServerSession.mockResolvedValue(mockSession());
    mockRateLimitCheck.mockReturnValue({
      allowed: true,
      remaining: 19,
      resetAt: new Date(),
    });
    mockSelect.mockReturnValueOnce(
      mockRejectedChain(new Error("Connection timeout")),
    );

    const res = await POST(makePublishRequest(), routeParams("post-1"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe("Failed to initiate publish");
  });

  it("returns 500 when Inngest send fails", async () => {
    mockRequireServerSession.mockResolvedValue(mockSession());
    mockRateLimitCheck.mockReturnValue({
      allowed: true,
      remaining: 19,
      resetAt: new Date(),
    });
    mockSelect.mockReturnValueOnce(mockChain([FAKE_POST_DRAFT]));
    mockSelect.mockReturnValueOnce(mockChain([FAKE_MEMBERSHIP]));
    mockHasEnoughCredits.mockResolvedValue(true);
    mockSelect.mockReturnValueOnce(mockChain([FAKE_SCHEDULE]));
    mockInngestSend.mockRejectedValue(new Error("Inngest unavailable"));

    const res = await POST(makePublishRequest(), routeParams("post-1"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Failed to initiate publish");
  });
});
