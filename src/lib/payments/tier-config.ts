/**
 * Tier configuration — single source of truth for all tier limits,
 * pricing, features, and Polar product ID mappings.
 *
 * South African context: all prices in ZAR (South African Rand).
 *
 * This module is pure data + lookup functions with no side effects,
 * safe to import from both server and client code.
 */

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

/** Subscription tiers — must match src/db/schema.ts tierEnum values */
export type Tier = "seedling" | "hustler" | "grower" | "mogul";

export type BillingInterval = "monthly" | "annual";

export interface TierLimits {
  /** Max connected social accounts. -1 = unlimited */
  socialAccounts: number;
  /** AI-generated posts per month */
  aiPostsPerMonth: number;
  /** AI image generations per month */
  imageGenPerMonth: number;
  /** AI video generations per month */
  videoGenPerMonth: number;
  /** Max team seats. -1 = unlimited */
  teamSeats: number;
}

export interface TierFeatures {
  /** Supported social platforms */
  platforms: string[];
  /** Scheduling capability level */
  schedulingMode:
    | "manual"
    | "manual_ai_weekly"
    | "ai_daily_weekly"
    | "full_autonomous";
  /** Whether unused credits roll over to next month */
  creditRollover: boolean;
  /** WhatsApp Business integration available */
  whatsappBusiness: boolean;
}

export interface TierConfig {
  tier: Tier;
  displayName: string;
  /** Monthly price in ZAR (0 for free tier) */
  monthlyPriceZAR: number;
  /** Annual price in ZAR (0 for free tier) */
  annualPriceZAR: number;
  /** Polar product ID for monthly billing. null for free tier */
  polarProductIdMonthly: string | null;
  /** Polar product ID for annual billing. null for free tier */
  polarProductIdAnnual: string | null;
  limits: TierLimits;
  /** Monthly AI credit allocation */
  creditAllocation: number;
  features: TierFeatures;
}

export interface TopUpPackage {
  /** Number of credits in this package */
  creditAmount: number;
  /** Price in ZAR */
  priceZAR: number;
  /** Polar product ID for this top-up */
  polarProductId: string;
  /** Human-readable label */
  label: string;
}

// ---------------------------------------------------------------------------
// Platform lists (reused across tiers)
// ---------------------------------------------------------------------------

const BASIC_PLATFORMS = ["instagram", "facebook"];
const ALL_PLATFORMS = [
  "instagram",
  "facebook",
  "twitter",
  "linkedin",
  "tiktok",
];
const ALL_PLATFORMS_PLUS_WHATSAPP = [...ALL_PLATFORMS, "whatsapp"];

// ---------------------------------------------------------------------------
// Tier configurations
// ---------------------------------------------------------------------------

export const TIER_CONFIGS: Record<Tier, TierConfig> = {
  seedling: {
    tier: "seedling",
    displayName: "Seedling",
    monthlyPriceZAR: 0,
    annualPriceZAR: 0,
    polarProductIdMonthly: null,
    polarProductIdAnnual: null,
    limits: {
      socialAccounts: 2,
      aiPostsPerMonth: 10,
      imageGenPerMonth: 0,
      videoGenPerMonth: 0,
      teamSeats: 1,
    },
    creditAllocation: 10,
    features: {
      platforms: BASIC_PLATFORMS,
      schedulingMode: "manual",
      creditRollover: false,
      whatsappBusiness: false,
    },
  },

  hustler: {
    tier: "hustler",
    displayName: "Hustler",
    monthlyPriceZAR: 299,
    annualPriceZAR: 2990,
    polarProductIdMonthly:
      process.env.POLAR_PRODUCT_HUSTLER_MONTHLY ?? null,
    polarProductIdAnnual:
      process.env.POLAR_PRODUCT_HUSTLER_ANNUAL ?? null,
    limits: {
      socialAccounts: 5,
      aiPostsPerMonth: 50,
      imageGenPerMonth: 10,
      videoGenPerMonth: 5,
      teamSeats: 2,
    },
    creditAllocation: 50,
    features: {
      platforms: ALL_PLATFORMS,
      schedulingMode: "manual_ai_weekly",
      creditRollover: false,
      whatsappBusiness: false,
    },
  },

  grower: {
    tier: "grower",
    displayName: "Grower",
    monthlyPriceZAR: 799,
    annualPriceZAR: 7990,
    polarProductIdMonthly:
      process.env.POLAR_PRODUCT_GROWER_MONTHLY ?? null,
    polarProductIdAnnual:
      process.env.POLAR_PRODUCT_GROWER_ANNUAL ?? null,
    limits: {
      socialAccounts: 15,
      aiPostsPerMonth: 200,
      imageGenPerMonth: 50,
      videoGenPerMonth: 20,
      teamSeats: 5,
    },
    creditAllocation: 200,
    features: {
      platforms: ALL_PLATFORMS,
      schedulingMode: "ai_daily_weekly",
      creditRollover: true,
      whatsappBusiness: false,
    },
  },

  mogul: {
    tier: "mogul",
    displayName: "Mogul",
    monthlyPriceZAR: 1999,
    annualPriceZAR: 19990,
    polarProductIdMonthly:
      process.env.POLAR_PRODUCT_MOGUL_MONTHLY ?? null,
    polarProductIdAnnual:
      process.env.POLAR_PRODUCT_MOGUL_ANNUAL ?? null,
    limits: {
      socialAccounts: -1,
      aiPostsPerMonth: 500,
      imageGenPerMonth: 200,
      videoGenPerMonth: 50,
      teamSeats: -1,
    },
    creditAllocation: 500,
    features: {
      platforms: ALL_PLATFORMS_PLUS_WHATSAPP,
      schedulingMode: "full_autonomous",
      creditRollover: true,
      whatsappBusiness: true,
    },
  },
} as const;

// ---------------------------------------------------------------------------
// Top-up packages
// ---------------------------------------------------------------------------

export const TOP_UP_PACKAGES: TopUpPackage[] = [
  {
    creditAmount: 10,
    priceZAR: 49,
    polarProductId: process.env.POLAR_PRODUCT_TOPUP_10 ?? "",
    label: "10 Credits",
  },
  {
    creditAmount: 25,
    priceZAR: 99,
    polarProductId: process.env.POLAR_PRODUCT_TOPUP_25 ?? "",
    label: "25 Credits",
  },
  {
    creditAmount: 50,
    priceZAR: 179,
    polarProductId: process.env.POLAR_PRODUCT_TOPUP_50 ?? "",
    label: "50 Credits",
  },
  {
    creditAmount: 100,
    priceZAR: 299,
    polarProductId: process.env.POLAR_PRODUCT_TOPUP_100 ?? "",
    label: "100 Credits",
  },
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/**
 * Get the full configuration for a tier.
 * Throws if the tier name is invalid.
 */
export function getTierConfig(tier: Tier): TierConfig {
  const config = TIER_CONFIGS[tier];
  if (!config) {
    throw new Error(`Unknown tier: ${tier}`);
  }
  return config;
}

/**
 * Resolve a Polar product ID to its corresponding tier.
 * Returns null if the product ID doesn't match any tier.
 */
export function getTierByPolarProductId(productId: string): Tier | null {
  for (const config of Object.values(TIER_CONFIGS)) {
    if (
      config.polarProductIdMonthly === productId ||
      config.polarProductIdAnnual === productId
    ) {
      return config.tier;
    }
  }
  return null;
}

/**
 * Resolve a Polar product ID to its corresponding top-up package.
 * Returns null if the product ID doesn't match any package.
 */
export function getTopUpPackageByProductId(
  productId: string,
): TopUpPackage | null {
  return TOP_UP_PACKAGES.find((pkg) => pkg.polarProductId === productId) ?? null;
}

/**
 * Find a top-up package by its credit amount.
 * Returns null if no package matches the exact amount.
 */
export function getTopUpPackageByCreditAmount(
  amount: number,
): TopUpPackage | null {
  return TOP_UP_PACKAGES.find((pkg) => pkg.creditAmount === amount) ?? null;
}
