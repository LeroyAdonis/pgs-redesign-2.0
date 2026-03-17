/**
 * Platform-specific image and video dimension presets
 *
 * Standard social media sizes for Instagram, Facebook, Twitter/X,
 * LinkedIn, and TikTok.
 */

import type { ContentPlatform, ContentType, ImageDimensions, VideoDimensions } from "./types";

// ── Image dimension presets ─────────────────────────────────────

/** Standard image dimensions per platform */
export const PLATFORM_IMAGE_DIMENSIONS: Record<ContentPlatform, ImageDimensions[]> = {
  instagram: [
    { width: 1080, height: 1080, label: "Square Post" },
    { width: 1080, height: 1350, label: "Portrait Post" },
    { width: 1080, height: 566, label: "Landscape Post" },
    { width: 1080, height: 1920, label: "Story / Reel Cover" },
  ],
  facebook: [
    { width: 1200, height: 630, label: "Landscape Post" },
    { width: 1080, height: 1080, label: "Square Post" },
    { width: 1080, height: 1920, label: "Story" },
    { width: 820, height: 312, label: "Cover Photo" },
  ],
  twitter: [
    { width: 1600, height: 900, label: "Landscape Post" },
    { width: 1080, height: 1080, label: "Square Post" },
    { width: 1500, height: 500, label: "Header Image" },
  ],
  linkedin: [
    { width: 1200, height: 627, label: "Landscape Post" },
    { width: 1080, height: 1080, label: "Square Post" },
    { width: 1128, height: 191, label: "Cover Image" },
  ],
  tiktok: [
    { width: 1080, height: 1920, label: "Vertical (9:16)" },
    { width: 1080, height: 1080, label: "Square" },
  ],
};

// ── Video dimension presets ─────────────────────────────────────

/** Standard video dimensions per platform */
export const PLATFORM_VIDEO_DIMENSIONS: Record<ContentPlatform, VideoDimensions[]> = {
  instagram: [
    { width: 1080, height: 1920, label: "Reel (9:16)", maxDurationSeconds: 90 },
    { width: 1080, height: 1080, label: "Square Video", maxDurationSeconds: 60 },
    { width: 1080, height: 1920, label: "Story", maxDurationSeconds: 15 },
  ],
  facebook: [
    { width: 1280, height: 720, label: "Landscape Video", maxDurationSeconds: 240 },
    { width: 1080, height: 1080, label: "Square Video", maxDurationSeconds: 240 },
    { width: 1080, height: 1920, label: "Reel / Story", maxDurationSeconds: 60 },
  ],
  twitter: [
    { width: 1280, height: 720, label: "Landscape Video", maxDurationSeconds: 140 },
    { width: 720, height: 1280, label: "Vertical Video", maxDurationSeconds: 140 },
  ],
  linkedin: [
    { width: 1920, height: 1080, label: "Landscape Video", maxDurationSeconds: 600 },
    { width: 1080, height: 1080, label: "Square Video", maxDurationSeconds: 600 },
  ],
  tiktok: [
    { width: 1080, height: 1920, label: "Vertical (9:16)", maxDurationSeconds: 180 },
    { width: 1080, height: 1080, label: "Square", maxDurationSeconds: 60 },
  ],
};

// ── Helpers ─────────────────────────────────────────────────────

/**
 * Get the default (first/recommended) dimensions for a platform and content type.
 *
 * Returns the first preset for the given platform, which is the most commonly
 * used format.
 */
export function getDefaultDimensions(
  platform: ContentPlatform,
  contentType: "image",
): ImageDimensions;
export function getDefaultDimensions(
  platform: ContentPlatform,
  contentType: "video",
): VideoDimensions;
export function getDefaultDimensions(
  platform: ContentPlatform,
  contentType: ContentType,
): ImageDimensions | VideoDimensions | null;
export function getDefaultDimensions(
  platform: ContentPlatform,
  contentType: ContentType,
): ImageDimensions | VideoDimensions | null {
  if (contentType === "image") {
    return PLATFORM_IMAGE_DIMENSIONS[platform]?.[0] ?? null;
  }
  if (contentType === "video") {
    return PLATFORM_VIDEO_DIMENSIONS[platform]?.[0] ?? null;
  }
  // Text has no dimensions
  return null;
}

/**
 * Get all available dimension presets for a platform and content type.
 */
export function getDimensionPresets(
  platform: ContentPlatform,
  contentType: "image",
): ImageDimensions[];
export function getDimensionPresets(
  platform: ContentPlatform,
  contentType: "video",
): VideoDimensions[];
export function getDimensionPresets(
  platform: ContentPlatform,
  contentType: ContentType,
): Array<ImageDimensions | VideoDimensions>;
export function getDimensionPresets(
  platform: ContentPlatform,
  contentType: ContentType,
): Array<ImageDimensions | VideoDimensions> {
  if (contentType === "image") {
    return PLATFORM_IMAGE_DIMENSIONS[platform] ?? [];
  }
  if (contentType === "video") {
    return PLATFORM_VIDEO_DIMENSIONS[platform] ?? [];
  }
  return [];
}
