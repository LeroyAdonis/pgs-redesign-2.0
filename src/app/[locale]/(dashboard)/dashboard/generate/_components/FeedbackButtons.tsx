"use client";

import { useTranslations } from "next-intl";

/**
 * FeedbackButtons — 👍/👎 rating pills for AI-generated content
 *
 * On click: calls POST /api/ai/feedback
 * Shows "Thanks!" confirmation after rating, then disables.
 */

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { ContentRating, ContentType } from "@/lib/ai/types";

interface FeedbackButtonsProps {
  originalContent: string;
  editedContent?: string;
  aiModel: string;
  aiPrompt: string;
  platform: string;
  contentType: ContentType;
}

export function FeedbackButtons({
  originalContent,
  editedContent,
  aiModel,
  aiPrompt,
  platform,
  contentType,
}: FeedbackButtonsProps) {
  const [rated, setRated] = useState<ContentRating | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitFeedback = useCallback(
    async (rating: ContentRating) => {
      setIsSubmitting(true);
      try {
        await fetch("/api/ai/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating,
            originalContent,
            editedContent,
            aiModel,
            aiPrompt,
            platform,
            contentType,
          }),
        });
        setRated(rating);
      } catch {
        // Silently fail — feedback is non-critical
      } finally {
        setIsSubmitting(false);
      }
    },
    [originalContent, editedContent, aiModel, aiPrompt, platform, contentType],
  );

  if (rated) {
    return (
      <div className="flex items-center gap-2 text-xs text-text-muted" data-testid="feedback-thanks">
        <span>Thanks for your feedback!</span>
        <span>{rated === "thumbs_up" ? "👍" : "👎"}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Rate this content">
      <span className="text-xs text-text-muted">Rate this:</span>
      <button
        type="button"
        onClick={() => submitFeedback("thumbs_up")}
        disabled={isSubmitting}
        aria-label="Thumbs up"
        className={cn(
          "flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs transition-colors",
          "hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        👍
      </button>
      <button
        type="button"
        onClick={() => submitFeedback("thumbs_down")}
        disabled={isSubmitting}
        aria-label="Thumbs down"
        className={cn(
          "flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs transition-colors",
          "hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        👎
      </button>
    </div>
  );
}
