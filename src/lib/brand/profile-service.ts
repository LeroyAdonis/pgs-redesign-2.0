/**
 * Brand profile service — CRUD operations and orchestration
 *
 * Manages brand profiles in the database using Drizzle ORM.
 * Orchestrates the scrape → analyze → persist pipeline.
 */

import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { brandProfile, socialAccount } from "@/db/schema";
import { logger } from "@/lib/logger";
import type {
  BrandAnalysisResult,
  BrandProfileUpdate,
  ScrapeOptions,
  ScrapePlatform,
} from "./types";
import { analyzeBrandPosts } from "./analyzer";
import { getScraperForPlatform } from "./scrapers";

// ── Types ───────────────────────────────────────────────────────

/** Brand profile row from the database */
export type BrandProfileRow = typeof brandProfile.$inferSelect;

/** Insert shape for brand profile */
type BrandProfileInsert = typeof brandProfile.$inferInsert;

// ── CRUD Operations ─────────────────────────────────────────────

/**
 * Get all brand profiles for an organization.
 * Optionally filter by language.
 */
export async function getProfilesForOrg(
  orgId: string,
  language?: string,
): Promise<BrandProfileRow[]> {
  const conditions = [eq(brandProfile.orgId, orgId)];

  if (language) {
    conditions.push(eq(brandProfile.language, language));
  }

  const profiles = await db
    .select()
    .from(brandProfile)
    .where(and(...conditions));

  return profiles;
}

/**
 * Get a single brand profile by ID.
 */
export async function getProfileById(
  profileId: string,
): Promise<BrandProfileRow | undefined> {
  const results = await db
    .select()
    .from(brandProfile)
    .where(eq(brandProfile.id, profileId))
    .limit(1);

  return results[0];
}

/**
 * Create a new brand profile.
 */
export async function createProfile(
  data: BrandProfileInsert,
): Promise<BrandProfileRow> {
  const results = await db.insert(brandProfile).values(data).returning();
  const profile = results[0];

  logger.info("Brand profile created", {
    profileId: profile.id,
    orgId: profile.orgId,
  });

  return profile;
}

/**
 * Update an existing brand profile with partial data.
 */
export async function updateProfile(
  profileId: string,
  updates: BrandProfileUpdate,
): Promise<BrandProfileRow | undefined> {
  const results = await db
    .update(brandProfile)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(brandProfile.id, profileId))
    .returning();

  const profile = results[0];

  if (profile) {
    logger.info("Brand profile updated", { profileId });
  }

  return profile;
}

/**
 * Delete a brand profile.
 */
export async function deleteProfile(profileId: string): Promise<boolean> {
  const results = await db
    .delete(brandProfile)
    .where(eq(brandProfile.id, profileId))
    .returning();

  return results.length > 0;
}

// ── Orchestration ───────────────────────────────────────────────

/**
 * Run a full brand analysis for a social account.
 *
 * 1. Looks up the social account to determine platform
 * 2. Scrapes posts using the appropriate scraper
 * 3. Analyzes the posts
 * 4. Creates or updates the brand profile
 *
 * @returns The analysis result and the saved profile
 */
export async function analyzeBrand(
  socialAccountId: string,
  orgId: string,
  options?: { maxPosts?: number; useMockData?: boolean },
): Promise<{
  result: BrandAnalysisResult;
  profile: BrandProfileRow;
}> {
  logger.info("Starting brand analysis", { socialAccountId, orgId });

  // 1. Look up social account for platform info
  const accounts = await db
    .select()
    .from(socialAccount)
    .where(eq(socialAccount.id, socialAccountId))
    .limit(1);

  const account = accounts[0];
  if (!account) {
    throw new Error(`Social account not found: ${socialAccountId}`);
  }

  // Validate platform is supported for scraping
  const supportedPlatforms: ScrapePlatform[] = [
    "instagram",
    "facebook",
    "twitter",
    "linkedin",
  ];
  if (!supportedPlatforms.includes(account.platform as ScrapePlatform)) {
    throw new Error(`Platform not supported for brand analysis: ${account.platform}`);
  }

  const platform = account.platform as ScrapePlatform;

  // 2. Scrape posts
  const scraper = getScraperForPlatform(platform);
  const scrapeOptions: ScrapeOptions = {
    socialAccountId,
    platform,
    maxPosts: options?.maxPosts ?? 50,
    useMockData: options?.useMockData ?? true, // Default to mock for now
  };

  const scrapeResult = await scraper.scrape(scrapeOptions);

  logger.info("Scrape complete", {
    platform,
    postsScraped: scrapeResult.posts.length,
    isMock: scrapeResult.isMock,
  });

  // 3. Analyze posts
  const analysisResult = analyzeBrandPosts(scrapeResult.posts);

  // 4. Persist — upsert brand profile
  const existing = await db
    .select()
    .from(brandProfile)
    .where(
      and(
        eq(brandProfile.orgId, orgId),
        eq(brandProfile.socialAccountId, socialAccountId),
      ),
    )
    .limit(1);

  let profile: BrandProfileRow;

  if (existing[0]) {
    // Update existing profile
    const updated = await db
      .update(brandProfile)
      .set({
        toneFingerprint: analysisResult.toneFingerprint,
        vocabularyClusters: analysisResult.vocabularyClusters,
        hashtagPatterns: analysisResult.hashtagPatterns,
        postingCadence: analysisResult.postingCadence,
        emojiUsage: analysisResult.emojiUsage,
        avgContentLength: analysisResult.avgContentLength,
        visualStyle: analysisResult.visualStyle,
        language: analysisResult.detectedLanguages[0] ?? "en",
        updatedAt: new Date(),
      })
      .where(eq(brandProfile.id, existing[0].id))
      .returning();

    profile = updated[0];
    logger.info("Brand profile updated from analysis", {
      profileId: profile.id,
    });
  } else {
    // Create new profile
    const created = await db
      .insert(brandProfile)
      .values({
        orgId,
        socialAccountId,
        toneFingerprint: analysisResult.toneFingerprint,
        vocabularyClusters: analysisResult.vocabularyClusters,
        hashtagPatterns: analysisResult.hashtagPatterns,
        postingCadence: analysisResult.postingCadence,
        emojiUsage: analysisResult.emojiUsage,
        avgContentLength: analysisResult.avgContentLength,
        visualStyle: analysisResult.visualStyle,
        language: analysisResult.detectedLanguages[0] ?? "en",
      })
      .returning();

    profile = created[0];
    logger.info("Brand profile created from analysis", {
      profileId: profile.id,
    });
  }

  return { result: analysisResult, profile };
}

/**
 * Preview brand analysis without saving to database.
 * Used during onboarding to show users what the analysis looks like.
 */
export async function previewBrandAnalysis(
  socialAccountId: string,
): Promise<BrandAnalysisResult> {
  // Look up social account
  const accounts = await db
    .select()
    .from(socialAccount)
    .where(eq(socialAccount.id, socialAccountId))
    .limit(1);

  const account = accounts[0];
  if (!account) {
    throw new Error(`Social account not found: ${socialAccountId}`);
  }

  const platform = account.platform as ScrapePlatform;
  const scraper = getScraperForPlatform(platform);

  const scrapeResult = await scraper.scrape({
    socialAccountId,
    platform,
    maxPosts: 25,
    useMockData: true,
  });

  return analyzeBrandPosts(scrapeResult.posts);
}

/**
 * Merge multiple brand profiles into a single org-level profile.
 *
 * Averages tone scores, combines vocabulary/hashtags, etc.
 */
export function mergeProfiles(
  profiles: BrandProfileRow[],
): BrandProfileUpdate {
  if (profiles.length === 0) {
    return {};
  }

  if (profiles.length === 1) {
    const p = profiles[0];
    return {
      toneFingerprint: p.toneFingerprint ?? undefined,
      vocabularyClusters: p.vocabularyClusters ?? undefined,
      hashtagPatterns: p.hashtagPatterns ?? undefined,
      postingCadence: p.postingCadence ?? undefined,
      emojiUsage: p.emojiUsage ?? undefined,
      avgContentLength: p.avgContentLength ?? undefined,
      visualStyle: p.visualStyle ?? undefined,
    };
  }

  // Average tone fingerprints
  const toneKeys = [
    "formal",
    "casual",
    "humorous",
    "professional",
    "inspirational",
    "educational",
  ] as const;

  const avgTone = {
    formal: 0,
    casual: 0,
    humorous: 0,
    professional: 0,
    inspirational: 0,
    educational: 0,
  };
  for (const key of toneKeys) {
    const values = profiles
      .map((p) => p.toneFingerprint?.[key])
      .filter((v): v is number => v !== undefined);

    avgTone[key] =
      values.length > 0
        ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100
        : 0;
  }

  // Combine vocabulary clusters (merge same categories)
  const vocabMap = new Map<string, { words: Set<string>; frequency: number }>();
  for (const profile of profiles) {
    for (const cluster of profile.vocabularyClusters ?? []) {
      const existing = vocabMap.get(cluster.category);
      if (existing) {
        for (const word of cluster.words) {
          existing.words.add(word);
        }
        existing.frequency += cluster.frequency;
      } else {
        vocabMap.set(cluster.category, {
          words: new Set(cluster.words),
          frequency: cluster.frequency,
        });
      }
    }
  }

  // Combine hashtag patterns (sum frequencies)
  const hashtagMap = new Map<
    string,
    { frequency: number; category: string }
  >();
  for (const profile of profiles) {
    for (const pattern of profile.hashtagPatterns ?? []) {
      const existing = hashtagMap.get(pattern.hashtag);
      if (existing) {
        existing.frequency += pattern.frequency;
      } else {
        hashtagMap.set(pattern.hashtag, {
          frequency: pattern.frequency,
          category: pattern.category,
        });
      }
    }
  }

  // Average content length
  const lengths = profiles
    .map((p) => p.avgContentLength)
    .filter((v): v is number => v !== null && v !== undefined);
  const avgLength =
    lengths.length > 0
      ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)
      : 0;

  return {
    toneFingerprint: avgTone,
    vocabularyClusters: [...vocabMap.entries()].map(([category, data]) => ({
      category,
      words: [...data.words],
      frequency: data.frequency,
    })),
    hashtagPatterns: [...hashtagMap.entries()].map(([hashtag, data]) => ({
      hashtag,
      frequency: data.frequency,
      category: data.category,
    })),
    avgContentLength: avgLength,
  };
}
