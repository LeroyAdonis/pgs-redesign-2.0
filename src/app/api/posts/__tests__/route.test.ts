import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockSession } from "@/test/api-test-utils";

// ── Mock chain helpers ──────────────────────────────────────────

/**
 * Creates a thenable chain mock that returns itself for every chained
 * method call and resolves to `result` when awaited.
 *
 * Covers Drizzle chains like:
 *   db.select().from(table).where(cond).limit(n)  →  result
 */
function mockChain(result: unknown = []) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "from",
    "where",
    "limit",
    "offset",
    "orderBy",
    "leftJoin",
    "innerJoin",
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

/** Chain that rejects when awaited — triggers 500 paths. */
function mockRejectedChain(error: Error) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "from",
    "where",
    "limit",
    "offset",
    "orderBy",
    "leftJoin",
    "innerJoin",
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

// ── Mocks (declared before import) ──────────────────────────────

const mockGetServerSession = vi.fn();
const mockSelect = vi.fn();

vi.mock("@/lib/auth-session", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/db", () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
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
  desc: vi.fn((col: unknown) => col),
  count: vi.fn(() => "count"),
  inArray: vi.fn((...args: unknown[]) => args),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// ── Import after mocks ─────────────────────────────────────────

import { GET } from "../route";

// ── Request helper ──────────────────────────────────────────────

function makeGetRequest(params: Record<string, string> = {}): Request {
  const url = new URL("http://localhost:3000/api/posts");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new Request(url.toString(), { method: "GET" });
}

// ── Fixtures ────────────────────────────────────────────────────

const MEMBERSHIP = {
  id: "mem-1",
  orgId: "org-1",
  userId: "test-user-1",
  role: "member",
  joinedAt: new Date("2025-01-01"),
};

const FAKE_POST = {
  id: "post-1",
  orgId: "org-1",
  createdById: "test-user-1",
  content: "Hello from Mzansi 🇿🇦",
  contentLanguage: "en",
  platform: "twitter",
  status: "draft",
  aiGenerated: false,
  aiPrompt: null,
  aiModel: null,
  createdAt: new Date("2025-06-01"),
  updatedAt: new Date("2025-06-01"),
};

/** Set up the three db.select() calls that the happy-path requires. */
function setupHappyPath(
  overrides: {
    memberships?: unknown[];
    countResult?: unknown[];
    rows?: unknown[];
  } = {},
) {
  const memberships = overrides.memberships ?? [MEMBERSHIP];
  const countResult = overrides.countResult ?? [{ value: 1 }];
  const rows = overrides.rows ?? [
    { post: FAKE_POST, post_schedule: null },
  ];

  mockSelect
    .mockReturnValueOnce(mockChain(memberships))
    .mockReturnValueOnce(mockChain(countResult))
    .mockReturnValueOnce(mockChain(rows));
}

// ── Setup ───────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ───────────────────────────────────────────────────────

describe("GET /api/posts", () => {
  // ─ Auth ─

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await GET(makeGetRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toBe("Unauthorized");
  });

  // ─ Org membership ─

  it("returns 404 when user has no organization", async () => {
    mockGetServerSession.mockResolvedValue(mockSession());
    mockSelect.mockReturnValueOnce(mockChain([])); // no membership

    const res = await GET(makeGetRequest());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe("No organization found");
  });

  // ─ Success cases ─

  it("returns posts list with pagination metadata", async () => {
    mockGetServerSession.mockResolvedValue(mockSession());
    setupHappyPath();

    const res = await GET(makeGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.posts).toHaveLength(1);
    expect(body.posts[0].post.id).toBe("post-1");
    expect(body.posts[0].schedules).toEqual([]);
    expect(body.total).toBe(1);
    expect(body.page).toBe(1);
    expect(body.limit).toBe(20);
  });

  it("groups schedules by post when a post has multiple schedules", async () => {
    mockGetServerSession.mockResolvedValue(mockSession());

    const schedule1 = { id: "sched-1", postId: "post-1" };
    const schedule2 = { id: "sched-2", postId: "post-1" };

    setupHappyPath({
      rows: [
        { post: FAKE_POST, post_schedule: schedule1 },
        { post: FAKE_POST, post_schedule: schedule2 },
      ],
    });

    const res = await GET(makeGetRequest());
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.posts).toHaveLength(1);
    expect(body.posts[0].schedules).toHaveLength(2);
  });

  it("returns empty list when no posts exist", async () => {
    mockGetServerSession.mockResolvedValue(mockSession());
    setupHappyPath({ countResult: [{ value: 0 }], rows: [] });

    const res = await GET(makeGetRequest());
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.posts).toHaveLength(0);
    expect(body.total).toBe(0);
  });

  // ─ Query-param handling ─

  it("respects page and limit query params", async () => {
    mockGetServerSession.mockResolvedValue(mockSession());
    setupHappyPath({ countResult: [{ value: 50 }], rows: [] });

    const res = await GET(makeGetRequest({ page: "3", limit: "10" }));
    const body = await res.json();

    expect(body.page).toBe(3);
    expect(body.limit).toBe(10);
  });

  it("caps limit at 100", async () => {
    mockGetServerSession.mockResolvedValue(mockSession());
    setupHappyPath({ countResult: [{ value: 0 }], rows: [] });

    const res = await GET(makeGetRequest({ limit: "999" }));
    const body = await res.json();

    expect(body.limit).toBe(100);
  });

  it("defaults to page 1 and limit 20", async () => {
    mockGetServerSession.mockResolvedValue(mockSession());
    setupHappyPath({ countResult: [{ value: 0 }], rows: [] });

    const res = await GET(makeGetRequest());
    const body = await res.json();

    expect(body.page).toBe(1);
    expect(body.limit).toBe(20);
  });

  // ─ Error handling ─

  it("returns 500 when database query fails", async () => {
    mockGetServerSession.mockResolvedValue(mockSession());
    mockSelect.mockReturnValueOnce(
      mockRejectedChain(new Error("DB connection failed")),
    );

    const res = await GET(makeGetRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe("Failed to list posts");
  });
});
