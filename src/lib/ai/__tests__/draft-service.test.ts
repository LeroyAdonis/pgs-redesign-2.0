/**
 * Tests for draft persistence service
 *
 * Mocks the database to test saveGeneratedDraft and getGenerationHistory.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("@/db", () => {
  const mockReturning = vi.fn();
  const mockValues = vi.fn(() => ({ returning: mockReturning }));
  const mockInsert = vi.fn(() => ({ values: mockValues }));

  const mockLimit = vi.fn();
  const mockOrderBy = vi.fn(() => ({ limit: mockLimit }));
  const mockWhere = vi.fn(() => ({ orderBy: mockOrderBy }));
  const mockFrom = vi.fn(() => ({ where: mockWhere }));
  const mockSelect = vi.fn(() => ({ from: mockFrom }));

  return {
    db: {
      insert: mockInsert,
      select: mockSelect,
    },
    __mockInsert: mockInsert,
    __mockValues: mockValues,
    __mockReturning: mockReturning,
    __mockSelect: mockSelect,
    __mockFrom: mockFrom,
    __mockWhere: mockWhere,
    __mockOrderBy: mockOrderBy,
    __mockLimit: mockLimit,
  };
});

// Mock the schema
vi.mock("@/db/schema", () => ({
  post: { id: "id", orgId: "org_id", aiGenerated: "ai_generated", createdAt: "created_at" },
  postMedia: { id: "id", postId: "post_id" },
  mediaTypeEnum: { enumValues: ["image", "video", "gif"] },
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

import { saveGeneratedDraft, getGenerationHistory } from "../draft-service";

// Access mock internals
const dbMocks = await import("@/db") as unknown as Record<string, ReturnType<typeof vi.fn>>;

describe("saveGeneratedDraft",() => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts a post with aiGenerated=true", async () => {
    const mockPost = {
      id: "post_123",
      orgId: "org_1",
      content: "Test content",
      aiGenerated: true,
    };

    dbMocks.__mockReturning.mockResolvedValueOnce([mockPost]);

    const result = await saveGeneratedDraft(
      "org_1",
      "user_1",
      "Test content",
      "instagram",
      undefined,
      "Write a post",
      "gpt-4o-mini",
    );

    expect(result.postId).toBe("post_123");
    expect(result.mediaIds).toEqual([]);
    expect(dbMocks.__mockInsert).toHaveBeenCalledOnce();
  });

  it("inserts media when provided", async () => {
    const mockPost = { id: "post_456", orgId: "org_1" };
    const mockMedia = [
      { id: "media_1" },
      { id: "media_2" },
    ];

    // First call returns the post, second call returns media
    dbMocks.__mockReturning
      .mockResolvedValueOnce([mockPost])
      .mockResolvedValueOnce(mockMedia);

    const result = await saveGeneratedDraft(
      "org_1",
      "user_1",
      "Content with media",
      "facebook",
      [
        { mediaType: "image", url: "https://example.com/img1.png" },
        { mediaType: "image", url: "https://example.com/img2.png" },
      ],
      "Generate images",
      "dall-e-3",
    );

    expect(result.postId).toBe("post_456");
    expect(result.mediaIds).toEqual(["media_1", "media_2"]);
    expect(dbMocks.__mockInsert).toHaveBeenCalledTimes(2);
  });

  it("returns empty mediaIds when no media provided", async () => {
    const mockPost = { id: "post_789", orgId: "org_1" };
    dbMocks.__mockReturning.mockResolvedValueOnce([mockPost]);

    const result = await saveGeneratedDraft(
      "org_1",
      "user_1",
      "Text only",
      "twitter",
    );

    expect(result.mediaIds).toEqual([]);
  });
});

describe("getGenerationHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches AI-generated drafts ordered by createdAt desc", async () => {
    const mockDrafts = [
      { id: "p1", content: "Post 1", aiGenerated: true },
      { id: "p2", content: "Post 2", aiGenerated: true },
    ];

    dbMocks.__mockLimit.mockResolvedValueOnce(mockDrafts);

    const result = await getGenerationHistory("org_1");

    expect(result).toEqual(mockDrafts);
    expect(dbMocks.__mockSelect).toHaveBeenCalledOnce();
  });

  it("respects custom limit", async () => {
    dbMocks.__mockLimit.mockResolvedValueOnce([]);

    await getGenerationHistory("org_1", 5);

    expect(dbMocks.__mockLimit).toHaveBeenCalledWith(5);
  });

  it("defaults to limit of 20", async () => {
    dbMocks.__mockLimit.mockResolvedValueOnce([]);

    await getGenerationHistory("org_1");

    expect(dbMocks.__mockLimit).toHaveBeenCalledWith(20);
  });
});
