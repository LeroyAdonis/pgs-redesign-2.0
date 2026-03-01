import type { Platform } from "@/lib/social/types";

/** Options passed to a publisher adapter when publishing a post */
export interface PublishOptions {
  postId: string;
  content: string;
  platform: Platform;
  accessToken: string;
  media?: PublishMedia[];
}

/** Media attachment for a published post */
export interface PublishMedia {
  url: string;
  type: "image" | "video" | "gif";
  altText?: string;
}

/** Standardized result returned by every publisher adapter */
export interface PublishResult {
  success: boolean;
  platformPostId?: string;
  platformUrl?: string;
  error?: string;
  errorCode?: string;
  /** Whether the caller should retry this operation (e.g. rate limit) */
  retryable: boolean;
}

/** Content validation result */
export interface ContentValidation {
  valid: boolean;
  errors: string[];
}

/** Contract every platform publisher must satisfy */
export interface PublisherAdapter {
  platform: Platform;
  publish(options: PublishOptions): Promise<PublishResult>;
  validateContent(content: string): ContentValidation;
}

/** Per-platform rate limit configuration */
export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

/** Per-platform character limit and constraints */
export interface PlatformConstraints {
  maxCharacters: number;
  /** Whether media is required (e.g. TikTok requires video) */
  mediaRequired?: boolean;
  /** Allowed media types for this platform */
  allowedMediaTypes?: Array<"image" | "video" | "gif">;
}
