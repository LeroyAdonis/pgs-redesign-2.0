/**
 * AI content engine — barrel exports
 *
 * Public API for the AI generation layer. Uses server-side
 * NVIDIA NIM API for text and image generation.
 */

// ── Types ───────────────────────────────────────────────────────
export type {
  ContentPlatform,
  ContentType,
  ImageDimensions,
  VideoDimensions,
  TextGenerationRequest,
  ImageGenerationRequest,
  VideoGenerationRequest,
  GenerationRequest,
  TextGenerationResult,
  ImageGenerationResult,
  VideoGenerationResult,
  GenerationResult,
  ContentRating,
  AIFeedback,
  AIFeedbackData,
  FeedbackStats,
  GenerationState,
  NIMAvailability,
  /** @deprecated Use NIMAvailability instead */
  PuterAvailability,
  BrandContext,
} from "./types";

// ── Dimensions ──────────────────────────────────────────────────
export {
  PLATFORM_IMAGE_DIMENSIONS,
  PLATFORM_VIDEO_DIMENSIONS,
  getDefaultDimensions,
  getDimensionPresets,
} from "./dimensions";

// ── Prompt builder ──────────────────────────────────────────────
export {
  buildTextPrompt,
  buildImagePrompt,
  buildVideoPrompt,
} from "./prompt-builder";

// ── NIM client (server-only) ────────────────────────────────────
export {
  isNimConfigured,
  generateText,
  generateImage,
  generateVideo,
} from "./nim-client";

// ── Content service (server-only) ───────────────────────────────
export {
  generatePostContent,
  generatePostImage,
  generatePostVideo,
} from "./content-service";

// ── Draft service (server-only) ─────────────────────────────────
export {
  saveGeneratedDraft,
  getGenerationHistory,
} from "./draft-service";
export type { DraftMedia, SaveDraftResult } from "./draft-service";

// ── Feedback service (server-only) ──────────────────────────────
export {
  submitFeedback,
  getFeedbackStats,
  getRecentFeedback,
  updateBrandProfileFromFeedback,
} from "./feedback-service";
export type { FeedbackRow } from "./feedback-service";
