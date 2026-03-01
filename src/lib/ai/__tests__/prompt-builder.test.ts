/**
 * Tests for SA-aware prompt construction
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildTextPrompt, buildImagePrompt, buildVideoPrompt } from "../prompt-builder";
import type {
  TextGenerationRequest,
  ImageGenerationRequest,
  VideoGenerationRequest,
  BrandContext,
} from "../types";

// ── Fixtures ────────────────────────────────────────────────────

const baseTextRequest: TextGenerationRequest = {
  prompt: "Write a post about our new coffee blend",
  platform: "instagram",
  contentType: "text",
};

const baseImageRequest: ImageGenerationRequest = {
  prompt: "A vibrant coffee cup in a Cape Town café",
  platform: "instagram",
  contentType: "image",
};

const baseVideoRequest: VideoGenerationRequest = {
  prompt: "Show our coffee being brewed",
  platform: "tiktok",
  contentType: "video",
};

const mockBrandProfile: BrandContext = {
  toneFingerprint: {
    formal: 0.2,
    casual: 0.8,
    humorous: 0.6,
    professional: 0.3,
    inspirational: 0.7,
    educational: 0.1,
  },
  visualStyle: {
    colorPalette: ["#FF6B35", "#FFD700", "#2E8B57"],
    filterPreferences: ["warm", "high-contrast"],
    imageTypes: ["lifestyle", "product-shot"],
  },
  language: "en",
  hashtagPatterns: [
    { hashtag: "#CoffeeLover", frequency: 15 },
    { hashtag: "#CapeTownCafe", frequency: 10 },
    { hashtag: "#MorningBrew", frequency: 8 },
  ],
  vocabularyClusters: [
    { category: "coffee", words: ["blend", "roast", "aroma", "barista", "brew"] },
    { category: "lifestyle", words: ["vibe", "chill", "enjoy", "moment"] },
  ],
};

// ── Text prompt tests ───────────────────────────────────────────

describe("buildTextPrompt", () => {
  it("includes the user prompt", () => {
    const result = buildTextPrompt(baseTextRequest);
    expect(result).toContain("Write a post about our new coffee blend");
  });

  it("includes platform name", () => {
    const result = buildTextPrompt(baseTextRequest);
    expect(result).toContain("instagram");
  });

  it("includes SA cultural context by default", () => {
    const result = buildTextPrompt(baseTextRequest);
    expect(result).toContain("South African Cultural Context");
  });

  it("includes SA slang references", () => {
    const result = buildTextPrompt(baseTextRequest);
    expect(result).toContain("lekker");
  });

  it("includes SA city references", () => {
    const result = buildTextPrompt(baseTextRequest);
    expect(result).toContain("Johannesburg");
  });

  it("suggests SA hashtags", () => {
    const result = buildTextPrompt(baseTextRequest);
    expect(result).toContain("#Mzansi");
  });

  it("omits SA cultural context when disabled", () => {
    const request: TextGenerationRequest = {
      ...baseTextRequest,
      includeSACulture: false,
    };
    const result = buildTextPrompt(request);
    expect(result).not.toContain("South African Cultural Context");
  });

  it("sets correct character limit for Twitter", () => {
    const request: TextGenerationRequest = {
      ...baseTextRequest,
      platform: "twitter",
    };
    const result = buildTextPrompt(request);
    expect(result).toContain("280");
  });

  it("respects custom maxLength", () => {
    const request: TextGenerationRequest = {
      ...baseTextRequest,
      maxLength: 500,
    };
    const result = buildTextPrompt(request);
    expect(result).toContain("500");
  });

  it("includes emoji instruction by default", () => {
    const result = buildTextPrompt(baseTextRequest);
    expect(result).toContain("emoji");
  });

  it("respects hashtag count preference", () => {
    const request: TextGenerationRequest = {
      ...baseTextRequest,
      hashtagCount: 3,
    };
    const result = buildTextPrompt(request);
    expect(result).toContain("3");
  });

  it("instructs to write in the requested language", () => {
    const request: TextGenerationRequest = {
      ...baseTextRequest,
      language: "zu",
    };
    const result = buildTextPrompt(request);
    expect(result).toContain("isiZulu");
  });

  it("instructs to write in Afrikaans when specified", () => {
    const request: TextGenerationRequest = {
      ...baseTextRequest,
      language: "af",
    };
    const result = buildTextPrompt(request);
    expect(result).toContain("Afrikaans");
  });

  it("includes language context in SA block for non-English", () => {
    const request: TextGenerationRequest = {
      ...baseTextRequest,
      language: "xh",
    };
    const result = buildTextPrompt(request);
    expect(result).toContain("isiXhosa");
    expect(result).toContain("11 official languages");
  });

  it("includes brand tone when profile is provided", () => {
    const result = buildTextPrompt(baseTextRequest, mockBrandProfile);
    // casual (0.8) and inspirational (0.7) should be "strongly"
    expect(result).toContain("strongly casual");
  });

  it("includes brand vocabulary when profile is provided", () => {
    const result = buildTextPrompt(baseTextRequest, mockBrandProfile);
    expect(result).toContain("coffee");
    expect(result).toContain("blend");
  });

  it("includes brand hashtag preferences", () => {
    const result = buildTextPrompt(baseTextRequest, mockBrandProfile);
    expect(result).toContain("#CoffeeLover");
  });

  it("defaults to English when no language specified", () => {
    const result = buildTextPrompt(baseTextRequest);
    expect(result).toContain("English");
  });

  it("ends with instruction to only output the post", () => {
    const result = buildTextPrompt(baseTextRequest);
    expect(result).toContain("ONLY the social media post content");
  });

  it("handles brand profile with null fields gracefully", () => {
    const emptyProfile: BrandContext = {
      toneFingerprint: null,
      visualStyle: null,
      language: "en",
      hashtagPatterns: null,
      vocabularyClusters: null,
    };
    const result = buildTextPrompt(baseTextRequest, emptyProfile);
    expect(result).toBeTruthy();
    expect(result).toContain("Write a post about our new coffee blend");
  });
});

// ── Image prompt tests ──────────────────────────────────────────

describe("buildImagePrompt", () => {
  it("includes the user prompt", () => {
    const result = buildImagePrompt(baseImageRequest);
    expect(result).toContain("A vibrant coffee cup in a Cape Town café");
  });

  it("includes SA visual context by default", () => {
    const result = buildImagePrompt(baseImageRequest);
    expect(result).toContain("South African");
  });

  it("omits SA context when disabled", () => {
    const request: ImageGenerationRequest = {
      ...baseImageRequest,
      includeSACulture: false,
    };
    const result = buildImagePrompt(request);
    expect(result).not.toContain("South African context");
  });

  it("includes style hint when provided", () => {
    const request: ImageGenerationRequest = {
      ...baseImageRequest,
      style: "photorealistic",
    };
    const result = buildImagePrompt(request);
    expect(result).toContain("photorealistic");
  });

  it("includes dimensions when provided", () => {
    const request: ImageGenerationRequest = {
      ...baseImageRequest,
      dimensions: { width: 1080, height: 1080, label: "Square Post" },
    };
    const result = buildImagePrompt(request);
    expect(result).toContain("1080×1080");
    expect(result).toContain("Square Post");
  });

  it("includes brand color palette", () => {
    const result = buildImagePrompt(baseImageRequest, mockBrandProfile);
    expect(result).toContain("#FF6B35");
    expect(result).toContain("#FFD700");
  });

  it("includes brand visual style preferences", () => {
    const result = buildImagePrompt(baseImageRequest, mockBrandProfile);
    expect(result).toContain("warm");
    expect(result).toContain("high-contrast");
  });

  it("includes brand image type preferences", () => {
    const result = buildImagePrompt(baseImageRequest, mockBrandProfile);
    expect(result).toContain("lifestyle");
    expect(result).toContain("product-shot");
  });

  it("handles null brand profile gracefully", () => {
    const result = buildImagePrompt(baseImageRequest, null);
    expect(result).toContain("A vibrant coffee cup");
  });
});

// ── Video prompt tests ──────────────────────────────────────────

describe("buildVideoPrompt", () => {
  it("includes the user prompt", () => {
    const result = buildVideoPrompt(baseVideoRequest);
    expect(result).toContain("Show our coffee being brewed");
  });

  it("includes SA visual context by default", () => {
    const result = buildVideoPrompt(baseVideoRequest);
    expect(result).toContain("South African");
  });

  it("includes duration when specified", () => {
    const request: VideoGenerationRequest = {
      ...baseVideoRequest,
      durationSeconds: 30,
    };
    const result = buildVideoPrompt(request);
    expect(result).toContain("30 seconds");
  });

  it("includes video dimensions and aspect ratio", () => {
    const request: VideoGenerationRequest = {
      ...baseVideoRequest,
      dimensions: {
        width: 1080,
        height: 1920,
        label: "Vertical (9:16)",
        maxDurationSeconds: 180,
      },
    };
    const result = buildVideoPrompt(request);
    expect(result).toContain("portrait/vertical");
    expect(result).toContain("1080×1920");
    expect(result).toContain("180s");
  });

  it("detects landscape aspect ratio", () => {
    const request: VideoGenerationRequest = {
      ...baseVideoRequest,
      dimensions: {
        width: 1920,
        height: 1080,
        label: "Landscape",
        maxDurationSeconds: 60,
      },
    };
    const result = buildVideoPrompt(request);
    expect(result).toContain("landscape");
  });

  it("detects square aspect ratio", () => {
    const request: VideoGenerationRequest = {
      ...baseVideoRequest,
      dimensions: {
        width: 1080,
        height: 1080,
        label: "Square",
        maxDurationSeconds: 60,
      },
    };
    const result = buildVideoPrompt(request);
    expect(result).toContain("square");
  });

  it("includes brand colors when profile provided", () => {
    const result = buildVideoPrompt(baseVideoRequest, mockBrandProfile);
    expect(result).toContain("#FF6B35");
  });

  it("omits SA context when disabled", () => {
    const request: VideoGenerationRequest = {
      ...baseVideoRequest,
      includeSACulture: false,
    };
    const result = buildVideoPrompt(request);
    expect(result).not.toContain("South African context");
  });
});
