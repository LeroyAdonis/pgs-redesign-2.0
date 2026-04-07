import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth-session", () => ({
  getServerSession: vi.fn(),
}));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn() },
}));
vi.mock("@/db", () => ({ db: {} }));
vi.mock("@/db/schema", () => ({ notification: {} }));
vi.mock("@/lib/notifications/notification-service", () => ({
  getUserNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  and: vi.fn(),
  isNull: vi.fn(),
  isNotNull: vi.fn(),
  count: vi.fn(),
}));

import { getServerSession } from "@/lib/auth-session";

describe("GET /api/notifications — error format", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns { success: false, error } when unauthenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const { GET } = await import("../route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost:3000/api/notifications");
    const res = await GET(req as any);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty("success", false);
    expect(body).toHaveProperty("error");
  });
});

describe("GET /api/notifications/count — error format", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns { success: false, error } when unauthenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const { GET } = await import("../../notifications/count/route");
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty("success", false);
    expect(body).toHaveProperty("error");
  });
});
