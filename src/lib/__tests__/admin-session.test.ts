/**
 * Tests for admin-session auth helpers
 *
 * Validates that:
 * - Admin users pass the guard
 * - Non-admin users are redirected to /dashboard
 * - Unauthenticated users are redirected to /login
 * - isAdmin() returns correct boolean
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

// ─── Mocks ───

// Mock next/navigation redirect — throws NEXT_REDIRECT like the real one
const mockRedirect = vi.fn((url: string): never => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

// Mock getServerSession
const mockGetServerSession = vi.fn();
vi.mock("@/lib/auth-session", () => ({
  getServerSession: () => mockGetServerSession(),
}));

// Mock logger to keep tests silent
vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// ─── Helpers ───

function makeSession(role: string) {
  return {
    user: {
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      image: null,
      role,
    },
    session: {
      id: "session-1",
      token: "tok_test",
      userId: "user-1",
    },
  };
}

// ─── Tests ───

describe("requireAdminSession", () => {
  let requireAdminSession: () => Promise<ReturnType<typeof makeSession>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Re-import to ensure fresh module state with mocks
    const mod = await import("../admin-session");
    requireAdminSession = mod.requireAdminSession;
  });

  it("returns the session when user is an admin", async () => {
    const adminSession = makeSession("admin");
    mockGetServerSession.mockResolvedValue(adminSession);

    const result = await requireAdminSession();
    expect(result).toEqual(adminSession);
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redirects to /dashboard when user is not an admin", async () => {
    mockGetServerSession.mockResolvedValue(makeSession("user"));

    await expect(requireAdminSession()).rejects.toThrow("NEXT_REDIRECT:/dashboard");
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
  });

  it("redirects to /login when there is no session", async () => {
    mockGetServerSession.mockResolvedValue(null);

    await expect(requireAdminSession()).rejects.toThrow(
      "NEXT_REDIRECT:/login?callbackUrl=%2Fadmin",
    );
    expect(mockRedirect).toHaveBeenCalledWith("/login?callbackUrl=%2Fadmin");
  });

  it("redirects non-admin roles (e.g. 'moderator')", async () => {
    mockGetServerSession.mockResolvedValue(makeSession("moderator"));

    await expect(requireAdminSession()).rejects.toThrow("NEXT_REDIRECT:/dashboard");
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
  });
});

describe("isAdmin", () => {
  let isAdmin: () => Promise<boolean>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("../admin-session");
    isAdmin = mod.isAdmin;
  });

  it("returns true for admin users", async () => {
    mockGetServerSession.mockResolvedValue(makeSession("admin"));
    expect(await isAdmin()).toBe(true);
  });

  it("returns false for non-admin users", async () => {
    mockGetServerSession.mockResolvedValue(makeSession("user"));
    expect(await isAdmin()).toBe(false);
  });

  it("returns false when there is no session", async () => {
    mockGetServerSession.mockResolvedValue(null);
    expect(await isAdmin()).toBe(false);
  });
});
