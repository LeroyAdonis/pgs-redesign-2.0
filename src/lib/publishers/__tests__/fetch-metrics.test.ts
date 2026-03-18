/**
 * Tests for publisher fetchMetrics
 *
 * Tests the base adapter's fetchMetrics wrapper (try/catch, null on error)
 * and each platform adapter's doFetchMetrics with mocked API responses.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getPublisher,
  TwitterPublisher,
  FacebookPublisher,
  InstagramPublisher,
  LinkedInPublisher,
  TikTokPublisher,
  WhatsAppPublisher,
  GoogleBusinessPublisher,
  type PublisherAdapter,
} from "@/lib/publishers";
import { PLATFORMS } from "@/lib/social/types";
import type { Platform } from "@/lib/social/types";

// ---------------------------------------------------------------------------
// Mock logger to suppress output during tests
// ---------------------------------------------------------------------------

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockResponse(
  body: unknown,
  status = 200,
  statusText = "OK",
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: () => Promise.resolve(body),
    headers: new Headers(),
    redirected: false,
    type: "basic" as ResponseType,
    url: "",
    clone: () => mockResponse(body, status, statusText),
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    text: () => Promise.resolve(JSON.stringify(body)),
    bytes: () => Promise.resolve(new Uint8Array()),
  } as Response;
}

// ---------------------------------------------------------------------------
// Mock global.fetch before each test
// ---------------------------------------------------------------------------

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ==========================================================================
// Base adapter fetchMetrics wrapper
// ==========================================================================

describe("BasePublisherAdapter.fetchMetrics", () => {
  it("returns metrics on success (Twitter)", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({
        data: {
          public_metrics: {
            retweet_count: 10,
            reply_count: 5,
            like_count: 42,
            quote_count: 3,
            impression_count: 5000,
            bookmark_count: 7,
          },
        },
      }),
    );

    const adapter = new TwitterPublisher();
    const result = await adapter.fetchMetrics({
      platformPostId: "tweet-123",
      accessToken: "test-token",
    });

    expect(result).not.toBeNull();
    expect(result!.impressions).toBe(5000);
    expect(result!.likes).toBe(42);
    expect(result!.shares).toBe(13); // retweet_count + quote_count
    expect(result!.comments).toBe(5);
  });

  it("returns null on error (doFetchMetrics throws)", async () => {
    const adapter = new TwitterPublisher();

    fetchMock.mockRejectedValueOnce(new Error("API down"));

    const result = await adapter.fetchMetrics({
      platformPostId: "tweet-fail",
      accessToken: "bad-token",
    });

    expect(result).toBeNull();
  });
});

// ==========================================================================
// Twitter metrics
// ==========================================================================

describe("TwitterPublisher.doFetchMetrics", () => {
  it("maps public_metrics correctly", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({
        data: {
          public_metrics: {
            retweet_count: 100,
            reply_count: 25,
            like_count: 500,
            quote_count: 15,
            impression_count: 50000,
            bookmark_count: 30,
          },
        },
      }),
    );

    const adapter = new TwitterPublisher();
    const result = await adapter.fetchMetrics({
      platformPostId: "tweet-456",
      accessToken: "tok",
    });

    expect(result).not.toBeNull();
    expect(result!.impressions).toBe(50000);
    expect(result!.reach).toBe(50000);
    expect(result!.likes).toBe(500);
    expect(result!.shares).toBe(115); // 100 retweets + 15 quotes
    expect(result!.comments).toBe(25);
    expect(result!.clicks).toBe(0);
  });
});

// ==========================================================================
// Facebook metrics
// ==========================================================================

describe("FacebookPublisher.doFetchMetrics", () => {
  it("maps insights, likes, comments, shares correctly", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({
        insights: {
          data: [
            { name: "post_impressions", values: [{ value: 12000 }] },
            { name: "post_impressions_unique", values: [{ value: 8500 }] },
          ],
        },
        likes: { summary: { total_count: 320 } },
        comments: { summary: { total_count: 45 } },
        shares: { count: 28 },
      }),
    );

    const adapter = new FacebookPublisher();
    const result = await adapter.fetchMetrics({
      platformPostId: "fb-post-789",
      accessToken: "tok",
    });

    expect(result).not.toBeNull();
    expect(result!.impressions).toBe(12000);
    expect(result!.reach).toBe(8500);
    expect(result!.likes).toBe(320);
    expect(result!.shares).toBe(28);
    expect(result!.comments).toBe(45);
  });

  it("handles missing optional fields gracefully", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({}),
    );

    const adapter = new FacebookPublisher();
    const result = await adapter.fetchMetrics({
      platformPostId: "fb-post-empty",
      accessToken: "tok",
    });

    expect(result).not.toBeNull();
    expect(result!.impressions).toBe(0);
    expect(result!.likes).toBe(0);
  });
});

// ==========================================================================
// Instagram metrics
// ==========================================================================

describe("InstagramPublisher.doFetchMetrics", () => {
  it("maps insights metrics correctly", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({
        data: [
          { name: "impressions", values: [{ value: 15000 }] },
          { name: "reach", values: [{ value: 12000 }] },
          { name: "engagement", values: [{ value: 850 }] },
          { name: "saved", values: [{ value: 45 }] },
        ],
      }),
    );

    const adapter = new InstagramPublisher();
    const result = await adapter.fetchMetrics({
      platformPostId: "ig-media-001",
      accessToken: "tok",
    });

    expect(result).not.toBeNull();
    expect(result!.impressions).toBe(15000);
    expect(result!.reach).toBe(12000);
    expect(result!.clicks).toBe(850);
    expect(result!.likes).toBe(0); // Not available via this endpoint
    expect(result!.shares).toBe(0);
    expect(result!.comments).toBe(0);
  });
});

// ==========================================================================
// LinkedIn metrics
// ==========================================================================

describe("LinkedInPublisher.doFetchMetrics", () => {
  it("maps socialActions data correctly", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({
        likesSummary: { totalLikes: 150, likedByCurrentUser: false },
        commentsSummary: { totalFirstLevelComments: 35 },
        shareStatistics: { shareCount: 20, commentCount: 35, reactionCount: 150 },
      }),
    );

    const adapter = new LinkedInPublisher();
    const result = await adapter.fetchMetrics({
      platformPostId: "urn:li:share:99999",
      accessToken: "tok",
    });

    expect(result).not.toBeNull();
    expect(result!.likes).toBe(150);
    expect(result!.comments).toBe(35);
    expect(result!.shares).toBe(20);
    expect(result!.impressions).toBe(0);
    expect(result!.reach).toBe(0);
  });
});

// ==========================================================================
// TikTok metrics
// ==========================================================================

describe("TikTokPublisher.doFetchMetrics", () => {
  it("maps video query response correctly", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({
        data: {
          videos: [
            {
              view_count: 100000,
              like_count: 5000,
              comment_count: 350,
              share_count: 200,
            },
          ],
        },
      }),
    );

    const adapter = new TikTokPublisher();
    const result = await adapter.fetchMetrics({
      platformPostId: "tiktok-vid-123",
      accessToken: "tok",
    });

    expect(result).not.toBeNull();
    expect(result!.impressions).toBe(100000);
    expect(result!.reach).toBe(100000);
    expect(result!.likes).toBe(5000);
    expect(result!.shares).toBe(200);
    expect(result!.comments).toBe(350);
  });
});

// ==========================================================================
// WhatsApp metrics
// ==========================================================================

describe("WhatsAppPublisher.doFetchMetrics", () => {
  it("returns zeroed metrics (platform limitation)", async () => {
    // WhatsApp doesn't require a fetch call — returns zeros directly
    const adapter = new WhatsAppPublisher();
    const result = await adapter.fetchMetrics({
      platformPostId: "wamid.abc123",
      accessToken: "tok",
    });

    expect(result).not.toBeNull();
    expect(result!.impressions).toBe(0);
    expect(result!.reach).toBe(0);
    expect(result!.likes).toBe(0);
    expect(result!.shares).toBe(0);
    expect(result!.comments).toBe(0);
    expect(result!.clicks).toBe(0);
  });
});

// ==========================================================================
// Google Business metrics
// ==========================================================================

describe("GoogleBusinessPublisher.doFetchMetrics", () => {
  it("returns zeroed metrics (API limitation)", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({
        name: "accounts/me/locations/me/localPosts/123",
        topicType: "STANDARD",
        state: "LIVE",
      }),
    );

    const adapter = new GoogleBusinessPublisher();
    const result = await adapter.fetchMetrics({
      platformPostId: "123",
      accessToken: "tok",
    });

    expect(result).not.toBeNull();
    expect(result!.impressions).toBe(0);
    expect(result!.likes).toBe(0);
  });
});

// ==========================================================================
// All platforms return non-negative metrics
// ==========================================================================

describe("Platform metrics non-negative", () => {
  it.each(PLATFORMS)(
    "%s returns non-negative metrics",
    async (platform: Platform) => {
      // Set up appropriate mocks for each platform
      switch (platform) {
        case "twitter":
          fetchMock.mockResolvedValueOnce(
            mockResponse({
              data: {
                public_metrics: {
                  retweet_count: 0, reply_count: 0, like_count: 0,
                  quote_count: 0, impression_count: 0, bookmark_count: 0,
                },
              },
            }),
          );
          break;
        case "facebook":
          fetchMock.mockResolvedValueOnce(
            mockResponse({
              insights: { data: [{ name: "post_impressions", values: [{ value: 0 }] }] },
              likes: { summary: { total_count: 0 } },
            }),
          );
          break;
        case "instagram":
          fetchMock.mockResolvedValueOnce(
            mockResponse({ data: [{ name: "impressions", values: [{ value: 0 }] }] }),
          );
          break;
        case "linkedin":
          fetchMock.mockResolvedValueOnce(
            mockResponse({ likesSummary: { totalLikes: 0 } }),
          );
          break;
        case "tiktok":
          fetchMock.mockResolvedValueOnce(
            mockResponse({ data: { videos: [{ view_count: 0, like_count: 0, comment_count: 0, share_count: 0 }] } }),
          );
          break;
        case "google_business":
          fetchMock.mockResolvedValueOnce(
            mockResponse({ name: "accounts/me/locations/me/localPosts/1" }),
          );
          break;
        case "whatsapp":
          // No fetch call needed
          break;
      }

      const adapter = getPublisher(platform);
      const result = await adapter.fetchMetrics({
        platformPostId: `${platform}-post-456`,
        accessToken: "test-token",
      });

      expect(result).not.toBeNull();
      expect(result!.impressions).toBeGreaterThanOrEqual(0);
      expect(result!.reach).toBeGreaterThanOrEqual(0);
      expect(result!.likes).toBeGreaterThanOrEqual(0);
      expect(result!.shares).toBeGreaterThanOrEqual(0);
      expect(result!.comments).toBeGreaterThanOrEqual(0);
      expect(result!.clicks).toBeGreaterThanOrEqual(0);
    },
  );
});
