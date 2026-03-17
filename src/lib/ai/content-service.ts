/**
 * AI content generation orchestrator
 *
 * High-level service that ties together prompt-builder and openrouter-client
 * to generate complete social media content with SA cultural context.
 *
 * Server-side only — uses OpenRouter API for AI generation.
 */

import { suggestSAHashtags, calculateSACulturalScore } from "@/lib/brand/sa-context";
import { buildTextPrompt, buildImagePrompt, buildVideoPrompt } from "./prompt-builder";
import { generateText, generateImage, generateVideo } from "./openrouter-client";
import { getDefaultDimensions } from "./dimensions";
import type {
  TextGenerationRequest,
  ImageGenerationRequest,
  VideoGenerationRequest,
  TextGenerationResult,
  ImageGenerationResult,
  VideoGenerationResult,
  BrandContext,
} from "./types";

// ── Text content generation ─────────────────────────────────────

/**
 * Generate a social media post with SA cultural context.
 *
 * 1. Builds an SA-aware prompt from the request + brand profile
 * 2. Calls OpenRouter text generation
 * 3. Post-processes: appends SA hashtags, calculates cultural score
 */
export async function generatePostContent(
  request: TextGenerationRequest,
  brandProfile?: BrandContext | null,
): Promise<TextGenerationResult> {
  const startTime = performance.now();

  try {
    // Build the prompt
    const prompt = buildTextPrompt(request, brandProfile);

    // Generate via OpenRouter
    const { content, model } = await generateText(prompt, {
      temperature: 0.8,
    });

    // Extract hashtags from generated content
    const hashtagRegex = /#[\w]+/g;
    const extractedHashtags = content.match(hashtagRegex) ?? [];

    // Suggest additional SA hashtags if SA culture is enabled
    let finalContent = content;
    const allHashtags = [...extractedHashtags];

    if (request.includeSACulture !== false) {
      const suggestedTags = suggestSAHashtags(content, extractedHashtags, 3);
      const newTags = suggestedTags.filter(
        (tag) => !extractedHashtags.some(
          (existing) => existing.toLowerCase() === tag.toLowerCase(),
        ),
      );

      if (newTags.length > 0) {
        finalContent = `${content}\n\n${newTags.join(" ")}`;
        allHashtags.push(...newTags);
      }
    }

    // Calculate cultural score
    const culturalScore = calculateSACulturalScore([
      { content: finalContent, hashtags: allHashtags },
    ]);

    const durationMs = Math.round(performance.now() - startTime);

    return {
      success: true,
      contentType: "text",
      prompt,
      model,
      durationMs,
      content: finalContent,
      hashtags: allHashtags,
      culturalScore,
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    const durationMs = Math.round(performance.now() - startTime);

    return {
      success: false,
      contentType: "text",
      prompt: request.prompt,
      model: "unknown",
      durationMs,
      content: "",
      hashtags: [],
      culturalScore: 0,
      error: error.message,
    };
  }
}

// ── Image generation ────────────────────────────────────────────

/**
 * Generate a social media image with brand visual style.
 *
 * Note: OpenRouter free text models don't support image generation.
 * This will return an error result — consider integrating a dedicated
 * image generation service for production use.
 */
export async function generatePostImage(
  request: ImageGenerationRequest,
  brandProfile?: BrandContext | null,
): Promise<ImageGenerationResult> {
  const startTime = performance.now();

  // Resolve dimensions
  const dimensions = request.dimensions ?? getDefaultDimensions(request.platform, "image");

  try {
    // Build the prompt
    const prompt = buildImagePrompt(request, brandProfile);

    // Generate via OpenRouter
    const { imageDataUrl, model } = await generateImage(prompt);

    const durationMs = Math.round(performance.now() - startTime);

    return {
      success: true,
      contentType: "image",
      prompt,
      model,
      durationMs,
      imageDataUrl,
      dimensions,
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    const durationMs = Math.round(performance.now() - startTime);

    return {
      success: false,
      contentType: "image",
      prompt: request.prompt,
      model: "unknown",
      durationMs,
      imageDataUrl: "",
      dimensions,
      error: error.message,
    };
  }
}

// ── Video generation ────────────────────────────────────────────

/**
 * Generate a social media video with brand context.
 *
 * Note: OpenRouter does not support video generation.
 * This will return an error result — consider integrating a dedicated
 * video generation service for production use.
 */
export async function generatePostVideo(
  request: VideoGenerationRequest,
  brandProfile?: BrandContext | null,
): Promise<VideoGenerationResult> {
  const startTime = performance.now();

  // Resolve dimensions
  const dimensions = request.dimensions ?? getDefaultDimensions(request.platform, "video");

  try {
    // Build the prompt
    const prompt = buildVideoPrompt(request, brandProfile);

    // Generate via OpenRouter
    const { videoUrl, model } = await generateVideo(prompt);

    const durationMs = Math.round(performance.now() - startTime);

    return {
      success: true,
      contentType: "video",
      prompt,
      model,
      durationMs,
      videoUrl,
      dimensions,
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    const durationMs = Math.round(performance.now() - startTime);

    return {
      success: false,
      contentType: "video",
      prompt: request.prompt,
      model: "unknown",
      durationMs,
      videoUrl: "",
      dimensions,
      error: error.message,
    };
  }
}
