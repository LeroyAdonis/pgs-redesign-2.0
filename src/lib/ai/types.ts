/**
 * AI Content Generation types
 *
 * Shared type definitions for the Content Studio feature.
 * Used by generate page, API routes, and Puter.js integration.
 */

// ── Content Types ───────────────────────────────────────────────

export type ContentType = "text" | "image" | "video";

export type ContentRating = "thumbs_up" | "thumbs_down" | "edited";

export type GenerationState = "idle" | "generating" | "success" | "error";

// ── Image Dimensions ────────────────────────────────────────────

export interface ImageDimensions {
  width: number;
  height: number;
  label: string;
}

/** Platform-specific image dimension presets */
export const PLATFORM_DIMENSIONS: Record<string, ImageDimensions[]> = {
  instagram: [
    { width: 1080, height: 1080, label: "Square (1:1)" },
    { width: 1080, height: 1350, label: "Portrait (4:5)" },
    { width: 1080, height: 1920, label: "Stories (9:16)" },
  ],
  facebook: [
    { width: 1200, height: 630, label: "Link Share" },
  ],
  twitter: [
    { width: 1600, height: 900, label: "Post Image" },
  ],
  linkedin: [
    { width: 1200, height: 627, label: "Post Image" },
  ],
  tiktok: [
    { width: 1080, height: 1920, label: "Full Screen (9:16)" },
  ],
} as const;

// ── Text Generation ─────────────────────────────────────────────

export interface GenerateTextRequest {
  prompt: string;
  platform: string;
  language: string;
  brandProfileId?: string;
  tone?: string;
  includeSAContext: boolean;
}

export interface GenerateTextResult {
  content: string;
  hashtags: string[];
  model: string;
  culturalScore: number;
  language: string;
}

// ── Image Generation ────────────────────────────────────────────

export interface GenerateImageRequest {
  prompt: string;
  platform: string;
  brandColors?: string[];
  dimensions: ImageDimensions;
  model?: string;
  quality?: string;
}

export interface GenerateImageResult {
  dataUrl: string;
  width: number;
  height: number;
  model: string;
  prompt: string;
}

// ── Video Generation ────────────────────────────────────────────

export interface GenerateVideoRequest {
  prompt: string;
  platform: string;
  duration?: number;
  model?: string;
}

export interface GenerateVideoResult {
  videoUrl: string;
  model: string;
  prompt: string;
}

// ── Feedback ────────────────────────────────────────────────────

export interface AIFeedbackData {
  rating: ContentRating;
  originalContent: string;
  editedContent?: string;
  aiModel: string;
  aiPrompt: string;
  platform: string;
  contentType: ContentType;
}

// ── Puter Availability ──────────────────────────────────────────

export interface PuterAvailability {
  available: boolean;
  authenticated: boolean;
}
