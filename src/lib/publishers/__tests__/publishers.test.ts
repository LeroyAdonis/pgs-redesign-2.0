import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  getPublisher,
  InstagramPublisher,
  FacebookPublisher,
  TwitterPublisher,
  LinkedInPublisher,
  TikTokPublisher,
  WhatsAppPublisher,
  GoogleBusinessPublisher,
  type PublishOptions,
  type PublishResult,
} from "@/lib/publishers";
import { PLATFORMS } from "@/lib/social/types";
import type { Platform } from "@/lib/social/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal valid PublishOptions object */
function buildOptions(
  overrides: Partial<PublishOptions> = {},
): PublishOptions {
  return {
    postId: "post-123",
    content: "Hello from Purple Glow Social! #Mzansi",
    platform: "facebook",
    accessToken: "test-token-abc",
    ...overrides,
  };
}

/** Create a mock Response that returns the given body as JSON */
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
// Mock global.fetch and logger before each test
// ---------------------------------------------------------------------------

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Mock the logger to prevent console output during tests
vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// ==========================================================================
// Factory Tests
// ==========================================================================

describe("getPublisher factory", () => {
  it("returns correct adapter for each platform", () => {
    const expectedTypes: Record<Platform, unknown> = {
      instagram: InstagramPublisher,
      facebook: FacebookPublisher,
      twitter: TwitterPublisher,
      linkedin: LinkedInPublisher,
      tiktok: TikTokPublisher,
      whatsapp: WhatsAppPublisher,
      google_business: GoogleBusinessPublisher,
    };

    for (const platform of PLATFORMS) {
      const adapter = getPublisher(platform);
      expect(adapter).toBeInstanceOf(expectedTypes[platform]);
      expect(adapter.platform).toBe(platform);
    }
  });

  it("returns cached instances on subsequent calls", () => {
    const a = getPublisher("facebook");
    const b = getPublisher("facebook");
    expect(a).toBe(b);
  });

  it("returns different instances for different platforms", () => {
    const fb = getPublisher("facebook");
    const tw = getPublisher("twitter");
    expect(fb).not.toBe(tw);
    expect(fb.platform).toBe("facebook");
    expect(tw.platform).toBe("twitter");
  });
});

// ==========================================================================
// Content Validation Tests
// ==========================================================================

describe("validateContent", () => {
  const platformLimits: Array<{ platform: Platform; limit: number }> = [
    { platform: "instagram", limit: 2200 },
    { platform: "facebook", limit: 63206 },
    { platform: "twitter", limit: 280 },
    { platform: "linkedin", limit: 3000 },
    { platform: "tiktok", limit: 2200 },
    { platform: "whatsapp", limit: 1024 },
    { platform: "google_business", limit: 1500 },
  ];

  it.each(platformLimits)(
    "$platform validates content within $limit char limit",
    ({ platform, limit }) => {
      const adapter = getPublisher(platform);

      // Valid content
      const validResult = adapter.validateContent("Hello world!");
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      // Content exactly at the limit
      const atLimit = adapter.validateContent("a".repeat(limit));
      expect(atLimit.valid).toBe(true);
      expect(atLimit.errors).toHaveLength(0);
    },
  );

  it.each(platformLimits)(
    "$platform rejects content exceeding $limit char limit",
    ({ platform, limit }) => {
      const adapter = getPublisher(platform);
      const tooLong = adapter.validateContent("a".repeat(limit + 1));
      expect(tooLong.valid).toBe(false);
      expect(tooLong.errors.length).toBeGreaterThan(0);
      expect(tooLong.errors[0]).toContain("exceeds");
    },
  );

  it.each(PLATFORMS)("%s rejects empty content", (platform) => {
    const adapter = getPublisher(platform);

    const empty = adapter.validateContent("");
    expect(empty.valid).toBe(false);
    expect(empty.errors).toContain("Content must not be empty");

    const whitespace = adapter.validateContent("   ");
    expect(whitespace.valid).toBe(false);
    expect(whitespace.errors).toContain("Content must not be empty");
  });
});

// ==========================================================================
// Publish Tests — Facebook
// ==========================================================================

describe("FacebookPublisher.publish", () => {
  it("publishes a text post successfully", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({ id: "fb-post-456" }),
    );

    const adapter = getPublisher("facebook");
    const result = await adapter.publish(
      buildOptions({ platform: "facebook" }),
    );

    expect(result.success).toBe(true);
    expect(result.platformPostId).toBe("fb-post-456");
    expect(result.platformUrl).toContain("facebook.com");
    expect(result.retryable).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/feed");
    expect(init.method).toBe("POST");
  });

  it("publishes a photo post successfully", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({ id: "fb-photo-789" }),
    );

    const adapter = getPublisher("facebook");
    const result = await adapter.publish(
      buildOptions({
        platform: "facebook",
        media: [
          { url: "https://cdn.example.com/photo.jpg", type: "image" },
        ],
      }),
    );

    expect(result.success).toBe(true);
    expect(result.platformPostId).toBe("fb-photo-789");

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("/photos");
  });

  it("returns validation error for empty content", async () => {
    const adapter = getPublisher("facebook");
    const result = await adapter.publish(
      buildOptions({ platform: "facebook", content: "" }),
    );

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("VALIDATION_ERROR");
    expect(result.retryable).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// ==========================================================================
// Publish Tests — Twitter
// ==========================================================================

describe("TwitterPublisher.publish", () => {
  it("publishes a tweet successfully", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({ data: { id: "tweet-111" } }),
    );

    const adapter = getPublisher("twitter");
    const result = await adapter.publish(
      buildOptions({
        platform: "twitter",
        content: "Short tweet!",
      }),
    );

    expect(result.success).toBe(true);
    expect(result.platformPostId).toBe("tweet-111");
    expect(result.platformUrl).toContain("x.com");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/2/tweets");
    expect(init.headers).toHaveProperty("Authorization");
  });

  it("rejects tweets exceeding 280 characters", async () => {
    const adapter = getPublisher("twitter");
    const result = await adapter.publish(
      buildOptions({
        platform: "twitter",
        content: "a".repeat(281),
      }),
    );

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("VALIDATION_ERROR");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("publishes a tweet with media", async () => {
    // First call: media upload, second call: tweet creation
    fetchMock
      .mockResolvedValueOnce(
        mockResponse({ data: { id: "tweet-222" } }),
      )
      .mockResolvedValueOnce(
        mockResponse({ media_id_string: "media-999" }),
      );

    const adapter = getPublisher("twitter");
    const result = await adapter.publish(
      buildOptions({
        platform: "twitter",
        content: "Tweet with image",
        media: [
          { url: "https://cdn.example.com/pic.jpg", type: "image" },
        ],
      }),
    );

    // At least a tweet creation call was made
    expect(fetchMock).toHaveBeenCalled();
  });
});

// ==========================================================================
// Publish Tests — Instagram
// ==========================================================================

describe("InstagramPublisher.publish", () => {
  it("publishes a photo in two steps (container + publish)", async () => {
    // Step 1: create container
    fetchMock.mockResolvedValueOnce(
      mockResponse({ id: "container-100" }),
    );
    // Step 2: publish container
    fetchMock.mockResolvedValueOnce(
      mockResponse({ id: "ig-post-200" }),
    );

    const adapter = getPublisher("instagram");
    const result = await adapter.publish(
      buildOptions({
        platform: "instagram",
        media: [
          { url: "https://cdn.example.com/photo.jpg", type: "image" },
        ],
      }),
    );

    expect(result.success).toBe(true);
    expect(result.platformPostId).toBe("ig-post-200");
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [firstUrl] = fetchMock.mock.calls[0] as [string];
    const [secondUrl] = fetchMock.mock.calls[1] as [string];
    expect(firstUrl).toContain("/media");
    expect(secondUrl).toContain("/media_publish");
  });

  it("returns error when no media is provided", async () => {
    const adapter = getPublisher("instagram");
    const result = await adapter.publish(
      buildOptions({ platform: "instagram" }),
    );

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("MEDIA_REQUIRED");
    expect(result.retryable).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// ==========================================================================
// Publish Tests — LinkedIn
// ==========================================================================

describe("LinkedInPublisher.publish", () => {
  it("publishes a UGC post successfully", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({ id: "urn:li:share:12345" }),
    );

    const adapter = getPublisher("linkedin");
    const result = await adapter.publish(
      buildOptions({ platform: "linkedin" }),
    );

    expect(result.success).toBe(true);
    expect(result.platformPostId).toBe("urn:li:share:12345");
    expect(result.platformUrl).toContain("linkedin.com");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/v2/ugcPosts");
    expect((init.headers as Record<string, string>)["X-Restli-Protocol-Version"]).toBe("2.0.0");
  });
});

// ==========================================================================
// Publish Tests — TikTok
// ==========================================================================

describe("TikTokPublisher.publish", () => {
  it("initialises a video publish successfully", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({ data: { publish_id: "tiktok-pub-001" } }),
    );

    const adapter = getPublisher("tiktok");
    const result = await adapter.publish(
      buildOptions({
        platform: "tiktok",
        media: [
          { url: "https://cdn.example.com/video.mp4", type: "video" },
        ],
      }),
    );

    expect(result.success).toBe(true);
    expect(result.platformPostId).toBe("tiktok-pub-001");

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("/v2/post/publish/video/init");
  });

  it("returns error when no video is attached", async () => {
    const adapter = getPublisher("tiktok");
    const result = await adapter.publish(
      buildOptions({
        platform: "tiktok",
        media: [
          { url: "https://cdn.example.com/photo.jpg", type: "image" },
        ],
      }),
    );

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("VIDEO_REQUIRED");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// ==========================================================================
// Publish Tests — WhatsApp
// ==========================================================================

describe("WhatsAppPublisher.publish", () => {
  it("sends a template message successfully", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({ messages: [{ id: "wamid.abc123" }] }),
    );

    const adapter = getPublisher("whatsapp");
    const result = await adapter.publish(
      buildOptions({ platform: "whatsapp" }),
    );

    expect(result.success).toBe(true);
    expect(result.platformPostId).toBe("wamid.abc123");
    // WhatsApp messages don't have public URLs
    expect(result.platformUrl).toBeUndefined();

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.messaging_product).toBe("whatsapp");
    expect(body.type).toBe("template");
  });
});

// ==========================================================================
// Publish Tests — Google Business
// ==========================================================================

describe("GoogleBusinessPublisher.publish", () => {
  it("creates a local post successfully", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({
        name: "accounts/123/locations/456/localPosts/789",
        searchUrl: "https://search.google.com/local/posts?q=test",
      }),
    );

    const adapter = getPublisher("google_business");
    const result = await adapter.publish(
      buildOptions({ platform: "google_business" }),
    );

    expect(result.success).toBe(true);
    expect(result.platformPostId).toBe("789");
    expect(result.platformUrl).toContain("google.com");

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("/localPosts");
  });
});

// ==========================================================================
// Error Handling Tests
// ==========================================================================

describe("Error handling", () => {
  it("returns retryable result on rate limit (429)", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(
        { error: { message: "Too many requests" } },
        429,
        "Too Many Requests",
      ),
    );

    const adapter = getPublisher("facebook");
    const result = await adapter.publish(
      buildOptions({ platform: "facebook" }),
    );

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("RATE_LIMIT");
    expect(result.retryable).toBe(true);
  });

  it("returns non-retryable result on auth error (401)", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(
        { error: { message: "Invalid token" } },
        401,
        "Unauthorized",
      ),
    );

    const adapter = getPublisher("facebook");
    const result = await adapter.publish(
      buildOptions({ platform: "facebook" }),
    );

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("AUTH_ERROR");
    expect(result.retryable).toBe(false);
  });

  it("returns non-retryable result on forbidden (403)", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(
        { error: { message: "Forbidden" } },
        403,
        "Forbidden",
      ),
    );

    const adapter = getPublisher("twitter");
    const result = await adapter.publish(
      buildOptions({ platform: "twitter", content: "Hello" }),
    );

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("AUTH_ERROR");
    expect(result.retryable).toBe(false);
  });

  it("returns retryable result on server error (500)", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(
        { message: "Internal server error" },
        500,
        "Internal Server Error",
      ),
    );

    const adapter = getPublisher("linkedin");
    const result = await adapter.publish(
      buildOptions({ platform: "linkedin" }),
    );

    expect(result.success).toBe(false);
    expect(result.retryable).toBe(true);
  });

  it("handles network/fetch exceptions gracefully", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network failure"));

    const adapter = getPublisher("facebook");
    const result = await adapter.publish(
      buildOptions({ platform: "facebook" }),
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Network failure");
    expect(result.retryable).toBe(false);
  });

  it("extracts error message from Twitter v2 style response", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(
        { detail: "You are not permitted to perform this action" },
        403,
        "Forbidden",
      ),
    );

    const adapter = getPublisher("twitter");
    const result = await adapter.publish(
      buildOptions({ platform: "twitter", content: "Test" }),
    );

    expect(result.success).toBe(false);
    // AUTH_ERROR for 403
    expect(result.errorCode).toBe("AUTH_ERROR");
  });
});
