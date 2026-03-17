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

const mockGetServerSession = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/lib/auth-session", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/db", () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

vi.mock("@/db/schema", () => ({
  post: Symbol("post"),
  postSchedule: Symbol("postSchedule"),
  postMedia: Symbol("postMedia"),
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => args),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// ── Import after mocks ─────────────────────────────────────────

import { GET, PATCH, DELETE } from "../route";

// ── Helpers ─────────────────────────────────────────────────────

/** Builds the `{ params }` object that Next.js App Router provides. */
function routeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeRequest(
  method: string,
  body?: Record<string, unknown>,
): Request {
  const hasBody = body !== undefined;
  return new Request("http://localhost:3000/api/posts/post-1", {
    method,
    headers: hasBody ? { "Content-Type": "application/json" } : {},
    ...(hasBody ? { body: JSON.stringify(body) } : {}),
  });
}

// ── Fixtures ────────────────────────────────────────────────────

const FAKE_POST = {
  id: "post-1",
  orgId: "org-1",
  createdById: "test-user-1",
  content: "Sawubona 🌍",
  contentLanguage: "zu",
  platform: "instagram",
  status: "draft",
  aiGenerated: false,
  aiPrompt: null,
  aiModel: null,
  createdAt: new Date("2025-06-01"),
  updatedAt: new Date("2025-06-01"),
};

const FAKE_SCHEDULE = {
  id: "sched-1",
  postId: "post-1",
  socialAccountId: "sa-1",
  scheduledAt: new Date("2025-06-10"),
};

const FAKE_MEDIA = {
  id: "media-1",
  postId: "post-1",
  mediaType: "image",
  url: "https://cdn.example.com/image.jpg",
};

// ── Setup ───────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════
// GET /api/posts/[id]
// ═══════════════════════════════════════════════════════════════

describe("GET /api/posts/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await GET(makeRequest("GET"), routeParams("post-1"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when post does not exist", async () => {
    mockGetServerSession.mockResolvedValue(mockSession());
    mockSelect.mockReturnValueOnce(mockChain([])); // post not found

    const res = await GET(makeRequest("GET"), routeParams("nonexistent"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe("Post not found");
  });

  it("returns post with schedules and media on success", async () => {
    mockGetServerSession.mockResolvedValue(mockSession());

    // 1st select: post lookup
    mockSelect.mockReturnValueOnce(mockChain([FAKE_POST]));
    // 2nd select: schedules
    mockSelect.mockReturnValueOnce(mockChain([FAKE_SCHEDULE]));
    // 3rd select: media
    mockSelect.mockReturnValueOnce(mockChain([FAKE_MEDIA]));

    const res = await GET(makeRequest("GET"), routeParams("post-1"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.post.id).toBe("post-1");
    expect(body.schedules).toHaveLength(1);
    expect(body.media).toHaveLength(1);
  });

  it("returns empty arrays when post has no schedules or media", async () => {
    mockGetServerSession.mockResolvedValue(mockSession());

    mockSelect.mockReturnValueOnce(mockChain([FAKE_POST]));
    mockSelect.mockReturnValueOnce(mockChain([])); // no schedules
    mockSelect.mockReturnValueOnce(mockChain([])); // no media

    const res = await GET(makeRequest("GET"), routeParams("post-1"));
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.schedules).toEqual([]);
    expect(body.media).toEqual([]);
  });

  it("returns 500 on database error", async () => {
    mockGetServerSession.mockResolvedValue(mockSession());
    mockSelect.mockReturnValueOnce(
      mockRejectedChain(new Error("Connection lost")),
    );

    const res = await GET(makeRequest("GET"), routeParams("post-1"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe("Failed to get post");
  });
});

// ═══════════════════════════════════════════════════════════════
// PATCH /api/posts/[id]
// ═══════════════════════════════════════════════════════════════

describe("PATCH /api/posts/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await PATCH(
      makeRequest("PATCH", { content: "Updated" }),
      routeParams("post-1"),
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it("returns 400 when no updatable fields are provided", async () => {
    mockGetServerSession.mockResolvedValue(mockSession());

    const res = await PATCH(
      makeRequest("PATCH", {}),
      routeParams("post-1"),
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe("No fields to update");
  });

  it("returns 400 for invalid platform value", async () => {
    mockGetServerSession.mockResolvedValue(mockSession());

    const res = await PATCH(
      makeRequest("PATCH", { platform: "myspace" }),
      routeParams("post-1"),
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe("Invalid platform");
  });

  it("returns 400 for invalid status value", async () => {
    mockGetServerSession.mockResolvedValue(mockSession());

    const res = await PATCH(
      makeRequest("PATCH", { status: "archived" }),
      routeParams("post-1"),
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe("Invalid status");
  });

  it("returns 404 when post does not exist", async () => {
    mockGetServerSession.mockResolvedValue(mockSession());

    const chain = mockChain([]);
    // .returning() resolves to [] → destructured as [undefined]
    mockUpdate.mockReturnValueOnce(chain);

    const res = await PATCH(
      makeRequest("PATCH", { content: "Updated" }),
      routeParams("nonexistent"),
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Post not found");
  });

  it("updates content and returns the updated post", async () => {
    mockGetServerSession.mockResolvedValue(mockSession());

    const updatedPost = { ...FAKE_POST, content: "Updated content" };
    const chain = mockChain([updatedPost]);
    mockUpdate.mockReturnValueOnce(chain);

    const res = await PATCH(
      makeRequest("PATCH", { content: "Updated content" }),
      routeParams("post-1"),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.post.content).toBe("Updated content");
  });

  it("accepts valid platform values", async () => {
    mockGetServerSession.mockResolvedValue(mockSession());

    const updatedPost = { ...FAKE_POST, platform: "facebook" };
    const chain = mockChain([updatedPost]);
    mockUpdate.mockReturnValueOnce(chain);

    const res = await PATCH(
      makeRequest("PATCH", { platform: "facebook" }),
      routeParams("post-1"),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.post.platform).toBe("facebook");
  });

  it("accepts valid status transitions", async () => {
    mockGetServerSession.mockResolvedValue(mockSession());

    const updatedPost = { ...FAKE_POST, status: "scheduled" };
    const chain = mockChain([updatedPost]);
    mockUpdate.mockReturnValueOnce(chain);

    const res = await PATCH(
      makeRequest("PATCH", { status: "scheduled" }),
      routeParams("post-1"),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.post.status).toBe("scheduled");
  });

  it("returns 500 on database error", async () => {
    mockGetServerSession.mockResolvedValue(mockSession());

    const chain = mockRejectedChain(new Error("Update failed"));
    mockUpdate.mockReturnValueOnce(chain);

    const res = await PATCH(
      makeRequest("PATCH", { content: "Something" }),
      routeParams("post-1"),
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe("Failed to update post");
  });
});

// ═══════════════════════════════════════════════════════════════
// DELETE /api/posts/[id]
// ═══════════════════════════════════════════════════════════════

describe("DELETE /api/posts/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await DELETE(makeRequest("DELETE"), routeParams("post-1"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it("returns 404 when post does not exist", async () => {
    mockGetServerSession.mockResolvedValue(mockSession());

    const chain = mockChain([]);
    mockDelete.mockReturnValueOnce(chain);

    const res = await DELETE(
      makeRequest("DELETE"),
      routeParams("nonexistent"),
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Post not found");
  });

  it("deletes the post and returns success", async () => {
    mockGetServerSession.mockResolvedValue(mockSession());

    const chain = mockChain([{ id: "post-1" }]);
    mockDelete.mockReturnValueOnce(chain);

    const res = await DELETE(makeRequest("DELETE"), routeParams("post-1"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("returns 500 on database error", async () => {
    mockGetServerSession.mockResolvedValue(mockSession());

    const chain = mockRejectedChain(new Error("Delete failed"));
    mockDelete.mockReturnValueOnce(chain);

    const res = await DELETE(makeRequest("DELETE"), routeParams("post-1"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe("Failed to delete post");
  });
});
