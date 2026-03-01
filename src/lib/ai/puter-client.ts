"use client";

/**
 * Puter.js client wrapper
 *
 * Provides TypeScript-safe wrappers around the global `window.puter` SDK
 * with error handling, retry logic, and availability detection.
 *
 * This module is client-only — Puter.js runs in the browser via CDN.
 */

import type { PuterAvailability } from "./types";
import type { PuterChatOptions, PuterChatResponse } from "./puter.d";

// ── Constants ───────────────────────────────────────────────────

const DEFAULT_MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 1000;
const DEFAULT_MODEL = "gpt-4o-mini";

// ── Availability detection ──────────────────────────────────────

/**
 * Check if Puter.js SDK is loaded and AI features are available.
 */
export function isPuterAvailable(): PuterAvailability {
  if (typeof window === "undefined") {
    return {
      available: false,
      aiAvailable: false,
      reason: "Not running in a browser environment",
    };
  }

  if (!window.puter) {
    return {
      available: false,
      aiAvailable: false,
      reason: "Puter.js SDK not loaded. Include the CDN script in your page.",
    };
  }

  if (!window.puter.ai) {
    return {
      available: true,
      aiAvailable: false,
      reason: "Puter SDK loaded but AI module not available",
    };
  }

  return {
    available: true,
    aiAvailable: true,
  };
}

// ── Retry helper ────────────────────────────────────────────────

/**
 * Retry a function with exponential backoff.
 *
 * Only retries on transient errors (network issues, rate limits).
 * Non-retryable errors (invalid prompt, auth failures) propagate immediately.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = DEFAULT_MAX_RETRIES,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      // Don't retry on non-transient errors
      const message = error.message.toLowerCase();
      if (
        message.includes("invalid") ||
        message.includes("unauthorized") ||
        message.includes("forbidden") ||
        message.includes("not found")
      ) {
        throw error;
      }

      lastError = error;

      // Don't wait after the last attempt
      if (attempt < maxRetries) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError ?? new Error("All retry attempts failed");
}

// ── Text generation ─────────────────────────────────────────────

/** Options for generateText */
export interface GenerateTextOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  maxRetries?: number;
}

/**
 * Generate text content using Puter.js AI chat.
 *
 * @param prompt - The prompt to send to the LLM
 * @param options - Generation options
 * @returns The generated text and metadata
 */
export async function generateText(
  prompt: string,
  options?: GenerateTextOptions,
): Promise<{ content: string; model: string }> {
  const availability = isPuterAvailable();
  if (!availability.aiAvailable) {
    throw new Error(`Puter AI not available: ${availability.reason}`);
  }

  const chatOptions: PuterChatOptions = {
    model: options?.model ?? DEFAULT_MODEL,
    temperature: options?.temperature ?? 0.8,
    maxTokens: options?.maxTokens,
  };

  const response = await withRetry<PuterChatResponse>(
    () => window.puter!.ai.chat(prompt, chatOptions),
    options?.maxRetries ?? DEFAULT_MAX_RETRIES,
  );

  return {
    content: response.message.content,
    model: chatOptions.model ?? DEFAULT_MODEL,
  };
}

// ── Image generation ────────────────────────────────────────────

/** Options for generateImage */
export interface GenerateImageOptions {
  model?: string;
  maxRetries?: number;
}

/**
 * Generate an image using Puter.js AI text-to-image.
 *
 * Wraps `puter.ai.txt2img()` and extracts the data URL from the
 * resulting HTMLImageElement.
 *
 * @param prompt - Image description prompt
 * @param options - Generation options
 * @returns Data URL of the generated image and model used
 */
export async function generateImage(
  prompt: string,
  options?: GenerateImageOptions,
): Promise<{ imageDataUrl: string; model: string }> {
  const availability = isPuterAvailable();
  if (!availability.aiAvailable) {
    throw new Error(`Puter AI not available: ${availability.reason}`);
  }

  const model = options?.model ?? "default";

  const imgElement = await withRetry<HTMLImageElement>(
    () => window.puter!.ai.txt2img(prompt, { model }),
    options?.maxRetries ?? DEFAULT_MAX_RETRIES,
  );

  // Extract data URL from the HTMLImageElement src
  const imageDataUrl = imgElement.src;

  if (!imageDataUrl) {
    throw new Error("Image generation succeeded but returned no image data");
  }

  return { imageDataUrl, model };
}

// ── Video generation ────────────────────────────────────────────

/** Options for generateVideo */
export interface GenerateVideoOptions {
  model?: string;
  maxRetries?: number;
}

/**
 * Generate a video using Puter.js AI text-to-video.
 *
 * Wraps `puter.ai.txt2vid()` and extracts the video URL from the
 * resulting HTMLVideoElement.
 *
 * @param prompt - Video description prompt
 * @param options - Generation options
 * @returns Video URL and model used
 */
export async function generateVideo(
  prompt: string,
  options?: GenerateVideoOptions,
): Promise<{ videoUrl: string; model: string }> {
  const availability = isPuterAvailable();
  if (!availability.aiAvailable) {
    throw new Error(`Puter AI not available: ${availability.reason}`);
  }

  const model = options?.model ?? "default";

  const videoElement = await withRetry<HTMLVideoElement>(
    () => window.puter!.ai.txt2vid(prompt, { model }),
    options?.maxRetries ?? DEFAULT_MAX_RETRIES,
  );

  // Extract src from the HTMLVideoElement
  const videoUrl = videoElement.src;

  if (!videoUrl) {
    throw new Error("Video generation succeeded but returned no video data");
  }

  return { videoUrl, model };
}
