"use client";

/**
 * GenerationPreview — Displays generated content based on type
 *
 * Conditional rendering for text, image, and video content.
 * Includes loading skeleton, editable text mode, and download for images.
 */

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { ContentType, GenerationState } from "@/lib/ai/types";

interface GenerationPreviewProps {
  contentType: ContentType;
  generationState: GenerationState;
  generatedContent: string | null;
  generatedImageUrl: string | null;
  generatedVideoUrl: string | null;
  errorMessage: string | null;
  onContentEdit: (content: string) => void;
  onSaveDraft: () => void;
  onRegenerate: () => void;
  onCopy: () => void;
  isSaving: boolean;
}

export function GenerationPreview({
  contentType,
  generationState,
  generatedContent,
  generatedImageUrl,
  generatedVideoUrl,
  errorMessage,
  onContentEdit,
  onSaveDraft,
  onRegenerate,
  onCopy,
  isSaving,
}: GenerationPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = useCallback(() => {
    onCopy();
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  }, [onCopy]);

  // ── Loading State ───────────────────────────────────────────
  if (generationState === "generating") {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6" data-testid="generation-loading">
        <div className="flex items-center gap-2 text-sm text-brand">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="15" />
          </svg>
          <span>Generating {contentType} content...</span>
        </div>
        {/* Skeleton */}
        <div className="space-y-3">
          <div className="h-4 w-3/4 animate-pulse rounded bg-surface-raised" />
          <div className="h-4 w-full animate-pulse rounded bg-surface-raised" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-surface-raised" />
        </div>
      </div>
    );
  }

  // ── Error State ─────────────────────────────────────────────
  if (generationState === "error") {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400" role="alert">
        <p className="font-medium">Generation failed</p>
        <p className="mt-1">{errorMessage ?? "An unexpected error occurred. Please try again."}</p>
      </div>
    );
  }

  // ── Idle State ──────────────────────────────────────────────
  if (generationState === "idle" || !generatedContent && !generatedImageUrl && !generatedVideoUrl) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface p-12 text-center" data-testid="generation-idle">
        <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1" className="mb-4 text-text-muted" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M24 8v8M24 32v8M8 24h8M32 24h8M13 13l5.5 5.5M29.5 29.5L35 35M13 35l5.5-5.5M29.5 18.5L35 13" />
        </svg>
        <p className="text-sm text-text-muted">
          Your generated content will appear here
        </p>
        <p className="mt-1 text-xs text-text-muted/70">
          Enter a prompt and click Generate to get started
        </p>
      </div>
    );
  }

  // ── Success: Text Content ───────────────────────────────────
  if (contentType === "text" && generatedContent) {
    // Split content to find hashtags
    const parts = generatedContent.split(/(#\w+)/g);

    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-border bg-surface p-6" data-testid="generation-text-result">
          {isEditing ? (
            <textarea
              value={generatedContent}
              onChange={(e) => onContentEdit(e.target.value)}
              className="w-full resize-none rounded-none border border-border bg-surface-raised p-3 text-sm text-text focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              rows={8}
              aria-label="Edit generated content"
            />
          ) : (
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-text">
              {parts.map((part, i) =>
                part.startsWith("#") ? (
                  <span key={i} className="font-medium text-brand">
                    {part}
                  </span>
                ) : (
                  <span key={i}>{part}</span>
                ),
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="rounded-none border border-border px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text"
          >
            {isEditing ? "Preview" : "Edit"}
          </button>
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isSaving}
            className={cn(
              "rounded-none bg-brand px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand/90",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {isSaving ? "Saving..." : "Save as Draft"}
          </button>
          <button
            type="button"
            onClick={onRegenerate}
            className="rounded-none border border-border px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text"
          >
            Regenerate
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-none border border-border px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text"
          >
            {copySuccess ? "Copied!" : "Copy to Clipboard"}
          </button>
        </div>
      </div>
    );
  }

  // ── Success: Image Content ──────────────────────────────────
  if (contentType === "image" && generatedImageUrl) {
    return (
      <div className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-xl border border-border bg-surface" data-testid="generation-image-result">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={generatedImageUrl}
            alt="AI generated image"
            className="w-full object-contain"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={generatedImageUrl}
            download="purple-glow-generated.png"
            className="rounded-none bg-brand px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand/90"
          >
            Download
          </a>
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isSaving}
            className={cn(
              "rounded-none border border-border px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {isSaving ? "Saving..." : "Save as Draft"}
          </button>
          <button
            type="button"
            onClick={onRegenerate}
            className="rounded-none border border-border px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text"
          >
            Regenerate
          </button>
        </div>
      </div>
    );
  }

  // ── Success: Video Content ──────────────────────────────────
  if (contentType === "video" && generatedVideoUrl) {
    return (
      <div className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-xl border border-border bg-surface" data-testid="generation-video-result">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            src={generatedVideoUrl}
            controls
            className="w-full"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isSaving}
            className={cn(
              "rounded-none bg-brand px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand/90",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {isSaving ? "Saving..." : "Save as Draft"}
          </button>
          <button
            type="button"
            onClick={onRegenerate}
            className="rounded-none border border-border px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text"
          >
            Regenerate
          </button>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}
