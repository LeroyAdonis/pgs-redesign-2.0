/**
 * Brand analysis engine
 *
 * Processes an array of RawPost objects and produces a BrandAnalysisResult.
 * All analysis is done locally (no external API calls) using text heuristics.
 */

import { logger } from "@/lib/logger";
import type {
  RawPost,
  BrandAnalysisResult,
  ToneFingerprint,
  VocabularyCluster,
  HashtagPattern,
  PostingCadence,
  EmojiUsage,
  VisualStyle,
} from "./types";
import { calculateSACulturalScore } from "./sa-context";

// ── Emoji regex (simplified: common Unicode emoji ranges) ───────

const EMOJI_REGEX =
  /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1FA00}-\u{1FA9F}\u{200D}]/gu;

// ── Tone keyword dictionaries ───────────────────────────────────

const TONE_KEYWORDS: Record<keyof ToneFingerprint, string[]> = {
  formal: [
    "please", "kindly", "regards", "sincerely", "therefore", "hence",
    "furthermore", "consequently", "accordingly", "respectfully",
    "professional", "announce", "pleased", "delighted", "inform",
    "acknowledge", "pursuant", "hereby",
  ],
  casual: [
    "hey", "lol", "omg", "btw", "gonna", "wanna", "gotta", "yo",
    "cool", "awesome", "super", "totally", "literally", "vibe",
    "vibes", "chill", "lit", "fam", "bro", "dude", "nah", "yep",
    "yup", "haha", "bruh",
  ],
  humorous: [
    "lol", "haha", "rofl", "lmao", "joke", "funny", "hilarious",
    "laugh", "comedy", "😂", "🤣", "😄", "😆", "meme", "sarcasm",
    "irony", "witty",
  ],
  professional: [
    "industry", "strategy", "growth", "revenue", "roi", "kpi",
    "metrics", "analytics", "optimize", "innovation", "stakeholder",
    "deliverable", "pipeline", "synergy", "scalable", "milestone",
    "objective", "quarterly", "performance", "enterprise",
  ],
  inspirational: [
    "dream", "believe", "achieve", "inspire", "motivation", "journey",
    "success", "empower", "transform", "overcome", "passion",
    "purpose", "destiny", "courage", "strength", "rise", "shine",
    "thrive", "impact", "change", "legacy",
  ],
  educational: [
    "learn", "tip", "guide", "tutorial", "howto", "explained",
    "step", "lesson", "teach", "knowledge", "insight", "fact",
    "research", "study", "discover", "understand", "method",
    "technique", "framework", "beginner", "advanced",
  ],
};

// ── Stop words to exclude from vocabulary analysis ──────────────

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to",
  "for", "of", "with", "by", "from", "is", "are", "was", "were",
  "be", "been", "being", "have", "has", "had", "do", "does", "did",
  "will", "would", "could", "should", "may", "might", "can", "shall",
  "this", "that", "these", "those", "i", "you", "he", "she", "it",
  "we", "they", "me", "him", "her", "us", "them", "my", "your",
  "his", "its", "our", "their", "what", "which", "who", "whom",
  "not", "no", "so", "if", "than", "too", "very", "just", "about",
  "up", "out", "all", "also", "how", "each", "as", "more",
  "when", "where", "why", "some", "any", "new", "get", "got", "go",
  "going", "know", "like", "make", "over", "such", "take",
]);

// ── Vocabulary category patterns ────────────────────────────────

const VOCAB_CATEGORIES: Record<string, string[]> = {
  business: [
    "brand", "marketing", "sales", "customer", "client", "product",
    "service", "launch", "offer", "deal", "price", "value",
    "company", "business", "team", "partner", "collaborate",
  ],
  lifestyle: [
    "food", "travel", "fitness", "wellness", "health", "beauty",
    "fashion", "style", "home", "family", "weekend", "coffee",
    "morning", "evening", "routine",
  ],
  technology: [
    "tech", "digital", "app", "software", "data", "ai", "cloud",
    "mobile", "web", "platform", "code", "developer", "innovation",
  ],
  community: [
    "community", "support", "together", "join", "share", "connect",
    "network", "event", "local", "people", "culture", "celebrate",
  ],
  action: [
    "check", "follow", "click", "visit", "sign", "register",
    "download", "subscribe", "book", "order", "shop", "buy",
    "try", "start", "discover",
  ],
};

// ── Core analysis functions ─────────────────────────────────────

/**
 * Analyze tone from post content texts.
 * Scores each dimension 0–1 based on keyword frequency.
 */
export function analyzeTone(posts: RawPost[]): ToneFingerprint {
  const scores: ToneFingerprint = {
    formal: 0,
    casual: 0,
    humorous: 0,
    professional: 0,
    inspirational: 0,
    educational: 0,
  };

  if (posts.length === 0) return scores;

  const dimensions = Object.keys(scores) as Array<keyof ToneFingerprint>;

  for (const post of posts) {
    const words = post.content.toLowerCase().split(/\s+/);
    const wordCount = words.length || 1;

    for (const dim of dimensions) {
      const keywords = TONE_KEYWORDS[dim];
      const matches = words.filter((w) =>
        keywords.some((kw) => w.includes(kw)),
      ).length;
      // Normalize by word count, cap at 1
      scores[dim] += Math.min(matches / wordCount, 1);
    }
  }

  // Average across posts and apply a scaling factor
  for (const dim of dimensions) {
    scores[dim] = Math.round((scores[dim] / posts.length) * 100) / 100;
    // Scale up for better distribution (most posts won't be 100% one tone)
    scores[dim] = Math.min(scores[dim] * 5, 1);
    scores[dim] = Math.round(scores[dim] * 100) / 100;
  }

  return scores;
}

/**
 * Extract vocabulary clusters from posts.
 * Groups frequently used words by category.
 */
export function extractVocabularyClusters(
  posts: RawPost[],
): VocabularyCluster[] {
  if (posts.length === 0) return [];

  // Count word frequencies across all posts
  const wordFrequency = new Map<string, number>();

  for (const post of posts) {
    const words = post.content
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

    for (const word of words) {
      wordFrequency.set(word, (wordFrequency.get(word) ?? 0) + 1);
    }
  }

  // Categorize words
  const clusters: VocabularyCluster[] = [];

  for (const [category, keywords] of Object.entries(VOCAB_CATEGORIES)) {
    const matchedWords: Array<{ word: string; freq: number }> = [];

    for (const [word, freq] of wordFrequency) {
      if (keywords.some((kw) => word.includes(kw) || kw.includes(word))) {
        matchedWords.push({ word, freq });
      }
    }

    if (matchedWords.length > 0) {
      matchedWords.sort((a, b) => b.freq - a.freq);
      const topWords = matchedWords.slice(0, 10);
      const totalFreq = topWords.reduce((sum, w) => sum + w.freq, 0);

      clusters.push({
        category,
        words: topWords.map((w) => w.word),
        frequency: totalFreq,
      });
    }
  }

  // Add an "uncategorized" cluster for other frequent words
  const categorizedWords = new Set(clusters.flatMap((c) => c.words));
  const uncategorized: Array<{ word: string; freq: number }> = [];

  for (const [word, freq] of wordFrequency) {
    if (!categorizedWords.has(word) && freq >= 2) {
      uncategorized.push({ word, freq });
    }
  }

  if (uncategorized.length > 0) {
    uncategorized.sort((a, b) => b.freq - a.freq);
    const topUncategorized = uncategorized.slice(0, 15);
    clusters.push({
      category: "other",
      words: topUncategorized.map((w) => w.word),
      frequency: topUncategorized.reduce((sum, w) => sum + w.freq, 0),
    });
  }

  clusters.sort((a, b) => b.frequency - a.frequency);
  return clusters;
}

/**
 * Analyze hashtag patterns from posts.
 */
export function analyzeHashtags(posts: RawPost[]): HashtagPattern[] {
  if (posts.length === 0) return [];

  const hashtagCounts = new Map<string, number>();

  for (const post of posts) {
    for (const tag of post.hashtags) {
      const normalized = tag.startsWith("#") ? tag : `#${tag}`;
      hashtagCounts.set(
        normalized,
        (hashtagCounts.get(normalized) ?? 0) + 1,
      );
    }
  }

  const patterns: HashtagPattern[] = [];
  for (const [hashtag, frequency] of hashtagCounts) {
    // Simple categorization
    let category = "general";
    const lower = hashtag.toLowerCase();

    if (lower.includes("business") || lower.includes("entrepreneur")) {
      category = "business";
    } else if (lower.includes("tip") || lower.includes("learn")) {
      category = "educational";
    } else if (lower.includes("sale") || lower.includes("offer")) {
      category = "promotional";
    } else if (lower.includes("mzansi") || lower.includes("sa") || lower.includes("proudly")) {
      category = "south_african";
    }

    patterns.push({ hashtag, frequency, category });
  }

  patterns.sort((a, b) => b.frequency - a.frequency);
  return patterns;
}

/**
 * Analyze posting cadence from post timestamps.
 */
export function analyzePostingCadence(posts: RawPost[]): PostingCadence {
  if (posts.length === 0) {
    return { dayOfWeek: 0, hourOfDay: 9, postsPerWeek: 0 };
  }

  const dayCount = new Map<number, number>();
  const hourCount = new Map<number, number>();

  for (const post of posts) {
    const date = new Date(post.publishedAt);
    const day = date.getDay();
    const hour = date.getHours();

    dayCount.set(day, (dayCount.get(day) ?? 0) + 1);
    hourCount.set(hour, (hourCount.get(hour) ?? 0) + 1);
  }

  // Find most popular day
  let bestDay = 0;
  let bestDayCount = 0;
  for (const [day, count] of dayCount) {
    if (count > bestDayCount) {
      bestDay = day;
      bestDayCount = count;
    }
  }

  // Find most popular hour
  let bestHour = 9;
  let bestHourCount = 0;
  for (const [hour, count] of hourCount) {
    if (count > bestHourCount) {
      bestHour = hour;
      bestHourCount = count;
    }
  }

  // Calculate posts per week
  const dates = posts
    .map((p) => new Date(p.publishedAt).getTime())
    .sort((a, b) => a - b);
  const spanMs = dates[dates.length - 1] - dates[0];
  const spanWeeks = Math.max(spanMs / (7 * 24 * 60 * 60 * 1000), 1);
  const postsPerWeek = Math.round((posts.length / spanWeeks) * 10) / 10;

  return {
    dayOfWeek: bestDay,
    hourOfDay: bestHour,
    postsPerWeek,
  };
}

/**
 * Analyze emoji usage across posts.
 */
export function analyzeEmojis(posts: RawPost[]): EmojiUsage[] {
  const emojiCounts = new Map<string, number>();

  for (const post of posts) {
    // Use emojis from post data
    for (const emoji of post.emojis) {
      emojiCounts.set(emoji, (emojiCounts.get(emoji) ?? 0) + 1);
    }

    // Also extract from content
    const matches = post.content.match(EMOJI_REGEX);
    if (matches) {
      for (const emoji of matches) {
        emojiCounts.set(emoji, (emojiCounts.get(emoji) ?? 0) + 1);
      }
    }
  }

  const usage: EmojiUsage[] = [];
  for (const [emoji, frequency] of emojiCounts) {
    usage.push({ emoji, frequency });
  }

  usage.sort((a, b) => b.frequency - a.frequency);
  return usage.slice(0, 20); // Top 20 emojis
}

/**
 * Calculate average content length.
 */
export function calculateAvgContentLength(posts: RawPost[]): number {
  if (posts.length === 0) return 0;

  const total = posts.reduce((sum, p) => sum + p.content.length, 0);
  return Math.round(total / posts.length);
}

/**
 * Analyze visual style from post media.
 */
export function analyzeVisualStyle(posts: RawPost[]): VisualStyle {
  const colorCounts = new Map<string, number>();
  const filterCounts = new Map<string, number>();
  const typeCounts = new Map<string, number>();

  for (const post of posts) {
    for (const media of post.media) {
      typeCounts.set(media.type, (typeCounts.get(media.type) ?? 0) + 1);

      if (media.dominantColors) {
        for (const color of media.dominantColors) {
          colorCounts.set(color, (colorCounts.get(color) ?? 0) + 1);
        }
      }

      if (media.filter) {
        filterCounts.set(media.filter, (filterCounts.get(media.filter) ?? 0) + 1);
      }
    }
  }

  // Sort by frequency, take top values
  const sortByFreq = (map: Map<string, number>, limit: number) =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key]) => key);

  return {
    colorPalette: sortByFreq(colorCounts, 8),
    filterPreferences: sortByFreq(filterCounts, 5),
    imageTypes: sortByFreq(typeCounts, 3),
  };
}

/**
 * Detect languages present in posts.
 * Simple heuristic based on common word patterns.
 */
function detectLanguages(posts: RawPost[]): string[] {
  const languages = new Set<string>();

  for (const post of posts) {
    if (post.language) {
      languages.add(post.language);
    }
  }

  // Default to English if no language detected
  if (languages.size === 0) {
    languages.add("en");
  }

  return [...languages];
}

// ── Main analyzer ───────────────────────────────────────────────

/**
 * Run full brand analysis on a set of posts.
 *
 * @param posts - Array of normalized RawPost objects
 * @returns Complete BrandAnalysisResult
 */
export function analyzeBrandPosts(posts: RawPost[]): BrandAnalysisResult {
  logger.info("Starting brand analysis", { postCount: posts.length });

  const toneFingerprint = analyzeTone(posts);
  const vocabularyClusters = extractVocabularyClusters(posts);
  const hashtagPatterns = analyzeHashtags(posts);
  const postingCadence = analyzePostingCadence(posts);
  const emojiUsage = analyzeEmojis(posts);
  const avgContentLength = calculateAvgContentLength(posts);
  const visualStyle = analyzeVisualStyle(posts);
  const saCulturalScore = calculateSACulturalScore(posts);
  const detectedLanguages = detectLanguages(posts);

  const result: BrandAnalysisResult = {
    toneFingerprint,
    vocabularyClusters,
    hashtagPatterns,
    postingCadence,
    emojiUsage,
    avgContentLength,
    visualStyle,
    postsAnalyzed: posts.length,
    saCulturalScore,
    detectedLanguages,
  };

  logger.info("Brand analysis complete", {
    postsAnalyzed: result.postsAnalyzed,
    saCulturalScore: result.saCulturalScore,
    toneFingerprint: result.toneFingerprint,
  });

  return result;
}
