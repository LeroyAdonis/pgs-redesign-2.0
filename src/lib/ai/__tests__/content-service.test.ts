/**
 * Tests for the AI content generation orchestrator
 *
 * Mocks the puter-client to test the orchestration flow:
 * prompt building → generation → post-processing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the openrouter-client module (used by content-service for AI generation)
vi.mock("../openrouter-client", () => ({
  generateText: vi.fn(),
  generateImage: vi.fn(),
  generateVideo: vi.fn(),
  isOpenRouterConfigured: vi.fn(() => true),
}));

import {
  generatePostContent,
  generatePostImage,
  generatePostVideo,
} from "../content-service";
import { generateText, generateImage, generateVideo } from "../openrouter-client";
import type {
  TextGenerationRequest,
  ImageGenerationRequest,
  VideoGenerationRequest,
  BrandContext,
} from "../types";

// ── Fixtures ────────────────────────────────────────────────────

const textRequest: TextGenerationRequest = {
  prompt: "Promote our weekend braai special",
  platform: "instagram",
  contentType: "text",
};

const imageRequest: ImageGenerationRequest = {
  prompt: "A sizzling braai with mountain backdrop",
  platform: "instagram",
  contentType: "image",
};

const videoRequest: VideoGenerationRequest = {
  prompt: "Braai preparation timelapse",
  platform: "tiktok",
  contentType: "video",
};

const brandProfile: BrandContext = {
  toneFingerprint: {
    formal: 0.1,
    casual: 0.9,
    humorous: 0.7,
    professional: 0.2,
    inspirational: 0.5,
    educational: 0.1,
  },
  language: "en",
};

// ── Setup ───────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Text generation ─────────────────────────────────────────────

describe("generatePostContent", () => {
  it("returns a successful result with content", async () => {
    vi.mocked(generateText).mockResolvedValueOnce({
      content: "🔥 Weekend braai special! Join us for lekker vibes #Braai #Mzansi",
      model: "gpt-4o-mini",
    });

    const result = await generatePostContent(textRequest);

    expect(result.success).toBe(true);
    expect(result.contentType).toBe("text");
    expect(result.content).toContain("braai");
    expect(result.model).toBe("gpt-4o-mini");
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("extracts hashtags from generated content", async () => {
    vi.mocked(generateText).mockResolvedValueOnce({
      content: "Join us! #Braai #Weekend #Mzansi",
      model: "gpt-4o-mini",
    });

    const result = await generatePostContent(textRequest);

    expect(result.hashtags).toContain("#Braai");
    expect(result.hashtags).toContain("#Mzansi");
  });

  it("appends SA hashtags when SA culture is enabled", async () => {
    vi.mocked(generateText).mockResolvedValueOnce({
      content: "Lekker braai this weekend!",
      model: "gpt-4o-mini",
    });

    const result = await generatePostContent(textRequest);

    // Should have suggested hashtags appended
    expect(result.hashtags.length).toBeGreaterThan(0);
    expect(result.content).toContain("#");
  });

  it("calculates a cultural score", async () => {
    vi.mocked(generateText).mockResolvedValueOnce({
      content: "Lekker braai in Joburg this weekend! #Mzansi #Braai",
      model: "gpt-4o-mini",
    });

    const result = await generatePostContent(textRequest);

    expect(result.culturalScore).toBeGreaterThanOrEqual(0);
    expect(result.culturalScore).toBeLessThanOrEqual(1);
  });

  it("passes brand profile to prompt builder", async () => {
    vi.mocked(generateText).mockResolvedValueOnce({
      content: "Casual braai vibes!",
      model: "gpt-4o-mini",
    });

    const result = await generatePostContent(textRequest, brandProfile);

    expect(result.success).toBe(true);
    // The prompt should have been built with brand context
    expect(vi.mocked(generateText)).toHaveBeenCalledOnce();
  });

  it("returns error result on generation failure", async () => {
    vi.mocked(generateText).mockRejectedValueOnce(
      new Error("API rate limit exceeded"),
    );

    const result = await generatePostContent(textRequest);

    expect(result.success).toBe(false);
    expect(result.error).toBe("API rate limit exceeded");
    expect(result.content).toBe("");
    expect(result.culturalScore).toBe(0);
  });

  it("handles non-Error thrown values", async () => {
    vi.mocked(generateText).mockRejectedValueOnce("String error");

    const result = await generatePostContent(textRequest);

    expect(result.success).toBe(false);
    expect(result.error).toBe("String error");
  });
});

// ── Image generation ────────────────────────────────────────────

describe("generatePostImage", () => {
  it("returns a successful result with image URL", async () => {
    vi.mocked(generateImage).mockResolvedValueOnce({
      imageDataUrl: "data:image/png;base64,mockimage",
      model: "dall-e-3",
    });

    const result = await generatePostImage(imageRequest);

    expect(result.success).toBe(true);
    expect(result.contentType).toBe("image");
    expect(result.imageDataUrl).toBe("data:image/png;base64,mockimage");
    expect(result.model).toBe("dall-e-3");
  });

  it("uses default dimensions when not specified", async () => {
    vi.mocked(generateImage).mockResolvedValueOnce({
      imageDataUrl: "data:image/png;base64,test",
      model: "default",
    });

    const result = await generatePostImage(imageRequest);

    // Instagram default is Square Post (1080x1080)
    expect(result.dimensions).toBeDefined();
    expect(result.dimensions.width).toBe(1080);
  });

  it("uses provided dimensions", async () => {
    vi.mocked(generateImage).mockResolvedValueOnce({
      imageDataUrl: "data:image/png;base64,test",
      model: "default",
    });

    const request: ImageGenerationRequest = {
      ...imageRequest,
      dimensions: { width: 1200, height: 630, label: "Facebook Landscape" },
    };

    const result = await generatePostImage(request);

    expect(result.dimensions.width).toBe(1200);
    expect(result.dimensions.height).toBe(630);
  });

  it("returns error result on failure", async () => {
    vi.mocked(generateImage).mockRejectedValueOnce(
      new Error("Image generation failed"),
    );

    const result = await generatePostImage(imageRequest);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Image generation failed");
    expect(result.imageDataUrl).toBe("");
  });
});

// ── Video generation ────────────────────────────────────────────

describe("generatePostVideo", () => {
  it("returns a successful result with video URL", async () => {
    vi.mocked(generateVideo).mockResolvedValueOnce({
      videoUrl: "blob:https://example.com/video-mock",
      model: "default",
    });

    const result = await generatePostVideo(videoRequest);

    expect(result.success).toBe(true);
    expect(result.contentType).toBe("video");
    expect(result.videoUrl).toBe("blob:https://example.com/video-mock");
  });

  it("uses default TikTok dimensions", async () => {
    vi.mocked(generateVideo).mockResolvedValueOnce({
      videoUrl: "blob:test",
      model: "default",
    });

    const result = await generatePostVideo(videoRequest);

    // TikTok default is Vertical (9:16) at 1080x1920
    expect(result.dimensions).toBeDefined();
    expect(result.dimensions.width).toBe(1080);
    expect(result.dimensions.height).toBe(1920);
  });

  it("returns error result on failure", async () => {
    vi.mocked(generateVideo).mockRejectedValueOnce(
      new Error("Video generation timeout"),
    );

    const result = await generatePostVideo(videoRequest);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Video generation timeout");
    expect(result.videoUrl).toBe("");
  });
});
