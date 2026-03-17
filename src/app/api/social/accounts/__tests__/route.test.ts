/**
 * Tests for GET /api/social/accounts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock auth session
vi.mock("@/lib/auth-session", () => ({
  getServerSession: vi.fn(),
}));

// Mock social module
vi.mock("@/lib/social", () => ({
  requireOrgMembership: vi.fn(),
  listAccountsForOrg: vi.fn(),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import { GET } from "../route";
import { getServerSession } from "@/lib/auth-session";

describe("GET /api/social/accounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 with consistent error format when unauthenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/social/accounts?orgId=org1");
    const response = await GET(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ success: false, error: "Unauthorized" });
  });

  it("returns 400 when orgId is missing", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "u1", name: "Test", email: "t@t.com", role: "user" },
      session: {} as any,
    } as any);

    const request = new NextRequest("http://localhost:3000/api/social/accounts");
    const response = await GET(request);

    expect(response.status).toBe(400);
  });
});
