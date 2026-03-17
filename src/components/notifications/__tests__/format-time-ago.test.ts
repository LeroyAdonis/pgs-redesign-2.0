/**
 * Tests for formatTimeAgo utility
 *
 * Validates relative time formatting at each boundary:
 * "just now", "Xm ago", "Xh ago", "Xd ago", and full date.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatTimeAgo } from "../format-time-ago";

// Use a fixed "now" so tests are deterministic
const FIXED_NOW = new Date("2025-06-15T12:00:00Z").getTime();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// "just now" — less than 1 minute
// ---------------------------------------------------------------------------

describe("just now (< 1 minute)", () => {
  it("returns 'just now' for 0 seconds ago", () => {
    const date = new Date(FIXED_NOW);
    expect(formatTimeAgo(date)).toBe("just now");
  });

  it("returns 'just now' for 30 seconds ago", () => {
    const date = new Date(FIXED_NOW - 30_000);
    expect(formatTimeAgo(date)).toBe("just now");
  });

  it("returns 'just now' for 59 seconds ago", () => {
    const date = new Date(FIXED_NOW - 59_000);
    expect(formatTimeAgo(date)).toBe("just now");
  });
});

// ---------------------------------------------------------------------------
// "Xm ago" — less than 60 minutes
// ---------------------------------------------------------------------------

describe("Xm ago (< 60 minutes)", () => {
  it("returns '1m ago' for exactly 1 minute ago", () => {
    const date = new Date(FIXED_NOW - 60_000);
    expect(formatTimeAgo(date)).toBe("1m ago");
  });

  it("returns '5m ago' for 5 minutes ago", () => {
    const date = new Date(FIXED_NOW - 5 * 60_000);
    expect(formatTimeAgo(date)).toBe("5m ago");
  });

  it("returns '59m ago' for 59 minutes ago", () => {
    const date = new Date(FIXED_NOW - 59 * 60_000);
    expect(formatTimeAgo(date)).toBe("59m ago");
  });

  it("floors partial minutes", () => {
    // 2 minutes and 45 seconds → "2m ago"
    const date = new Date(FIXED_NOW - (2 * 60_000 + 45_000));
    expect(formatTimeAgo(date)).toBe("2m ago");
  });
});

// ---------------------------------------------------------------------------
// "Xh ago" — less than 24 hours
// ---------------------------------------------------------------------------

describe("Xh ago (< 24 hours)", () => {
  it("returns '1h ago' for exactly 1 hour ago", () => {
    const date = new Date(FIXED_NOW - 60 * 60_000);
    expect(formatTimeAgo(date)).toBe("1h ago");
  });

  it("returns '12h ago' for 12 hours ago", () => {
    const date = new Date(FIXED_NOW - 12 * 60 * 60_000);
    expect(formatTimeAgo(date)).toBe("12h ago");
  });

  it("returns '23h ago' for 23 hours ago", () => {
    const date = new Date(FIXED_NOW - 23 * 60 * 60_000);
    expect(formatTimeAgo(date)).toBe("23h ago");
  });

  it("floors partial hours", () => {
    // 3 hours and 45 minutes → "3h ago"
    const date = new Date(FIXED_NOW - (3 * 60 * 60_000 + 45 * 60_000));
    expect(formatTimeAgo(date)).toBe("3h ago");
  });
});

// ---------------------------------------------------------------------------
// "Xd ago" — less than 30 days
// ---------------------------------------------------------------------------

describe("Xd ago (< 30 days)", () => {
  it("returns '1d ago' for exactly 1 day ago", () => {
    const date = new Date(FIXED_NOW - 24 * 60 * 60_000);
    expect(formatTimeAgo(date)).toBe("1d ago");
  });

  it("returns '7d ago' for 1 week ago", () => {
    const date = new Date(FIXED_NOW - 7 * 24 * 60 * 60_000);
    expect(formatTimeAgo(date)).toBe("7d ago");
  });

  it("returns '29d ago' for 29 days ago", () => {
    const date = new Date(FIXED_NOW - 29 * 24 * 60 * 60_000);
    expect(formatTimeAgo(date)).toBe("29d ago");
  });
});

// ---------------------------------------------------------------------------
// Full date — 30 days or older
// ---------------------------------------------------------------------------

describe("Full date (≥ 30 days)", () => {
  it("returns formatted date for exactly 30 days ago", () => {
    const date = new Date(FIXED_NOW - 30 * 24 * 60 * 60_000);
    const result = formatTimeAgo(date);

    // Should NOT be "Xd ago" format
    expect(result).not.toContain("d ago");
    // Should contain month name and year (en-ZA format)
    expect(result).toMatch(/\d{1,2}\s\w+\s\d{4}/);
  });

  it("returns formatted date for 90 days ago", () => {
    const date = new Date(FIXED_NOW - 90 * 24 * 60 * 60_000);
    const result = formatTimeAgo(date);

    expect(result).not.toContain("ago");
    expect(result).toMatch(/\d{1,2}\s\w+\s\d{4}/);
  });
});

// ---------------------------------------------------------------------------
// Input format handling
// ---------------------------------------------------------------------------

describe("Input format handling", () => {
  it("accepts Date object", () => {
    const date = new Date(FIXED_NOW - 5 * 60_000);
    expect(formatTimeAgo(date)).toBe("5m ago");
  });

  it("accepts ISO 8601 string", () => {
    const isoString = new Date(FIXED_NOW - 5 * 60_000).toISOString();
    expect(formatTimeAgo(isoString)).toBe("5m ago");
  });
});
