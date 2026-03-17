"use client";

/**
 * ContentTypeSelector — Tab pills for Text | Image | Video
 *
 * Active tab gets purple highlight. Each tab includes an icon.
 */

import { cn } from "@/lib/utils";
import type { ContentType } from "@/lib/ai/types";

interface ContentTypeSelectorProps {
  value: ContentType;
  onChange: (type: ContentType) => void;
}

const CONTENT_TYPES: { id: ContentType; label: string; icon: React.ReactNode }[] = [
  {
    id: "text",
    label: "Text",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path strokeLinecap="round" d="M3 3h10M3 6.5h7M3 10h9M3 13.5h5" />
      </svg>
    ),
  },
  {
    id: "image",
    label: "Image",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="2" y="2" width="12" height="12" rx="1.5" />
        <circle cx="5.5" cy="5.5" r="1.5" />
        <path d="M14 11l-3-3-5 5" />
      </svg>
    ),
  },
  {
    id: "video",
    label: "Video",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="2" y="3" width="12" height="10" rx="1.5" />
        <path d="M6.5 6v4l3.5-2-3.5-2Z" fill="currentColor" />
      </svg>
    ),
  },
];

export function ContentTypeSelector({ value, onChange }: ContentTypeSelectorProps) {
  return (
    <div
      className="inline-flex gap-1 rounded-none border border-border bg-surface-raised p-1"
      role="tablist"
      aria-label="Content type"
    >
      {CONTENT_TYPES.map((type) => {
        const isActive = value === type.id;
        return (
          <button
            key={type.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(type.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-none px-3 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-brand text-white shadow-sm"
                : "text-text-muted hover:text-text",
            )}
          >
            {type.icon}
            <span>{type.label}</span>
          </button>
        );
      })}
    </div>
  );
}
