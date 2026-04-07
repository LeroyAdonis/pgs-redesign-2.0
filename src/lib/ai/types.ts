/**
 * AI content engine — shared type definitions
 *
 * Types used by the AI generation layer (prompt builder, puter client,
 * content service) and the UI components that consume them.
 */

import type { ToneFingerprint, VisualStyle } from "@/db/schema";

// ── Platform dimension types ────────────────────────────────────

/** Supported social media platforms for content generation */
export type ContentPlatform =
  | "instagram"
  | "facebook"
  | "twitter"
  | "linkedin"
  | "tiktok";

/** Content types the AI engine can generate */
export type ContentType = "text" | "image" | "video";

/** Width × height in pixels */
export interface ImageDimensions {
  width: number;
  height: number;
  label: string;
}

/** Video dimensions with duration constraints */
export interface VideoDimensions {
  width: number;
  height: number;
  label: string;
  maxDurationSeconds: number;
}

// ── Content generation request types ────────────────────────────

/** Base fields shared by all generation requests */
interface BaseGenerationRequest {
  /** User's prompt / description of what to generate */
  prompt: string;
  /** Target platform */
  platform: ContentPlatform;
  /** Content language (SA language code, defaults to "en") */
  language?: string;
  /** Organization ID for brand context */
  orgId?: string;
  /** Whether to inject SA cultural context */
  includeSACulture?: boolean;
}

/** Request to generate text content (social media post) */
export interface TextGenerationRequest extends BaseGenerationRequest {
  contentType: "text";
  /** Maximum character count for the post */
  maxLength?: number;
  /** Number of hashtags to include */
  hashtagCount?: number;
  /** Include emoji in generated content */
  includeEmoji?: boolean;
}

/** Request to generate an image */
export interface ImageGenerationRequest extends BaseGenerationRequest {
  contentType: "image";
  /** Desired image dimensions */
  dimensions?: ImageDimensions;
  /** Visual style hints (e.g., "photorealistic", "illustrated") */
  style?: string;
}

/** Request to generate a video */
export interface VideoGenerationRequest extends BaseGenerationRequest {
  contentType: "video";
  /** Desired video dimensions */
  dimensions?: VideoDimensions;
  /** Duration in seconds */
  durationSeconds?: number;
}

/** Union of all generation request types */
export type GenerationRequest =
  | TextGenerationRequest
  | ImageGenerationRequest
  | VideoGenerationRequest;

// ── Content generation result types ─────────────────────────────

/** Base fields shared by all generation results */
interface BaseGenerationResult {
  /** Whether generation succeeded */
  success: boolean;
  /** The prompt that was sent to the AI model */
  prompt: string;
  /** AI model used for generation */
  model: string;
  /** Generation duration in milliseconds */
  durationMs: number;
  /** Error message if generation failed */
  error?: string;
}

/** Result from text generation */
export interface TextGenerationResult extends BaseGenerationResult {
  contentType: "text";
  /** Generated text content */
  content: string;
  /** Hashtags included in or appended to the content */
  hashtags: string[];
  /** SA cultural score (0–1) */
  culturalScore: number;
}

/** Result from image generation */
export interface ImageGenerationResult extends BaseGenerationResult {
  contentType: "image";
  /** Data URL of the generated image (base64) */
  imageDataUrl: string;
  /** Image dimensions */
  dimensions: ImageDimensions;
}

/** Result from video generation */
export interface VideoGenerationResult extends BaseGenerationResult {
  contentType: "video";
  /** Data URL or blob URL of the generated video */
  videoUrl: string;
  /** Video dimensions */
  dimensions: VideoDimensions;
}

/** Union of all generation result types */
export type GenerationResult =
  | TextGenerationResult
  | ImageGenerationResult
  | VideoGenerationResult;

// ── Content rating / feedback ───────────────────────────────────

/** How the user rated the AI-generated content */
export type ContentRating = "thumbs_up" | "thumbs_down" | "edited";

/** Feedback submitted by a user on AI-generated content */
export interface AIFeedback {
  /** Organization ID */
  orgId: string;
  /** Post ID if the content was saved as a draft */
  postId?: string;
  /** User who submitted the feedback */
  userId: string;
  /** Rating */
  rating: ContentRating;
  /** The AI-generated content before any edits */
  originalContent: string;
  /** The user-edited content (only when rating is "edited") */
  editedContent?: string;
  /** AI model that generated the content */
  aiModel: string;
  /** Prompt used for generation */
  aiPrompt: string;
  /** Platform the content was generated for */
  platform: ContentPlatform;
  /** Type of content generated */
  contentType: ContentType;
}

/** Client-side feedback payload (sent from UI to /api/ai/feedback) */
export interface AIFeedbackData {
  rating: ContentRating;
  originalContent: string;
  editedContent?: string;
  aiModel: string;
  aiPrompt: string;
  platform: string;
  contentType: ContentType;
}

/** Aggregated feedback statistics */
export interface FeedbackStats {
  total: number;
  thumbsUp: number;
  thumbsDown: number;
  edited: number;
  /** Improvement score: (thumbsUp + edited) / total */
  improvementScore: number;
}

// ── UI state types ──────────────────────────────────────────────

/** Generation state for UI components */
export type GenerationState = "idle" | "generating" | "success" | "error";

/** OpenRouter API availability status */
export interface OpenRouterAvailability {
  /** Whether the OPENROUTER_API_KEY env var is set */
  configured?: boolean;
  /** Whether the SDK is loaded and reachable */
  available: boolean;
  /** Whether the AI module is available */
  aiAvailable: boolean;
  /** Reason if unavailable */
  reason?: string;
}

/** @deprecated Use OpenRouterAvailability instead */
export type PuterAvailability = OpenRouterAvailability;

// ── Brand profile subset for AI prompts ─────────────────────────

/** Minimal brand profile data needed by the prompt builder */
export interface BrandContext {
  toneFingerprint?: ToneFingerprint | null;
  visualStyle?: VisualStyle | null;
  language?: string;
  hashtagPatterns?: Array<{ hashtag: string; frequency: number }> | null;
  vocabularyClusters?: Array<{ category: string; words: string[] }> | null;
}