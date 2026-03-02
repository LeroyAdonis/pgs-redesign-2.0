/**
 * Tests for notification preferences
 *
 * Validates in-memory preference store behaviour: defaults for new
 * users, partial updates, and email-sending decisions based on
 * enabled/disabled state and muted types.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// We must re-import the module fresh for each test to reset the in-memory store.
// Use dynamic imports and vi.resetModules to achieve isolation.

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
  it("returns defaults for a new user", async () => {
    const prefs = await getPreferences(USER_ID);

    expect(prefs).toEqual({
      inApp: true,
      emailEnabled: true,
      emailFrequency: "daily",
      mutedTypes: [],
    });
  });

  it("returns a fresh copy (no mutation leaks)", async () => {
    const prefs1 = await getPreferences(USER_ID);
    prefs1.mutedTypes.push("error");

    const prefs2 = await getPreferences(USER_ID);
    expect(prefs2.mutedTypes).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// updatePreferences
// ---------------------------------------------------------------------------

describe("updatePreferences", () => {
  it("updates and persists partial preferences", async () => {
    await updatePreferences(USER_ID, { emailEnabled: false });

    const prefs = await getPreferences(USER_ID);
    expect(prefs.emailEnabled).toBe(false);
    // Other defaults remain
    expect(prefs.inApp).toBe(true);
    expect(prefs.emailFrequency).toBe("daily");
  });

  it("updates email frequency", async () => {
    await updatePreferences(USER_ID, { emailFrequency: "weekly" });

    const prefs = await getPreferences(USER_ID);
    expect(prefs.emailFrequency).toBe("weekly");
  });

  it("updates muted types", async () => {
    await updatePreferences(USER_ID, {
      mutedTypes: ["info", "system"],
    });

    const prefs = await getPreferences(USER_ID);
    expect(prefs.mutedTypes).toEqual(["info", "system"]);
  });

  it("returns the merged preferences", async () => {
    const result = await updatePreferences(USER_ID, {
      emailEnabled: false,
      emailFrequency: "immediate",
    });

    expect(result.emailEnabled).toBe(false);
    expect(result.emailFrequency).toBe("immediate");
    expect(result.inApp).toBe(true); // default preserved
  });

  it("applies multiple sequential updates correctly", async () => {
    await updatePreferences(USER_ID, { emailEnabled: false });
    await updatePreferences(USER_ID, { emailFrequency: "weekly" });

    const prefs = await getPreferences(USER_ID);
    expect(prefs.emailEnabled).toBe(false);
    expect(prefs.emailFrequency).toBe("weekly");
  });
});

// ---------------------------------------------------------------------------
// shouldSendEmail
// ---------------------------------------------------------------------------

describe("shouldSendEmail", () => {
  it("returns true when email is enabled and type is not muted", async () => {
    const result = await shouldSendEmail(USER_ID, "success");

    expect(result).toBe(true);
  });

  it("returns false when emailEnabled is disabled", async () => {
    await updatePreferences(USER_ID, { emailEnabled: false });

    const result = await shouldSendEmail(USER_ID, "success");

    expect(result).toBe(false);
  });

  it("returns false when type is in muted list", async () => {
    await updatePreferences(USER_ID, {
      mutedTypes: ["warning", "info"],
    });

    expect(await shouldSendEmail(USER_ID, "warning")).toBe(false);
    expect(await shouldSendEmail(USER_ID, "info")).toBe(false);
  });

  it("returns true for non-muted type when other types are muted", async () => {
    await updatePreferences(USER_ID, {
      mutedTypes: ["warning"],
    });

    expect(await shouldSendEmail(USER_ID, "success")).toBe(true);
    expect(await shouldSendEmail(USER_ID, "error")).toBe(true);
  });
});
