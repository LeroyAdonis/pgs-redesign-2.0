/**
 * Tests for platform dimension presets and helpers
 */

import { describe, it, expect } from "vitest";
import {
  PLATFORM_IMAGE_DIMENSIONS,
  PLATFORM_VIDEO_DIMENSIONS,
  getDefaultDimensions,
  getDimensionPresets,
} from "../dimensions";
import type { ContentPlatform } from "../types";

describe("PLATFORM_IMAGE_DIMENSIONS", () => {
  const platforms: ContentPlatform[] = [
    "instagram",
    "facebook",
    "twitter",
    "linkedin",
    "tiktok",
  ];

  it.each(platforms)("has presets for %s", (platform) => {
    const dims = PLATFORM_IMAGE_DIMENSIONS[platform];
    expect(dims).toBeDefined();
    expect(dims.length).toBeGreaterThan(0);
  });

  it("has correct Instagram square dimensions", () => {
    const igDims = PLATFORM_IMAGE_DIMENSIONS.instagram;
    const square = igDims.find((d) => d.label === "Square Post");
    expect(square).toEqual({ width: 1080, height: 1080, label: "Square Post" });
  });

  it("has correct Facebook landscape dimensions", () => {
    const fbDims = PLATFORM_IMAGE_DIMENSIONS.facebook;
    const landscape = fbDims.find((d) => d.label === "Landscape Post");
    expect(landscape).toEqual({
      width: 1200,
      height: 630,
      label: "Landscape Post",
    });
  });

  it("has correct Twitter landscape dimensions", () => {
    const twDims = PLATFORM_IMAGE_DIMENSIONS.twitter;
    const landscape = twDims.find((d) => d.label === "Landscape Post");
    expect(landscape).toEqual({
      width: 1600,
      height: 900,
      label: "Landscape Post",
    });
  });

  it("has correct LinkedIn landscape dimensions", () => {
    const liDims = PLATFORM_IMAGE_DIMENSIONS.linkedin;
    const landscape = liDims.find((d) => d.label === "Landscape Post");
    expect(landscape).toEqual({
      width: 1200,
      height: 627,
      label: "Landscape Post",
    });
  });

  it("has correct TikTok story/vertical dimensions", () => {
    const tkDims = PLATFORM_IMAGE_DIMENSIONS.tiktok;
    const vertical = tkDims.find((d) => d.label === "Vertical (9:16)");
    expect(vertical).toEqual({
      width: 1080,
      height: 1920,
      label: "Vertical (9:16)",
    });
  });

  it("every preset has positive width and height", () => {
    for (const platform of platforms) {
      for (const dim of PLATFORM_IMAGE_DIMENSIONS[platform]) {
        expect(dim.width).toBeGreaterThan(0);
        expect(dim.height).toBeGreaterThan(0);
        expect(dim.label).toBeTruthy();
      }
    }
  });
});

describe("PLATFORM_VIDEO_DIMENSIONS", () => {
  const platforms: ContentPlatform[] = [
    "instagram",
    "facebook",
    "twitter",
    "linkedin",
    "tiktok",
  ];

  it.each(platforms)("has presets for %s", (platform) => {
    const dims = PLATFORM_VIDEO_DIMENSIONS[platform];
    expect(dims).toBeDefined();
    expect(dims.length).toBeGreaterThan(0);
  });

  it("every preset has positive maxDurationSeconds", () => {
    for (const platform of platforms) {
      for (const dim of PLATFORM_VIDEO_DIMENSIONS[platform]) {
        expect(dim.width).toBeGreaterThan(0);
        expect(dim.height).toBeGreaterThan(0);
        expect(dim.maxDurationSeconds).toBeGreaterThan(0);
        expect(dim.label).toBeTruthy();
      }
    }
  });
});

describe("getDefaultDimensions", () => {
  it("returns first image preset for instagram", () => {
    const result = getDefaultDimensions("instagram", "image");
    expect(result).toEqual(PLATFORM_IMAGE_DIMENSIONS.instagram[0]);
  });

  it("returns first video preset for instagram", () => {
    const result = getDefaultDimensions("instagram", "video");
    expect(result).toEqual(PLATFORM_VIDEO_DIMENSIONS.instagram[0]);
  });

  it("returns null for text content type", () => {
    const result = getDefaultDimensions("instagram", "text");
    expect(result).toBeNull();
  });

  it("returns correct defaults for each platform", () => {
    const platforms: ContentPlatform[] = [
      "instagram",
      "facebook",
      "twitter",
      "linkedin",
      "tiktok",
    ];

    for (const platform of platforms) {
      const imgDim = getDefaultDimensions(platform, "image");
      expect(imgDim).toEqual(PLATFORM_IMAGE_DIMENSIONS[platform][0]);

      const vidDim = getDefaultDimensions(platform, "video");
      expect(vidDim).toEqual(PLATFORM_VIDEO_DIMENSIONS[platform][0]);
    }
  });
});

describe("getDimensionPresets", () => {
  it("returns all image presets for a platform", () => {
    const presets = getDimensionPresets("instagram", "image");
    expect(presets).toEqual(PLATFORM_IMAGE_DIMENSIONS.instagram);
  });

  it("returns all video presets for a platform", () => {
    const presets = getDimensionPresets("facebook", "video");
    expect(presets).toEqual(PLATFORM_VIDEO_DIMENSIONS.facebook);
  });

  it("returns empty array for text content type", () => {
    const presets = getDimensionPresets("instagram", "text");
    expect(presets).toEqual([]);
  });
});
