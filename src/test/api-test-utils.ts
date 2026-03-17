/**
 * Shared API route test utilities
 *
 * Reusable factories for mock sessions, requests, and common vi.mock
 * setups used across API route tests.
 *
 * Session shapes match what `auth.api.getSession()` returns via
 * Better-auth (see src/lib/auth-session.ts). The user table has:
 *   id, name, email, emailVerified, image, role, createdAt, updatedAt
 * The session table has:
 *   id, userId, token, expiresAt, ipAddress, userAgent, createdAt, updatedAt
 *
 * @example
 *   import { mockSession, mockAdminSession, createMockRequest } from '@/test/api-test-utils';
 *
 *   mockGetServerSession.mockResolvedValue(mockSession());
 *   const req = createMockRequest('POST', { name: 'Test' });
 */

import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Session types (mirrors auth.api.getSession() return shape)
// ---------------------------------------------------------------------------

/** User object within a Better-auth session */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Session metadata within a Better-auth session */
export interface SessionData {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Full session object returned by getServerSession() */
export interface Session {
  user: SessionUser;
  session: SessionData;
}

// ---------------------------------------------------------------------------
// Session factories
// ---------------------------------------------------------------------------

const DEFAULT_NOW = new Date("2025-06-01T12:00:00Z");
const DEFAULT_EXPIRES = new Date("2025-06-08T12:00:00Z"); // +7 days

/**
 * Create a mock authenticated session with sensible defaults.
 *
 * Every field has a deterministic default value so tests that don't
 * care about specific fields can call `mockSession()` with no args.
 * Override any field via the `overrides` parameter.
 *
 * @example
 *   // Default user session
 *   mockSession()
 *
 *   // Override specific user fields
 *   mockSession({ user: { id: 'custom-id', role: 'moderator' } })
 */
export function mockSession(overrides?: {
  user?: Partial<SessionUser>;
  session?: Partial<SessionData>;
}): Session {
  const userId = overrides?.user?.id ?? "test-user-1";

  return {
    user: {
      id: userId,
      name: "Test User",
      email: "test@example.com",
      emailVerified: true,
      image: null,
      role: "user",
      createdAt: DEFAULT_NOW,
      updatedAt: DEFAULT_NOW,
      ...overrides?.user,
    },
    session: {
      id: "test-session-1",
      userId,
      token: "tok_test_abc123",
      expiresAt: DEFAULT_EXPIRES,
      ipAddress: "127.0.0.1",
      userAgent: "vitest",
      createdAt: DEFAULT_NOW,
      updatedAt: DEFAULT_NOW,
      ...overrides?.session,
    },
  };
}

/**
 * Create a mock admin session (role = "admin").
 *
 * Convenience wrapper around `mockSession()` that sets role to "admin"
 * and uses admin-specific default values for name/email.
 *
 * @example
 *   mockGetServerSession.mockResolvedValue(mockAdminSession());
 */
export function mockAdminSession(overrides?: {
  user?: Partial<SessionUser>;
  session?: Partial<SessionData>;
}): Session {
  return mockSession({
    user: {
      id: "admin-user-1",
      name: "Admin User",
      email: "admin@purpleglow.co.za",
      role: "admin",
      ...overrides?.user,
    },
    session: overrides?.session,
  });
}

// ---------------------------------------------------------------------------
// Request factories
// ---------------------------------------------------------------------------

/**
 * Create a standard Request object for API route testing.
 *
 * Uses the built-in `Request` constructor (available in happy-dom).
 * Suitable for route handlers that accept `Request` (not `NextRequest`).
 *
 * @param method  - HTTP method (GET, POST, PUT, DELETE, PATCH)
 * @param body    - Optional JSON body (automatically serialized)
 * @param headers - Optional extra headers (Content-Type is set automatically for bodies)
 *
 * @example
 *   const req = createMockRequest('POST', { name: 'John', email: 'john@test.com' });
 *   const res = await POST(req);
 */
export function createMockRequest(
  method: string,
  body?: unknown,
  headers?: Record<string, string>,
): Request {
  const hasBody = body !== undefined && body !== null;

  const mergedHeaders: Record<string, string> = {
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
    ...headers,
  };

  return new Request("http://localhost:3000/api/test", {
    method,
    headers: mergedHeaders,
    ...(hasBody ? { body: JSON.stringify(body) } : {}),
  });
}

/**
 * Create a NextRequest object for API route testing.
 *
 * Uses Next.js `NextRequest` which provides `.nextUrl`, `.cookies`,
 * and other Next-specific APIs. Required for route handlers that
 * access URL search params or dynamic route segments.
 *
 * @param method - HTTP method
 * @param url    - Full URL (e.g. "http://localhost:3000/api/posts?page=1")
 * @param body   - Optional JSON body
 *
 * @example
 *   const req = createMockNextRequest(
 *     'GET',
 *     'http://localhost:3000/api/posts?orgId=org-1&page=2',
 *   );
 *   const res = await GET(req);
 */
export function createMockNextRequest(
  method: string,
  url: string,
  body?: unknown,
): NextRequest {
  const hasBody = body !== undefined && body !== null;

  return new NextRequest(url, {
    method,
    ...(hasBody
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });
}

// ---------------------------------------------------------------------------
// Common mock factories for vi.mock
// ---------------------------------------------------------------------------

/**
 * Create a silent logger mock object.
 *
 * Returns an object matching the shape of `@/lib/logger`'s `logger`
 * export, with all methods as vi.fn() no-ops. Use inside `vi.mock()`.
 *
 * @example
 *   import { vi } from 'vitest';
 *   import { createMockLogger } from '@/test/api-test-utils';
 *
 *   vi.mock('@/lib/logger', () => ({ logger: createMockLogger() }));
 */
export function createMockLogger() {
  // Lazy import — vi is only available inside test files.
  // This function must be called from a test file context.
  const { vi } = await_vitest();
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

/**
 * Create a mock redirect that throws like Next.js does.
 *
 * Next.js `redirect()` throws a special error to interrupt rendering.
 * This mock replicates that behavior so tests can assert redirects
 * with `expect(...).rejects.toThrow('NEXT_REDIRECT:...')`.
 *
 * @example
 *   import { vi } from 'vitest';
 *   import { createMockRedirect } from '@/test/api-test-utils';
 *
 *   const mockRedirect = createMockRedirect();
 *   vi.mock('next/navigation', () => ({ redirect: (url: string) => mockRedirect(url) }));
 */
export function createMockRedirect() {
  const { vi } = await_vitest();
  return vi.fn((url: string): never => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  });
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Get vitest's `vi` from the global scope.
 *
 * Vitest injects `vi` globally when `globals: true` is set in config.
 * We access it this way so the utils module doesn't import from
 * 'vitest' directly (which would fail outside test context).
 */
function await_vitest(): { vi: typeof import("vitest")["vi"] } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = globalThis as Record<string, any>;
  if (!g.vi) {
    throw new Error(
      "api-test-utils: `vi` not found in global scope. " +
        "Ensure vitest.config.ts has `globals: true`.",
    );
  }
  return { vi: g.vi };
}
