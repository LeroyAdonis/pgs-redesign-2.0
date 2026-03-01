"use client";

/**
 * PlatformSelector — Multi-select pill/chip selector for social platforms
 *
 * Displays platforms as togglable pills with icons.
 * Selected platforms get a purple highlight.
 */

import { cn } from "@/lib/utils";

// ── Platform Config ─────────────────────────────────────────────

interface PlatformOption {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const PLATFORMS: PlatformOption[] = [
  {
    id: "instagram",
    label: "Instagram",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="18" cy="6" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2Z" />
      </svg>
    ),
  },
  {
    id: "twitter",
    label: "X (Twitter)",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M4 4l6.5 8L4 20h2l5.5-6.5L16 20h4l-6.5-8L20 4h-2l-5.5 6.5L8 4H4Z" />
      </svg>
    ),
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6Z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
  {
    id: "tiktok",
    label: "TikTok",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
      </svg>
    ),
  },
];

// ── Component ───────────────────────────────────────────────────

interface PlatformSelectorProps {
  selected: string[];
  onChange: (platforms: string[]) => void;
}

export function PlatformSelector({ selected, onChange }: PlatformSelectorProps) {
  function toggle(platformId: string) {
    if (selected.includes(platformId)) {
      onChange(selected.filter((p) => p !== platformId));
    } else {
      onChange([...selected, platformId]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Select platforms">
      {PLATFORMS.map((platform) => {
        const isSelected = selected.includes(platform.id);
        return (
          <button
            key={platform.id}
            type="button"
            onClick={() => toggle(platform.id)}
            aria-pressed={isSelected}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              "border",
              isSelected
                ? "border-brand bg-brand-surface text-brand"
                : "border-border bg-surface text-text-muted hover:border-brand/50 hover:text-text",
            )}
          >
            {platform.icon}
            <span>{platform.label}</span>
          </button>
        );
      })}
    </div>
  );
}
