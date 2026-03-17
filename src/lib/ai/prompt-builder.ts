/**
 * SA-aware prompt construction for AI content generation
 *
 * Builds rich prompts by combining user input with brand profile data
 * and South African cultural context (hashtags, slang, holidays, languages).
 */

import {
  suggestSAHashtags,
  getUpcomingSAHoliday,
  SA_SLANG,
  SA_CITIES,
  SA_LANGUAGES,
} from "@/lib/brand/sa-context";
import type {
  TextGenerationRequest,
  ImageGenerationRequest,
  VideoGenerationRequest,
  BrandContext,
} from "./types";

// ── Internal helpers ────────────────────────────────────────────

/** Get the full language name for an SA language code */
function getLanguageName(code: string): string {
  return SA_LANGUAGES[code] ?? "English";
}

/** Format tone fingerprint as natural language instructions */
function describeTone(tone: NonNullable<BrandContext["toneFingerprint"]>): string {
  const traits: string[] = [];

  // Pick the top 3 tone dimensions (highest scoring)
  const sorted = Object.entries(tone)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  for (const [key, value] of sorted) {
    if (value > 0.5) {
      traits.push(`strongly ${key}`);
    } else if (value > 0.3) {
      traits.push(`moderately ${key}`);
    }
  }

  return traits.length > 0
    ? `The tone should be ${traits.join(", ")}.`
    : "";
}

/** Build brand vocabulary hints */
function describeVocabulary(
  clusters: NonNullable<BrandContext["vocabularyClusters"]>,
): string {
  if (clusters.length === 0) return "";

  const topClusters = clusters
    .slice(0, 3);

  const descriptions = topClusters.map(
    (c) => `${c.category}: ${c.words.slice(0, 5).join(", ")}`,
  );

  return `Use vocabulary from these categories: ${descriptions.join("; ")}.`;
}

/** Build SA cultural context block for prompts */
function buildSACulturalBlock(
  content: string,
  existingHashtags: string[],
  language: string,
): string {
  const parts: string[] = [];

  // Language context
  if (language !== "en") {
    const langName = getLanguageName(language);
    parts.push(
      `Write the content in ${langName} (language code: ${language}). ` +
      `This is one of South Africa's 11 official languages.`,
    );
  }

  // Holiday context
  const holiday = getUpcomingSAHoliday();
  if (holiday) {
    parts.push(
      `Note: ${holiday.name} is coming up soon. ` +
      `Consider referencing it naturally if relevant. ` +
      `Related hashtags: ${holiday.hashtags.join(", ")}.`,
    );
  }

  // Slang suggestions — pick a few relevant ones
  const slangEntries = Object.entries(SA_SLANG).slice(0, 8);
  const slangHints = slangEntries
    .map(([word, meaning]) => `"${word}" (${meaning})`)
    .join(", ");
  parts.push(
    `You may naturally weave in South African slang where appropriate: ${slangHints}.`,
  );

  // City references
  const cityList = SA_CITIES.slice(0, 8).join(", ");
  parts.push(
    `South African cities for context: ${cityList}.`,
  );

  // Hashtag suggestions
  const suggestedTags = suggestSAHashtags(content, existingHashtags, 5);
  if (suggestedTags.length > 0) {
    parts.push(
      `Suggested SA hashtags to include: ${suggestedTags.join(" ")}.`,
    );
  }

  return parts.join("\n");
}

// ── Public API ──────────────────────────────────────────────────

/**
 * Build a prompt for text (post) generation.
 *
 * Combines the user's request with brand tone, vocabulary, and
 * SA cultural context to produce an effective LLM prompt.
 */
export function buildTextPrompt(
  request: TextGenerationRequest,
  brandProfile?: BrandContext | null,
): string {
  const language = request.language ?? brandProfile?.language ?? "en";
  const sections: string[] = [];

  // System instruction
  sections.push(
    "You are a South African social media content creator. " +
    "Generate engaging, authentic social media posts that resonate with South African audiences.",
  );

  // Platform-specific instructions
  const platformLimits: Record<string, number> = {
    twitter: 280,
    instagram: 2200,
    facebook: 5000,
    linkedin: 3000,
    tiktok: 2200,
  };

  const maxLen = request.maxLength ?? platformLimits[request.platform] ?? 2200;
  sections.push(
    `Platform: ${request.platform}. ` +
    `Keep the post under ${maxLen} characters.`,
  );

  // Language
  const langName = getLanguageName(language);
  sections.push(`Write in ${langName}.`);

  // Brand tone
  if (brandProfile?.toneFingerprint) {
    const toneDesc = describeTone(brandProfile.toneFingerprint);
    if (toneDesc) sections.push(toneDesc);
  }

  // Brand vocabulary
  if (brandProfile?.vocabularyClusters && brandProfile.vocabularyClusters.length > 0) {
    const vocabDesc = describeVocabulary(brandProfile.vocabularyClusters);
    if (vocabDesc) sections.push(vocabDesc);
  }

  // Hashtag preferences from brand
  if (brandProfile?.hashtagPatterns && brandProfile.hashtagPatterns.length > 0) {
    const brandTags = brandProfile.hashtagPatterns
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5)
      .map((p) => p.hashtag);
    sections.push(`Brand's preferred hashtags: ${brandTags.join(" ")}.`);
  }

  // Hashtag count
  const hashtagCount = request.hashtagCount ?? 5;
  sections.push(`Include approximately ${hashtagCount} relevant hashtags.`);

  // Emoji preference
  if (request.includeEmoji !== false) {
    sections.push("Include relevant emoji naturally in the post.");
  }

  // SA cultural context
  if (request.includeSACulture !== false) {
    const culturalBlock = buildSACulturalBlock(request.prompt, [], language);
    sections.push("\n--- South African Cultural Context ---");
    sections.push(culturalBlock);
  }

  // User's actual prompt
  sections.push("\n--- User Request ---");
  sections.push(request.prompt);

  sections.push(
    "\nRespond with ONLY the social media post content. " +
    "Do not include explanations or meta-commentary.",
  );

  return sections.join("\n");
}

/**
 * Build a prompt for image generation.
 *
 * Enhances the user's description with brand visual style cues
 * and South African visual context.
 */
export function buildImagePrompt(
  request: ImageGenerationRequest,
  brandProfile?: BrandContext | null,
): string {
  const parts: string[] = [];

  // Base prompt
  parts.push(request.prompt);

  // Style hint
  if (request.style) {
    parts.push(`Style: ${request.style}.`);
  }

  // Brand visual style
  if (brandProfile?.visualStyle) {
    const vs = brandProfile.visualStyle;
    if (vs.colorPalette?.length > 0) {
      parts.push(`Color palette: ${vs.colorPalette.join(", ")}.`);
    }
    if (vs.filterPreferences?.length > 0) {
      parts.push(`Visual style: ${vs.filterPreferences.join(", ")}.`);
    }
    if (vs.imageTypes?.length > 0) {
      parts.push(`Image type preference: ${vs.imageTypes.join(", ")}.`);
    }
  }

  // SA visual context
  if (request.includeSACulture !== false) {
    parts.push(
      "South African context: Include visual elements that reflect " +
      "South African culture, landscapes, or urban scenes where appropriate. " +
      "Think vibrant colors, African patterns, Table Mountain, Johannesburg skyline, " +
      "or local market scenes.",
    );
  }

  // Dimensions hint
  if (request.dimensions) {
    parts.push(
      `Target dimensions: ${request.dimensions.width}×${request.dimensions.height} ` +
      `(${request.dimensions.label}).`,
    );
  }

  return parts.join(" ");
}

/**
 * Build a prompt for video generation.
 *
 * Adds format-specific instructions (duration, aspect ratio) and
 * SA visual/audio context.
 */
export function buildVideoPrompt(
  request: VideoGenerationRequest,
  brandProfile?: BrandContext | null,
): string {
  const parts: string[] = [];

  // Base prompt
  parts.push(request.prompt);

  // Duration
  if (request.durationSeconds) {
    parts.push(`Target duration: ${request.durationSeconds} seconds.`);
  }

  // Video dimensions / aspect ratio
  if (request.dimensions) {
    const aspectRatio =
      request.dimensions.width > request.dimensions.height
        ? "landscape"
        : request.dimensions.width < request.dimensions.height
          ? "portrait/vertical"
          : "square";

    parts.push(
      `Format: ${aspectRatio} (${request.dimensions.width}×${request.dimensions.height}, ` +
      `${request.dimensions.label}). ` +
      `Max duration: ${request.dimensions.maxDurationSeconds}s.`,
    );
  }

  // Brand visual style
  if (brandProfile?.visualStyle) {
    const vs = brandProfile.visualStyle;
    if (vs.colorPalette?.length > 0) {
      parts.push(`Brand colors: ${vs.colorPalette.join(", ")}.`);
    }
  }

  // SA context
  if (request.includeSACulture !== false) {
    parts.push(
      "South African context: Incorporate South African visual elements — " +
      "vibrant colors, diverse people, local landmarks, African textures and patterns. " +
      "The video should feel authentically South African.",
    );
  }

  return parts.join(" ");
}
