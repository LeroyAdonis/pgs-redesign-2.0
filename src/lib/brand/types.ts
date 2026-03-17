/**
 * Brand analysis types
 *
 * Types for the brand scraping engine, analysis pipeline, and profile management.
 * JSONB column types are re-exported from the DB schema for single source of truth.
 */

import type {
  ToneFingerprint,
  VocabularyCluster,
  HashtagPattern,
  PostingCadence,
  EmojiUsage,
  VisualStyle,
} from "@/db/schema";

// Re-export DB types for convenience
export type {
  ToneFingerprint,
  VocabularyCluster,
  HashtagPattern,
  PostingCadence,
  EmojiUsage,
  VisualStyle,
};

// ── Platform types ──────────────────────────────────────────────

/** Platforms supported by the brand scraping engine */
export type ScrapePlatform = "instagram" | "facebook" | "twitter" | "linkedin";

// ── Raw post data (normalized from any platform) ────────────────

/** A single post normalized from any social platform */
export interface RawPost {
  /** Platform-specific post ID */
  platformPostId: string;
  /** Platform the post came from */
  platform: ScrapePlatform;
  /** Post text content */
  content: string;
  /** When the post was published (ISO 8601) */
  publishedAt: string;
  /** Hashtags extracted from the post */
  hashtags: string[];
  /** Emojis used in the post */
  emojis: string[];
  /** Number of likes/reactions */
  likes: number;
  /** Number of comments */
  comments: number;
  /** Number of shares/retweets */
  shares: number;
  /** Media attachments */
  media: RawPostMedia[];
  /** Language detected or specified */
  language?: string;
}

/** Media attachment on a raw post */
export interface RawPostMedia {
  type: "image" | "video" | "gif";
  url: string;
  /** Dominant colors extracted (hex strings) */
  dominantColors?: string[];
  /** Filter or style applied */
  filter?: string;
}

// ── Scrape options ──────────────────────────────────────────────

/** Options for a brand scrape operation */
export interface ScrapeOptions {
  /** Social account ID to scrape */
  socialAccountId: string;
  /** Platform to scrape */
  platform: ScrapePlatform;
  /** Maximum number of posts to scrape */
  maxPosts?: number;
  /** How far back to scrape (ISO 8601 date) */
  since?: string;
  /** Use mock data instead of real API calls */
  useMockData?: boolean;
}

// ── Analysis results ────────────────────────────────────────────

/** Complete analysis result from the brand analyzer */
export interface BrandAnalysisResult {
  toneFingerprint: ToneFingerprint;
  vocabularyClusters: VocabularyCluster[];
  hashtagPatterns: HashtagPattern[];
  postingCadence: PostingCadence;
  emojiUsage: EmojiUsage[];
  avgContentLength: number;
  visualStyle: VisualStyle;
  /** Total posts analyzed */
  postsAnalyzed: number;
  /** SA cultural awareness score (0–1) */
  saCulturalScore: number;
  /** Detected language(s) */
  detectedLanguages: string[];
}

// ── Profile mutations ───────────────────────────────────────────

/** Fields that can be updated on a brand profile */
export interface BrandProfileUpdate {
  toneFingerprint?: ToneFingerprint;
  vocabularyClusters?: VocabularyCluster[];
  hashtagPatterns?: HashtagPattern[];
  postingCadence?: PostingCadence;
  emojiUsage?: EmojiUsage[];
  avgContentLength?: number;
  visualStyle?: VisualStyle;
  language?: string;
}

// ── Scraper interface ───────────────────────────────────────────

/** Result of a scrape operation */
export interface ScrapeResult {
  posts: RawPost[];
  /** Whether the data is from mock/development generators */
  isMock: boolean;
  /** How many posts were available vs. fetched */
  totalAvailable: number;
}

// ── Scan API types ──────────────────────────────────────────────

/** Request body for POST /api/brand/scan */
export interface ScanRequest {
  socialAccountId: string;
}

/** Request body for POST /api/brand/scan/preview */
export interface ScanPreviewRequest {
  socialAccountId: string;
}

/** Response for scan endpoints */
export interface ScanResponse {
  success: boolean;
  profileId?: string;
  result?: BrandAnalysisResult;
  error?: string;
}
