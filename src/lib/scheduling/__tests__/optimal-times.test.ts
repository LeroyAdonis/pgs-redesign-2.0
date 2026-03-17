/**
 * Tests for optimal-times service
 *
 * Tests the default time slot generation, optimal time analysis,
 * and next-slot suggestion logic.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("@/db", () => {
  const mockLimit = vi.fn();
  const mockOrderBy = vi.fn(() => ({ limit: mockLimit }));
  const mockWhere = vi.fn(() => ({ orderBy: mockOrderBy }));
  const mockInnerJoin2 = vi.fn(() => ({ where: mockWhere }));
  const mockInnerJoin1 = vi.fn(() => ({ innerJoin: mockInnerJoin2 }));
  const mockFrom = vi.fn(() => ({ innerJoin: mockInnerJoin1 }));
  const mockSelect = vi.fn(() => ({ from: mockFrom }));

  return {
    db: {
      select: mockSelect,
    },
    __mockSelect: mockSelect,
    __mockFrom: mockFrom,
    __mockInnerJoin1: mockInnerJoin1,
    __mockInnerJoin2: mockInnerJoin2,
    __mockWhere: mockWhere,
    __mockOrderBy: mockOrderBy,
    __mockLimit: mockLimit,
  };
});

// Mock schema
vi.mock("@/db/schema", () => ({
  analytic: {
    postScheduleId: "post_schedule_id",
    engagementRate: "engagement_rate",
    impressions: "impressions",
    likes: "likes",
    comments: "comments",
    shares: "shares",
    fetchedAt: "fetched_at",
  },
  postSchedule: {
    id: "id",
    postId: "post_id",
    scheduledAt: "scheduled_at",
  },
  post: {
    id: "id",
    orgId: "org_id",
    platform: "platform",
  },
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import {
  getOptimalTimes,
  suggestNextSlot,
  getDefaultSlots,
  getNextOccurrence,
} from "../optimal-times";

const dbMocks = (await import("@/db")) as unknown as Record<
  string,
  ReturnType<typeof vi.fn>
>;

describe("getDefaultSlots", () => {
  it("returns slots sorted by engagement score descending", () => {
    const slots = getDefaultSlots("instagram");
    expect(slots.length).toBeGreaterThan(0);

    for (let i = 1; i < slots.length; i++) {
      expect(slots[i]!.engagementScore).toBeLessThanOrEqual(
        slots[i - 1]!.engagementScore,
      );
    }
  });

  it("only includes weekday slots (Mon–Fri)", () => {
    const slots = getDefaultSlots("facebook");
    for (const slot of slots) {
      expect(slot.dayOfWeek).toBeGreaterThanOrEqual(1);
      expect(slot.dayOfWeek).toBeLessThanOrEqual(5);
    }
  });

  it("includes 4 default hours per day", () => {
    const slots = getDefaultSlots("twitter");
    const hoursByDay = new Map<number, Set<number>>();

    for (const slot of slots) {
      if (!hoursByDay.has(slot.dayOfWeek)) {
        hoursByDay.set(slot.dayOfWeek, new Set());
      }
      hoursByDay.get(slot.dayOfWeek)!.add(slot.hour);
    }

    for (const [, hours] of hoursByDay) {
      expect(hours.size).toBe(4);
      expect(hours.has(8)).toBe(true);
      expect(hours.has(12)).toBe(true);
      expect(hours.has(17)).toBe(true);
      expect(hours.has(19)).toBe(true);
    }
  });

  it("sets the correct platform on all slots", () => {
    const slots = getDefaultSlots("linkedin");
    for (const slot of slots) {
      expect(slot.platform).toBe("linkedin");
    }
  });

  it("generates engagement scores between 0 and 1", () => {
    const slots = getDefaultSlots("instagram");
    for (const slot of slots) {
      expect(slot.engagementScore).toBeGreaterThanOrEqual(0);
      expect(slot.engagementScore).toBeLessThanOrEqual(1);
    }
  });
});

describe("getNextOccurrence", () => {
  it("finds the next Wednesday at 12 SAST from a Monday", () => {
    // Monday Jan 6, 2025 at 00:00 UTC
    const after = new Date("2025-01-06T00:00:00Z");
    const result = getNextOccurrence(after, 3, 12); // Wed, 12 SAST = 10 UTC

    expect(result.getUTCDay()).toBe(3); // Wednesday
    expect(result.getUTCHours()).toBe(10); // 12 SAST = 10 UTC
    expect(result > after).toBe(true);
  });

  it("advances to next week if target day has passed", () => {
    // Friday Jan 10, 2025 at 15:00 UTC
    const after = new Date("2025-01-10T15:00:00Z");
    const result = getNextOccurrence(after, 1, 8); // Monday, 8 SAST = 6 UTC

    expect(result.getUTCDay()).toBe(1); // Monday
    expect(result > after).toBe(true);
  });

  it("advances to next week if same day but past the hour", () => {
    // Wednesday Jan 8, 2025 at 14:00 UTC (16:00 SAST)
    const after = new Date("2025-01-08T14:00:00Z");
    const result = getNextOccurrence(after, 3, 12); // Wed, 12 SAST = 10 UTC

    // Should get the NEXT Wednesday since 12 SAST already passed
    expect(result.getUTCDay()).toBe(3);
    expect(result > after).toBe(true);
  });
});

describe("getOptimalTimes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns default slots when insufficient analytics data", async () => {
    // Return fewer than 10 rows
    dbMocks.__mockLimit.mockResolvedValueOnce([
      { scheduledAt: new Date(), engagementRate: 0.5, impressions: 100, likes: 10, comments: 2, shares: 1 },
    ]);

    const slots = await getOptimalTimes("org_1", "instagram");

    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0]!.platform).toBe("instagram");
  });

  it("computes slots from analytics data when sufficient data exists", async () => {
    // Generate 15 analytics rows spread across different days/hours
    const rows = [];
    for (let i = 0; i < 15; i++) {
      const date = new Date("2025-01-06T10:00:00Z"); // Monday 12 SAST
      date.setDate(date.getDate() + (i % 7));
      date.setUTCHours(8 + (i % 4) * 3); // 8, 11, 14, 17 UTC

      rows.push({
        scheduledAt: date,
        engagementRate: 0.01 + (i * 0.005),
        impressions: 100 + i * 50,
        likes: 10 + i * 3,
        comments: 2 + i,
        shares: 1 + i,
      });
    }

    dbMocks.__mockLimit.mockResolvedValueOnce(rows);

    const slots = await getOptimalTimes("org_1", "instagram");

    expect(slots.length).toBeGreaterThan(0);
    // Should be sorted by engagement score descending
    for (let i = 1; i < slots.length; i++) {
      expect(slots[i]!.engagementScore).toBeLessThanOrEqual(
        slots[i - 1]!.engagementScore,
      );
    }
  });

  it("returns defaults on database error", async () => {
    dbMocks.__mockLimit.mockRejectedValueOnce(new Error("DB connection failed"));

    const slots = await getOptimalTimes("org_1", "twitter");

    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0]!.platform).toBe("twitter");
  });
});

describe("suggestNextSlot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a date in the future", async () => {
    // Use defaults (insufficient data)
    dbMocks.__mockLimit.mockResolvedValueOnce([]);

    const after = new Date("2025-01-06T08:00:00Z");
    const result = await suggestNextSlot("org_1", "instagram", after);

    expect(result > after).toBe(true);
  });

  it("returns a valid Date object", async () => {
    dbMocks.__mockLimit.mockResolvedValueOnce([]);

    const after = new Date();
    const result = await suggestNextSlot("org_1", "facebook", after);

    expect(result).toBeInstanceOf(Date);
    expect(isNaN(result.getTime())).toBe(false);
  });
});
