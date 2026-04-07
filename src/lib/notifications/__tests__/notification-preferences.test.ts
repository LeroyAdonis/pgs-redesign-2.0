/**
 * Tests for notification preferences
 *
 * Validates preference retrieval, partial updates, and email-sending
 * decisions based on enabled/disabled state and muted types.
 *
 * Mocks the database layer (Drizzle ORM) so tests run without DATABASE_URL.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock chain helpers (Drizzle ORM query chains)
// ---------------------------------------------------------------------------

function mockChain(result: unknown = []) {
  const chain: Record<string, unknown> = {};
  const methods = ["from", "where", "limit", "set", "values"];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.onConflictDoUpdate = vi.fn().mockReturnValue(chain);
  chain.then = (
    onFulfilled?: (v: unknown) => unknown,
    onRejected?: (e: unknown) => unknown,
  ) => Promise.resolve(result).then(onFulfilled, onRejected);
  return chain;
}

// ---------------------------------------------------------------------------
// Mocks — declared before module import
// ---------------------------------------------------------------------------

const mockSelect = vi.fn();
const mockInsert = vi.fn();

vi.mock("@/db", () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => mockInsert(...args),
  },
}));

vi.mock("@/db/schema", () => ({
  notificationPreference: {
    userId: "notificationPreference.userId",
    inApp: "notificationPreference.inApp",
    emailEnabled: "notificationPreference.emailEnabled",
    emailFrequency: "notificationPreference.emailFrequency",
    mutedTypes: "notificationPreference.mutedTypes",
    updatedAt: "notificationPreference.updatedAt",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Re-import per test to ensure clean state
// ---------------------------------------------------------------------------

let getPreferences: typeof import("../notification-preferences")["getPreferences"];
let updatePreferences: typeof import("../notification-preferences")["updatePreferences"];
let shouldSendEmail: typeof import("../notification-preferences")["shouldSendEmail"];

beforeEach(async () => {
  vi.clearAllMocks();
  vi.resetModules();
  const mod = await import("../notification-preferences");
  getPreferences = mod.getPreferences;
  updatePreferences = mod.updatePreferences;
  shouldSendEmail = mod.shouldSendEmail;
});

const USER_ID = "user_pref_123";

// ---------------------------------------------------------------------------
// getPreferences
// ---------------------------------------------------------------------------

describe("getPreferences", () => {
  it("returns defaults for a new user (no DB row found)", async () => {
    mockSelect.mockReturnValue(mockChain([]));

    const prefs = await getPreferences(USER_ID);

    expect(prefs).toEqual({
      inApp: true,
      emailEnabled: true,
      emailFrequency: "daily",
      mutedTypes: [],
    });
  });

  it("returns persisted preferences when DB row exists", async () => {
    mockSelect.mockReturnValue(
      mockChain([
        {
          inApp: false,
          emailEnabled: true,
          emailFrequency: "weekly",
          mutedTypes: ["error"],
        },
      ]),
    );

    const prefs = await getPreferences(USER_ID);

    expect(prefs.inApp).toBe(false);
    expect(prefs.emailFrequency).toBe("weekly");
    expect(prefs.mutedTypes).toEqual(["error"]);
  });
});

// ---------------------------------------------------------------------------
// updatePreferences
// ---------------------------------------------------------------------------

describe("updatePreferences", () => {
  it("updates and returns merged preferences", async () => {
    // First call: select returns defaults (no row)
    mockSelect.mockReturnValue(mockChain([]));
    // Insert mock
    mockInsert.mockReturnValue(mockChain());

    const prefs = await updatePreferences(USER_ID, { emailEnabled: false });

    expect(prefs.emailEnabled).toBe(false);
    // Other defaults remain
    expect(prefs.inApp).toBe(true);
    expect(prefs.emailFrequency).toBe("daily");
  });

  it("updates email frequency", async () => {
    mockSelect.mockReturnValue(mockChain([]));
    mockInsert.mockReturnValue(mockChain());

    const prefs = await updatePreferences(USER_ID, {
      emailFrequency: "weekly",
    });

    expect(prefs.emailFrequency).toBe("weekly");
  });

  it("updates muted types", async () => {
    mockSelect.mockReturnValue(mockChain([]));
    mockInsert.mockReturnValue(mockChain());

    const prefs = await updatePreferences(USER_ID, {
      mutedTypes: ["info", "error"],
    });

    expect(prefs.mutedTypes).toEqual(["info", "error"]);
  });
});

// ---------------------------------------------------------------------------
// shouldSendEmail
// ---------------------------------------------------------------------------

describe("shouldSendEmail", () => {
  it("returns true when email enabled and type not muted", async () => {
    mockSelect.mockReturnValue(
      mockChain([
        {
          inApp: true,
          emailEnabled: true,
          emailFrequency: "daily",
          mutedTypes: [],
        },
      ]),
    );

    const result = await shouldSendEmail(USER_ID, "info");
    expect(result).toBe(true);
  });

  it("returns false when email is globally disabled", async () => {
    mockSelect.mockReturnValue(
      mockChain([
        {
          inApp: true,
          emailEnabled: false,
          emailFrequency: "daily",
          mutedTypes: [],
        },
      ]),
    );

    const result = await shouldSendEmail(USER_ID, "info");
    expect(result).toBe(false);
  });

  it("returns false when the notification type is muted", async () => {
    mockSelect.mockReturnValue(
      mockChain([
        {
          inApp: true,
          emailEnabled: true,
          emailFrequency: "daily",
          mutedTypes: ["error"],
        },
      ]),
    );

    const result = await shouldSendEmail(USER_ID, "error");
    expect(result).toBe(false);
  });

  it("returns true for non-muted type even if other types are muted", async () => {
    mockSelect.mockReturnValue(
      mockChain([
        {
          inApp: true,
          emailEnabled: true,
          emailFrequency: "daily",
          mutedTypes: ["error"],
        },
      ]),
    );

    const result = await shouldSendEmail(USER_ID, "info");
    expect(result).toBe(true);
  });
});
