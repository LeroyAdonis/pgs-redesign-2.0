/**
 * Tier enforcement service
 *
 * Server-side service for checking tier limits, platform access,
 * and scheduling modes against the organisation's current tier.
 *
 * Used by API routes and server actions to enforce limits before
 * allowing operations like connecting social accounts, generating
 * AI content, or adding team members.
 *
 * Provides both a generic `checkTierLimit()` and named convenience
 * functions (`checkAccountLimit`, `checkPostLimit`, etc.) that
 * include an `upgradeRequired` field indicating the cheapest tier
 * that would satisfy the request.
 */

import { db } from "@/db";
import {
  organization,
  socialAccount,
  creditTransaction,
  organizationMember,
} from "@/db/schema";
import { eq, and, gte, count, ilike } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { TIER_CONFIGS, type Tier, type TierLimits } from "./tier-config";
import type { LimitType } from "./types";

// Re-export for convenience
export type { LimitType };

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface TierLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  tier: Tier;
}

/** Extended result with upgrade suggestion — returned by named helpers */
export interface EnforcementResult extends TierLimitResult {
  /** The cheapest tier that would allow the action, or undefined if already allowed */
  upgradeRequired?: Tier;
}

export interface PlatformAccessResult {
  allowed: boolean;
  tier: Tier;
}

export interface SchedulingModeResult {
  mode: string;
  tier: Tier;
}

/** Result for the generic feature access check */
export interface FeatureAccessResult {
  allowed: boolean;
  tier: Tier;
  feature: string;
  upgradeRequired?: Tier;
}

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

/** Maps API-facing limit types to TierLimits config keys */
const LIMIT_TYPE_TO_CONFIG_KEY: Record<LimitType, keyof TierLimits> = {
  social_accounts: "socialAccounts",
  ai_posts: "aiPostsPerMonth",
  image_gen: "imageGenPerMonth",
  video_gen: "videoGenPerMonth",
  team_seats: "teamSeats",
};

/** Tier progression order, lowest to highest */
const TIER_ORDER: Tier[] = ["seedling", "hustler", "grower", "mogul"];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Get the start of the current month in UTC */
function getStartOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** Fetch the tier for an organisation. Throws if not found. */
async function getOrgTier(orgId: string): Promise<Tier> {
  const rows = await db
    .select({ tier: organization.tier })
    .from(organization)
    .where(eq(organization.id, orgId))
    .limit(1);

  if (rows.length === 0) {
    throw new Error(`Organization not found: ${orgId}`);
  }

  return rows[0].tier;
}

/**
 * Count monthly credit deductions, optionally filtered by description pattern.
 *
 * Used for ai_posts (no pattern), image_gen (%image generation%),
 * and video_gen (%video generation%).
 */
async function countMonthlyDeductions(
  orgId: string,
  descriptionPattern?: string,
): Promise<number> {
  const monthStart = getStartOfCurrentMonth();

  const conditions = [
    eq(creditTransaction.orgId, orgId),
    eq(creditTransaction.type, "deduction"),
    gte(creditTransaction.createdAt, monthStart),
  ];

  if (descriptionPattern) {
    conditions.push(ilike(creditTransaction.description, descriptionPattern));
  }

  const result = await db
    .select({ value: count() })
    .from(creditTransaction)
    .where(and(...conditions));

  return result[0]?.value ?? 0;
}

/** Count current usage for a given limit type */
async function countCurrentUsage(
  orgId: string,
  limitType: LimitType,
): Promise<number> {
  switch (limitType) {
    case "social_accounts": {
      const result = await db
        .select({ value: count() })
        .from(socialAccount)
        .where(eq(socialAccount.orgId, orgId));
      return result[0]?.value ?? 0;
    }

    case "ai_posts":
      return countMonthlyDeductions(orgId);

    case "image_gen":
      return countMonthlyDeductions(orgId, "%image generation%");

    case "video_gen":
      return countMonthlyDeductions(orgId, "%video generation%");

    case "team_seats": {
      const result = await db
        .select({ value: count() })
        .from(organizationMember)
        .where(eq(organizationMember.orgId, orgId));
      return result[0]?.value ?? 0;
    }
  }
}

/**
 * Find the next tier above the given one, or null if already at mogul.
 */
function getNextTier(currentTier: Tier): Tier | null {
  const idx = TIER_ORDER.indexOf(currentTier);
  if (idx === -1 || idx >= TIER_ORDER.length - 1) return null;
  return TIER_ORDER[idx + 1];
}

/**
 * Build an `EnforcementResult` from a `TierLimitResult`.
 * Attaches `upgradeRequired` when the action is denied.
 */
function toEnforcementResult(
  base: TierLimitResult,
  limitType: LimitType,
): EnforcementResult {
  if (base.allowed) {
    return base;
  }

  // Find the cheapest tier that can handle current + 1
  const upgradeRequired = getRequiredTierForLimit(
    limitType,
    base.current + 1,
  );

  return { ...base, upgradeRequired };
}

// ---------------------------------------------------------------------------
// Public API — generic
// ---------------------------------------------------------------------------

/**
 * Check whether the organisation is within its tier limit for a given resource.
 *
 * @returns allowed=true when current usage is below the limit or the limit
 *          is unlimited (-1).
 */
export async function checkTierLimit(
  orgId: string,
  limitType: LimitType,
): Promise<TierLimitResult> {
  const tier = await getOrgTier(orgId);
  const config = TIER_CONFIGS[tier];
  const configKey = LIMIT_TYPE_TO_CONFIG_KEY[limitType];
  const limit = config.limits[configKey];
  const current = await countCurrentUsage(orgId, limitType);

  const allowed = limit === -1 || current < limit;

  logger.debug("Tier limit check", {
    orgId,
    limitType,
    tier,
    current,
    limit,
    allowed,
  });

  return { allowed, current, limit, tier };
}

/**
 * Check whether the organisation's tier allows access to a given platform.
 *
 * WhatsApp Business is a special feature flag checked separately from the
 * standard platforms list.
 */
export async function checkPlatformAccess(
  orgId: string,
  platform: string,
): Promise<PlatformAccessResult> {
  const tier = await getOrgTier(orgId);
  const config = TIER_CONFIGS[tier];

  if (platform === "whatsapp") {
    return { allowed: config.features.whatsappBusiness, tier };
  }

  const allowed = config.features.platforms.includes(platform);

  logger.debug("Platform access check", { orgId, platform, tier, allowed });

  return { allowed, tier };
}

/**
 * Get the scheduling mode available for the organisation's tier.
 */
export async function checkSchedulingMode(
  orgId: string,
): Promise<SchedulingModeResult> {
  const tier = await getOrgTier(orgId);
  const config = TIER_CONFIGS[tier];

  return { mode: config.features.schedulingMode, tier };
}

/**
 * Determine the minimum tier needed to support a desired count for a limit type.
 *
 * Iterates tiers from seedling → mogul and returns the first tier whose limit
 * is >= desiredCount (or unlimited). Falls back to mogul if no tier qualifies.
 *
 * This is a pure function — no database access required.
 */
export function getRequiredTierForLimit(
  limitType: LimitType,
  desiredCount: number,
): Tier {
  const configKey = LIMIT_TYPE_TO_CONFIG_KEY[limitType];

  for (const tier of TIER_ORDER) {
    const limit = TIER_CONFIGS[tier].limits[configKey];
    if (limit === -1 || limit >= desiredCount) {
      return tier;
    }
  }

  // Fallback — should only happen when desiredCount exceeds all finite limits
  return "mogul";
}

// ---------------------------------------------------------------------------
// Public API — named convenience functions
// ---------------------------------------------------------------------------

/**
 * Check if the organisation can add more social accounts.
 */
export async function checkAccountLimit(
  orgId: string,
): Promise<EnforcementResult> {
  const result = await checkTierLimit(orgId, "social_accounts");
  return toEnforcementResult(result, "social_accounts");
}

/**
 * Check if the organisation can create more AI posts this month.
 */
export async function checkPostLimit(
  orgId: string,
): Promise<EnforcementResult> {
  const result = await checkTierLimit(orgId, "ai_posts");
  return toEnforcementResult(result, "ai_posts");
}

/**
 * Check if the organisation can generate more AI images this month.
 */
export async function checkImageGenLimit(
  orgId: string,
): Promise<EnforcementResult> {
  const result = await checkTierLimit(orgId, "image_gen");
  return toEnforcementResult(result, "image_gen");
}

/**
 * Check if the organisation can generate more AI videos this month.
 */
export async function checkVideoGenLimit(
  orgId: string,
): Promise<EnforcementResult> {
  const result = await checkTierLimit(orgId, "video_gen");
  return toEnforcementResult(result, "video_gen");
}

/**
 * Check if the organisation can add more team members.
 */
export async function checkTeamSeatLimit(
  orgId: string,
): Promise<EnforcementResult> {
  const result = await checkTierLimit(orgId, "team_seats");
  return toEnforcementResult(result, "team_seats");
}

/**
 * Generic feature access check.
 *
 * Checks platform access and feature flags. For quantitative limits,
 * prefer the named helpers above (checkPostLimit, checkAccountLimit, etc.).
 *
 * Supported features: platform names ("whatsapp", "tiktok", etc.),
 * "credit_rollover", "autonomous_scheduling".
 */
export async function checkFeatureAccess(
  orgId: string,
  feature: string,
): Promise<FeatureAccessResult> {
  const tier = await getOrgTier(orgId);
  const config = TIER_CONFIGS[tier];

  let allowed = false;

  switch (feature) {
    case "credit_rollover":
      allowed = config.features.creditRollover;
      break;

    case "autonomous_scheduling":
      allowed = config.features.schedulingMode === "full_autonomous";
      break;

    case "whatsapp":
      allowed = config.features.whatsappBusiness;
      break;

    default:
      // Treat as a platform name
      allowed = config.features.platforms.includes(feature);
      break;
  }

  // Find the cheapest tier that supports this feature
  let upgradeRequired: Tier | undefined;
  if (!allowed) {
    for (const candidate of TIER_ORDER) {
      const candidateConfig = TIER_CONFIGS[candidate];
      let candidateAllowed = false;

      switch (feature) {
        case "credit_rollover":
          candidateAllowed = candidateConfig.features.creditRollover;
          break;
        case "autonomous_scheduling":
          candidateAllowed =
            candidateConfig.features.schedulingMode === "full_autonomous";
          break;
        case "whatsapp":
          candidateAllowed = candidateConfig.features.whatsappBusiness;
          break;
        default:
          candidateAllowed =
            candidateConfig.features.platforms.includes(feature);
          break;
      }

      if (candidateAllowed) {
        upgradeRequired = candidate;
        break;
      }
    }
  }

  logger.debug("Feature access check", {
    orgId,
    feature,
    tier,
    allowed,
    upgradeRequired,
  });

  return { allowed, tier, feature, upgradeRequired };
}
