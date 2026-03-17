/**
 * AI content engine — barrel exports
 *
 * Public API for the AI generation layer. Uses server-side
 * OpenRouter API for text generation (replaces Puter.js).
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
  OpenRouterAvailability,
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

// ── OpenRouter client (server-only) ─────────────────────────────
export {
  isOpenRouterConfigured,
  generateText,
  generateImage,
  generateVideo,
} from "./openrouter-client";

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
