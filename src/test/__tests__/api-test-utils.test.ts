/**
 * Tests for the shared API test utilities
 *
 * Validates that session factories, request factories, and mock helpers
 * produce correct shapes and respect overrides.
 */

import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import {
  mockSession,
  mockAdminSession,
  createMockRequest,
  createMockNextRequest,
  createMockLogger,
  createMockRedirect,
} from "../api-test-utils";

// ---------------------------------------------------------------------------
// mockSession
// ---------------------------------------------------------------------------

describe("mockSession", () => {
  it("returns a complete session with all required fields", () => {
    const session = mockSession();

    // user fields
    expect(session.user.id).toBe("test-user-1");
    expect(session.user.name).toBe("Test User");
    expect(session.user.email).toBe("test@example.com");
    expect(session.user.emailVerified).toBe(true);
    expect(session.user.image).toBeNull();
    expect(session.user.role).toBe("user");
    expect(session.user.createdAt).toBeInstanceOf(Date);
    expect(session.user.updatedAt).toBeInstanceOf(Date);

    // session fields
    expect(session.session.id).toBe("test-session-1");
    expect(session.session.userId).toBe("test-user-1");
    expect(session.session.token).toBe("tok_test_abc123");
    expect(session.session.expiresAt).toBeInstanceOf(Date);
    expect(session.session.ipAddress).toBe("127.0.0.1");
    expect(session.session.userAgent).toBe("vitest");
    expect(session.session.createdAt).toBeInstanceOf(Date);
    expect(session.session.updatedAt).toBeInstanceOf(Date);
  });

  it("keeps session.userId in sync with user.id by default", () => {
    const session = mockSession();
    expect(session.session.userId).toBe(session.user.id);
  });

  it("allows overriding user fields", () => {
    const session = mockSession({
      user: { id: "custom-42", name: "Jane", role: "moderator" },
    });

    expect(session.user.id).toBe("custom-42");
    expect(session.user.name).toBe("Jane");
    expect(session.user.role).toBe("moderator");
    // Non-overridden fields keep defaults
    expect(session.user.email).toBe("test@example.com");
    expect(session.user.emailVerified).toBe(true);
  });

  it("syncs session.userId when user.id is overridden", () => {
    const session = mockSession({ user: { id: "synced-id" } });
    expect(session.session.userId).toBe("synced-id");
  });

  it("allows overriding session fields", () => {
    const customExpiry = new Date("2030-01-01");
    const session = mockSession({
      session: { expiresAt: customExpiry, ipAddress: "10.0.0.1" },
    });

    expect(session.session.expiresAt).toBe(customExpiry);
    expect(session.session.ipAddress).toBe("10.0.0.1");
    // Non-overridden fields keep defaults
    expect(session.session.token).toBe("tok_test_abc123");
  });

  it("allows overriding both user and session fields", () => {
    const session = mockSession({
      user: { id: "u-both", email: "both@test.co.za" },
      session: { id: "s-both", token: "tok_custom" },
    });

    expect(session.user.id).toBe("u-both");
    expect(session.user.email).toBe("both@test.co.za");
    expect(session.session.id).toBe("s-both");
    expect(session.session.token).toBe("tok_custom");
  });
});

// ---------------------------------------------------------------------------
// mockAdminSession
// ---------------------------------------------------------------------------

describe("mockAdminSession", () => {
  it("returns a session with role=admin", () => {
    const session = mockAdminSession();
    expect(session.user.role).toBe("admin");
  });

  it("uses admin-specific default values", () => {
    const session = mockAdminSession();
    expect(session.user.id).toBe("admin-user-1");
    expect(session.user.name).toBe("Admin User");
    expect(session.user.email).toBe("admin@purpleglow.co.za");
  });

  it("allows overriding admin user fields while keeping role", () => {
    const session = mockAdminSession({
      user: { name: "Super Admin" },
    });

    expect(session.user.name).toBe("Super Admin");
    expect(session.user.role).toBe("admin");
    expect(session.user.id).toBe("admin-user-1");
  });

  it("allows overriding role (escape hatch)", () => {
    const session = mockAdminSession({
      user: { role: "super-admin" },
    });
    expect(session.user.role).toBe("super-admin");
  });
});

// ---------------------------------------------------------------------------
// createMockRequest
// ---------------------------------------------------------------------------

describe("createMockRequest", () => {
  it("creates a GET request with no body", () => {
    const req = createMockRequest("GET");

    expect(req.method).toBe("GET");
    expect(req.headers.get("Content-Type")).toBeNull();
    expect(req.body).toBeNull();
  });

  it("creates a POST request with JSON body", async () => {
    const payload = { name: "Test", email: "t@test.com" };
    const req = createMockRequest("POST", payload);

    expect(req.method).toBe("POST");
    expect(req.headers.get("Content-Type")).toBe("application/json");

    const body = await req.json();
    expect(body).toEqual(payload);
  });

  it("sets custom headers", () => {
    const req = createMockRequest("GET", undefined, {
      Authorization: "Bearer tok_123",
      "X-Custom": "value",
    });

    expect(req.headers.get("Authorization")).toBe("Bearer tok_123");
    expect(req.headers.get("X-Custom")).toBe("value");
  });

  it("merges custom headers with Content-Type for POST", () => {
    const req = createMockRequest("POST", { data: 1 }, {
      Authorization: "Bearer tok_456",
    });

    expect(req.headers.get("Content-Type")).toBe("application/json");
    expect(req.headers.get("Authorization")).toBe("Bearer tok_456");
  });

  it("creates DELETE request with no body", () => {
    const req = createMockRequest("DELETE");
    expect(req.method).toBe("DELETE");
    expect(req.body).toBeNull();
  });

  it("creates PUT request with body", async () => {
    const req = createMockRequest("PUT", { updated: true });
    expect(req.method).toBe("PUT");
    const body = await req.json();
    expect(body).toEqual({ updated: true });
  });
});

// ---------------------------------------------------------------------------
// createMockNextRequest
// ---------------------------------------------------------------------------

describe("createMockNextRequest", () => {
  it("creates a NextRequest instance", () => {
    const req = createMockNextRequest(
      "GET",
      "http://localhost:3000/api/posts",
    );

    expect(req).toBeInstanceOf(NextRequest);
    expect(req.method).toBe("GET");
  });

  it("preserves URL search params via nextUrl", () => {
    const req = createMockNextRequest(
      "GET",
      "http://localhost:3000/api/posts?orgId=org-1&page=2",
    );

    expect(req.nextUrl.searchParams.get("orgId")).toBe("org-1");
    expect(req.nextUrl.searchParams.get("page")).toBe("2");
  });

  it("creates POST NextRequest with JSON body", async () => {
    const payload = { title: "Hello" };
    const req = createMockNextRequest(
      "POST",
      "http://localhost:3000/api/posts",
      payload,
    );

    expect(req.method).toBe("POST");
    expect(req.headers.get("Content-Type")).toBe("application/json");

    const body = await req.json();
    expect(body).toEqual(payload);
  });

  it("creates GET NextRequest without body", () => {
    const req = createMockNextRequest(
      "GET",
      "http://localhost:3000/api/health",
    );

    expect(req.body).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// createMockLogger
// ---------------------------------------------------------------------------

describe("createMockLogger", () => {
  it("returns an object with all log level methods", () => {
    const logger = createMockLogger();

    expect(logger.debug).toBeDefined();
    expect(logger.info).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.error).toBeDefined();
  });

  it("all methods are callable no-ops", () => {
    const logger = createMockLogger();

    // Should not throw
    logger.debug("test debug");
    logger.info("test info");
    logger.warn("test warn");
    logger.error("test error");

    expect(logger.debug).toHaveBeenCalledWith("test debug");
    expect(logger.info).toHaveBeenCalledWith("test info");
    expect(logger.warn).toHaveBeenCalledWith("test warn");
    expect(logger.error).toHaveBeenCalledWith("test error");
  });
});

// ---------------------------------------------------------------------------
// createMockRedirect
// ---------------------------------------------------------------------------

describe("createMockRedirect", () => {
  it("throws an error matching NEXT_REDIRECT pattern", () => {
    const redirect = createMockRedirect();

    expect(() => redirect("/login")).toThrow("NEXT_REDIRECT:/login");
  });

  it("includes the full URL in the thrown error", () => {
    const redirect = createMockRedirect();

    expect(() => redirect("/login?callbackUrl=%2Fadmin")).toThrow(
      "NEXT_REDIRECT:/login?callbackUrl=%2Fadmin",
    );
  });

  it("is a vi.fn() so calls can be asserted", () => {
    const redirect = createMockRedirect();

    try {
      redirect("/dashboard");
    } catch {
      // Expected
    }

    expect(redirect).toHaveBeenCalledWith("/dashboard");
    expect(redirect).toHaveBeenCalledTimes(1);
  });
});
