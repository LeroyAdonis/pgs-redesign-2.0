/**
 * Publisher adapter types — platform-specific post publishing
 *
 * Defines the interface for publishing content to social platforms.
 * Each platform (Instagram, Twitter, etc.) implements PublisherAdapter.
 *
 * NOTE: This is a stub file providing types and a placeholder factory.
 * Real implementations will be merged from the publishers worktree (Stream A).
 */

import type { Platform } from "@/lib/social/types";

/** Options passed to a publisher adapter's `publish()` method. */
export interface PublishOptions {
  postId: string;
  content: string;
  platform: Platform;
  accessToken: string;
  media?: { url: string; type: "image" | "video" | "gif"; altText?: string }[];
}

/** Result returned after a publish attempt. */
export interface PublishResult {
  success: boolean;
  platformPostId?: string;
  platformUrl?: string;
  error?: string;
  errorCode?: string;
  retryable: boolean;
}

/** Interface each platform publisher must implement. */
export interface PublisherAdapter {
  platform: Platform;
  publish(options: PublishOptions): Promise<PublishResult>;
  validateContent(content: string): { valid: boolean; errors: string[] };
}

/**
 * Get the publisher adapter for a given platform.
 *
 * @throws until real adapters are merged from Stream A
 */
export function getPublisher(platform: Platform): PublisherAdapter {
  throw new Error(
    `Publisher for ${platform} not yet implemented — will be available after merge`,
  );
}
