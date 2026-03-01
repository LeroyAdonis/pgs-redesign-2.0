/**
 * Tests for AI feedback service
 *
 * Mocks the database to test feedback submission, aggregation,
 * and brand profile updates.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("@/db", () => {
  const mockReturning = vi.fn();
  const mockValues = vi.fn(() => ({ returning: mockReturning }));
  const mockInsert = vi.fn(() => ({ values: mockValues }));

  const mockLimit = vi.fn();
  const mockOrderBy = vi.fn(() => ({ limit: mockLimit }));
  const mockGroupBy = vi.fn();
  const mockWhere = vi.fn((condition) => ({
    orderBy: mockOrderBy,
    limit: mockLimit,
    groupBy: mockGroupBy,
  }));
  const mockFrom = vi.fn(() => ({ where: mockWhere }));
  const mockSelect = vi.fn(() => ({ from: mockFrom }));

  const mockUpdateWhere = vi.fn();
  const mockUpdateSet = vi.fn(() => ({ where: mockUpdateWhere }));
  const mockUpdate = vi.fn(() => ({ set: mockUpdateSet }));

  return {
    db: {
      insert: mockInsert,
      select: mockSelect,
      update: mockUpdate,
    },
    __mockInsert: mockInsert,
    __mockValues: mockValues,
    __mockReturning: mockReturning,
    __mockSelect: mockSelect,
    __mockFrom: mockFrom,
    __mockWhere: mockWhere,
    __mockGroupBy: mockGroupBy,
    __mockOrderBy: mockOrderBy,
    __mockLimit: mockLimit,
    __mockUpdate: mockUpdate,
    __mockUpdateSet: mockUpdateSet,
    __mockUpdateWhere: mockUpdateWhere,
  };
});

// Mock the schema
vi.mock("@/db/schema", () => ({
  aiFeedback: {
    id: "id",
    orgId: "org_id",
    rating: "rating",
    createdAt: "created_at",
  },
  brandProfile: {
    id: "id",
    orgId: "org_id",
    toneFingerprint: "tone_fingerprint",
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
  submitFeedback,
  getFeedbackStats,
  getRecentFeedback,
  updateBrandProfileFromFeedback,
} from "../feedback-service";
import type { AIFeedback } from "../types";

const dbMocks = await import("@/db") as unknown as Record<string, ReturnType<typeof vi.fn>>;

// ── Fixtures ────────────────────────────────────────────────────

const mockFeedback: AIFeedback = {
  orgId: "org_1",
  postId: "post_1",
  userId: "user_1",
  rating: "thumbs_up",
  originalContent: "Generated content here",
  aiModel: "gpt-4o-mini",
  aiPrompt: "Write a post",
  platform: "instagram",
  contentType: "text",
};

// ── Tests ───────────────────────────────────────────────────────

describe("submitFeedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts feedback and returns the row", async () => {
    const mockRow = {
      id: "fb_1",
      orgId: "org_1",
      rating: "thumbs_up",
    };

    dbMocks.__mockReturning.mockResolvedValueOnce([mockRow]);

    const result = await submitFeedback(mockFeedback);

    expect(result).toEqual(mockRow);
    expect(dbMocks.__mockInsert).toHaveBeenCalledOnce();
  });

  it("handles feedback without postId", async () => {
    const feedback: AIFeedback = {
      ...mockFeedback,
      postId: undefined,
    };

    const mockRow = { id: "fb_2", orgId: "org_1", postId: null };
    dbMocks.__mockReturning.mockResolvedValueOnce([mockRow]);

    const result = await submitFeedback(feedback);

    expect(result.postId).toBeNull();
  });

  it("handles edited feedback with editedContent", async () => {
    const feedback: AIFeedback = {
      ...mockFeedback,
      rating: "edited",
      editedContent: "User-edited content",
    };

    const mockRow = {
      id: "fb_3",
      orgId: "org_1",
      rating: "edited",
      editedContent: "User-edited content",
    };
    dbMocks.__mockReturning.mockResolvedValueOnce([mockRow]);

    const result = await submitFeedback(feedback);

    expect(result.rating).toBe("edited");
  });
});

describe("getFeedbackStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aggregates feedback stats correctly", async () => {
    dbMocks.__mockGroupBy.mockResolvedValueOnce([
      { rating: "thumbs_up", count: 10 },
      { rating: "thumbs_down", count: 3 },
      { rating: "edited", count: 7 },
    ]);

    const stats = await getFeedbackStats("org_1");

    expect(stats.total).toBe(20);
    expect(stats.thumbsUp).toBe(10);
    expect(stats.thumbsDown).toBe(3);
    expect(stats.edited).toBe(7);
    // (10 + 7) / 20 = 0.85
    expect(stats.improvementScore).toBe(0.85);
  });

  it("returns zero stats when no feedback exists", async () => {
    dbMocks.__mockGroupBy.mockResolvedValueOnce([]);

    const stats = await getFeedbackStats("org_1");

    expect(stats.total).toBe(0);
    expect(stats.thumbsUp).toBe(0);
    expect(stats.thumbsDown).toBe(0);
    expect(stats.edited).toBe(0);
    expect(stats.improvementScore).toBe(0);
  });

  it("handles single rating type", async () => {
    dbMocks.__mockGroupBy.mockResolvedValueOnce([
      { rating: "thumbs_up", count: 5 },
    ]);

    const stats = await getFeedbackStats("org_1");

    expect(stats.total).toBe(5);
    expect(stats.thumbsUp).toBe(5);
    expect(stats.thumbsDown).toBe(0);
    expect(stats.improvementScore).toBe(1);
  });
});

describe("getRecentFeedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns recent feedback entries", async () => {
    const mockRows = [
      { id: "fb_1", rating: "thumbs_up" },
      { id: "fb_2", rating: "edited" },
    ];

    dbMocks.__mockLimit.mockResolvedValueOnce(mockRows);

    const result = await getRecentFeedback("org_1");

    expect(result).toEqual(mockRows);
    expect(dbMocks.__mockSelect).toHaveBeenCalledOnce();
  });

  it("respects custom limit", async () => {
    dbMocks.__mockLimit.mockResolvedValueOnce([]);

    await getRecentFeedback("org_1", 10);

    expect(dbMocks.__mockLimit).toHaveBeenCalledWith(10);
  });
});

describe("updateBrandProfileFromFeedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when insufficient feedback (< 5)", async () => {
    // First call returns feedback rows (< 5)
    dbMocks.__mockLimit.mockResolvedValueOnce([
      { id: "fb_1", rating: "thumbs_up" },
      { id: "fb_2", rating: "thumbs_up" },
    ]);

    const result = await updateBrandProfileFromFeedback("org_1");

    expect(result).toBe(false);
  });

  it("returns false when feedback signals are inconclusive", async () => {
    // 50/50 split — inconclusive
    const feedback = [
      ...Array(5).fill(null).map((_, i) => ({
        id: `fb_${i}`,
        rating: "thumbs_up",
      })),
      ...Array(5).fill(null).map((_, i) => ({
        id: `fb_neg_${i}`,
        rating: "thumbs_down",
      })),
    ];

    dbMocks.__mockLimit.mockResolvedValueOnce(feedback);

    const result = await updateBrandProfileFromFeedback("org_1");

    expect(result).toBe(false);
  });

  it("returns false when no brand profiles exist", async () => {
    // Strong positive feedback
    const feedback = Array(10).fill(null).map((_, i) => ({
      id: `fb_${i}`,
      rating: "thumbs_up",
    }));

    // First call: feedback rows
    dbMocks.__mockLimit.mockResolvedValueOnce(feedback);

    // Re-setup for second query (brand profiles)
    // For second select().from().where(), need to set up the chain again
    dbMocks.__mockWhere.mockReturnValueOnce({
      orderBy: dbMocks.__mockOrderBy,
      limit: dbMocks.__mockLimit,
      groupBy: dbMocks.__mockGroupBy,
    });

    // Second query for brand profiles returns empty
    dbMocks.__mockWhere.mockResolvedValueOnce([]);

    const result = await updateBrandProfileFromFeedback("org_1");

    expect(result).toBe(false);
  });
});
