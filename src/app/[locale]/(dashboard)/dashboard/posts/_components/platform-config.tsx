import { useTranslations } from "next-intl";
/**
 * Platform configuration — icons, colors, and labels.
 *
 * Shared across PostCard, PostFilters, and BulkGenerator.
 * Each icon is a 16×16 inline SVG, consistent with the
 * PlatformSelector on the generate page.
 */

import type { PlatformId } from "./types";

interface PlatformConfig {
  label: string;
  color: string;
  icon: React.ReactNode;
}

export const PLATFORM_CONFIG: Record<PlatformId, PlatformConfig> = {
  instagram: {
    label: "Instagram",
    color: "#E4405F",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="18" cy="6" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  facebook: {
    label: "Facebook",
    color: "#1877F2",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2Z" />
      </svg>
    ),
  },
  twitter: {
    label: "X (Twitter)",
    color: "#000000",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M4 4l6.5 8L4 20h2l5.5-6.5L16 20h4l-6.5-8L20 4h-2l-5.5 6.5L8 4H4Z" />
      </svg>
    ),
  },
  linkedin: {
    label: "LinkedIn",
    color: "#0A66C2",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6Z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
  tiktok: {
    label: "TikTok",
    color: "#00F2EA",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
      </svg>
    ),
  },
  whatsapp: {
    label: "WhatsApp",
    color: "#25D366",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
        <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Zm0 0a5 5 0 0 0 5 5m0 0a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1h1Z" />
      </svg>
    ),
  },
  google_business: {
    label: "Google Business",
    color: "#4285F4",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
  },
};

/** All platform IDs in display order */
export const ALL_PLATFORM_IDS = Object.keys(PLATFORM_CONFIG) as PlatformId[];
