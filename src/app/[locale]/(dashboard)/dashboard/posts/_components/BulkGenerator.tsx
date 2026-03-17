"use client";

/**
 * BulkGenerator — Multi-step wizard for generating posts in bulk.
 *
 * Step 1: Configuration (count, platforms, language, topic, SA context)
 * Step 2: Preview (shows mock content as placeholder — real AI via Puter.js in Phase 4)
 * Step 3: Schedule (start time + interval, then schedule all)
 *
 * Rendered as a fullscreen modal.
 */

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { SA_LANGUAGES } from "@/lib/brand/sa-context";
import { ALL_PLATFORM_IDS, PLATFORM_CONFIG } from "./platform-config";
import type { PlatformId } from "./types";

/* ─── Props ─── */

interface BulkGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (config: BulkGenerationResult) => void;
}

/* ─── Internal types ─── */

interface BulkConfig {
  count: number;
  platforms: string[];
  language: string;
  topic: string;
  includeSAContext: boolean;
}

interface GeneratedPost {
  id: string;
  content: string;
  platform: string;
  included: boolean;
}

interface BulkGenerationResult {
  posts: GeneratedPost[];
  startDate: string;
  interval: string;
}

type WizardStep = 1 | 2 | 3;

const INTERVALS = [
  { value: "1h", label: "Every 1 hour" },
  { value: "2h", label: "Every 2 hours" },
  { value: "4h", label: "Every 4 hours" },
  { value: "6h", label: "Every 6 hours" },
  { value: "12h", label: "Every 12 hours" },
  { value: "24h", label: "Every 24 hours" },
] as const;

/* ─── Mock content generator ─── */

function generateMockPosts(config: BulkConfig): GeneratedPost[] {
  const mockContents = [
    `🇿🇦 Exciting things are happening with ${config.topic}! Stay tuned for more updates. #Mzansi #LocalIsLekker`,
    `Check out how ${config.topic} is making waves in SA! 🌟 #ProudlySA #SouthAfrica`,
    `Eish, ${config.topic} is truly lekker! Don't miss out on this opportunity 🔥 #MadeInSA`,
    `Big news for our Mzansi community about ${config.topic}! 🎉 #Ubuntu #SABusiness`,
    `From Joburg to Cape Town, ${config.topic} is changing the game! 💪 #CityOfGold #MotherCity`,
  ];

  return Array.from({ length: config.count }, (_, i) => ({
    id: `mock-${i + 1}`,
    content: mockContents[i % mockContents.length]!,
    platform: config.platforms[i % config.platforms.length] ?? "instagram",
    included: true,
  }));
}

/* ─── Component ─── */

export function BulkGenerator({
  isOpen,
  onClose,
  onComplete,
}: BulkGeneratorProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [isGenerating, setIsGenerating] = useState(false);

  // Step 1: Config
  const [config, setConfig] = useState<BulkConfig>({
    count: 5,
    platforms: ["instagram"],
    language: "en",
    topic: "",
    includeSAContext: true,
  });

  // Step 2: Generated posts
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);

  // Step 3: Schedule
  const [startDate, setStartDate] = useState("");
  const [interval, setInterval] = useState("4h");

  const resetWizard = useCallback(() => {
    setStep(1);
    setConfig({
      count: 5,
      platforms: ["instagram"],
      language: "en",
      topic: "",
      includeSAContext: true,
    });
    setGeneratedPosts([]);
    setStartDate("");
    setInterval("4h");
    setIsGenerating(false);
  }, []);

  function handleClose() {
    resetWizard();
    onClose();
  }

  function togglePlatform(id: string) {
    setConfig((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(id)
        ? prev.platforms.filter((p) => p !== id)
        : [...prev.platforms, id],
    }));
  }

  function togglePostInclusion(postId: string) {
    setGeneratedPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, included: !p.included } : p,
      ),
    );
  }

  async function handleGenerate() {
    setIsGenerating(true);
    // Simulate generation delay — real AI generation happens via Puter.js in Phase 4
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const posts = generateMockPosts(config);
    setGeneratedPosts(posts);
    setIsGenerating(false);
    setStep(2);
  }

  function handleScheduleAll() {
    const includedPosts = generatedPosts.filter((p) => p.included);
    onComplete({
      posts: includedPosts,
      startDate,
      interval,
    });
    handleClose();
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Bulk content generator"
      data-testid="bulk-generator"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto",
          "rounded-xl border border-border bg-surface-raised p-6",
          "shadow-xl",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">
            Generate Batch Content
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="rounded-none p-1 text-text-muted hover:text-text transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step indicator */}
        <div className="mt-4 flex items-center gap-2">
          {([1, 2, 3] as const).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                  step === s
                    ? "bg-brand text-white"
                    : step > s
                      ? "bg-success-surface text-success"
                      : "bg-surface-inset text-text-muted",
                )}
                data-testid={`step-indicator-${s}`}
              >
                {step > s ? "✓" : s}
              </div>
              {s < 3 && (
                <div
                  className={cn(
                    "h-0.5 w-8",
                    step > s ? "bg-success" : "bg-surface-inset",
                  )}
                />
              )}
            </div>
          ))}
          <span className="ml-2 text-sm text-text-muted">
            {step === 1 && "Configure"}
            {step === 2 && "Preview"}
            {step === 3 && "Schedule"}
          </span>
        </div>

        {/* Step 1: Configuration */}
        {step === 1 && (
          <div className="mt-6 flex flex-col gap-5" data-testid="step-1">
            {/* Number of posts */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="post-count"
                className="text-xs font-medium text-text-muted"
              >
                Number of posts: {config.count}
              </label>
              <input
                id="post-count"
                type="range"
                min={1}
                max={30}
                value={config.count}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    count: Number(e.target.value),
                  }))
                }
                className="accent-brand"
              />
              <div className="flex justify-between text-xs text-text-muted">
                <span>1</span>
                <span>30</span>
              </div>
            </div>

            {/* Target platforms */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-muted">
                Target Platforms
              </span>
              <div className="flex flex-wrap gap-2">
                {ALL_PLATFORM_IDS.map((id) => {
                  const plat = PLATFORM_CONFIG[id as PlatformId];
                  const isSelected = config.platforms.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => togglePlatform(id)}
                      aria-pressed={isSelected}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
                        "border transition-colors",
                        isSelected
                          ? "border-brand bg-brand-surface text-brand"
                          : "border-border bg-surface text-text-muted hover:border-brand/50",
                      )}
                    >
                      {plat.icon}
                      {plat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Language */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="bulk-language"
                className="text-xs font-medium text-text-muted"
              >
                Content Language
              </label>
              <select
                id="bulk-language"
                value={config.language}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, language: e.target.value }))
                }
                className={cn(
                  "rounded-none border border-border bg-surface px-3 py-2",
                  "text-sm text-text",
                  "focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand",
                )}
              >
                {Object.entries(SA_LANGUAGES).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name} ({code})
                  </option>
                ))}
              </select>
            </div>

            {/* Topic */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="bulk-topic"
                className="text-xs font-medium text-text-muted"
              >
                Topic / Theme
              </label>
              <input
                id="bulk-topic"
                type="text"
                value={config.topic}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, topic: e.target.value }))
                }
                placeholder="e.g. Heritage Day celebration, new product launch..."
                className={cn(
                  "rounded-none border border-border bg-surface px-3 py-2",
                  "text-sm text-text placeholder:text-text-muted",
                  "focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand",
                )}
              />
            </div>

            {/* SA context toggle */}
            <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeSAContext}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    includeSAContext: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
              />
              Include SA cultural references
            </label>

            {/* Next */}
            <Button
              variant="primary"
              onClick={handleGenerate}
              isLoading={isGenerating}
              disabled={
                !config.topic.trim() || config.platforms.length === 0
              }
            >
              Generate {config.count} Posts
            </Button>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 2 && (
          <div className="mt-6 flex flex-col gap-4" data-testid="step-2">
            <p className="text-sm text-text-muted">
              Review generated posts. Uncheck any you don&apos;t want to include.
            </p>

            <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto">
              {generatedPosts.map((post) => {
                const plat = PLATFORM_CONFIG[post.platform as PlatformId];
                return (
                  <div
                    key={post.id}
                    className={cn(
                      "flex gap-3 rounded-none border p-3",
                      post.included
                        ? "border-border bg-surface"
                        : "border-border/50 bg-surface-inset opacity-60",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={post.included}
                      onChange={() => togglePostInclusion(post.id)}
                      aria-label={`Include post ${post.id}`}
                      className="mt-0.5 h-4 w-4 rounded border-border text-brand"
                    />
                    <div className="flex flex-1 flex-col gap-1">
                      <span
                        className="text-xs font-medium"
                        style={{ color: plat?.color }}
                      >
                        {plat?.label ?? post.platform}
                      </span>
                      <p className="text-sm text-text">{post.content}</p>
                    </div>
                    <button
                      type="button"
                      aria-label="Edit post"
                      disabled
                      className="shrink-0 rounded-none p-1.5 text-text-muted opacity-50 cursor-not-allowed"
                      title="Edit (coming soon)"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                variant="primary"
                onClick={() => setStep(3)}
                disabled={!generatedPosts.some((p) => p.included)}
              >
                Next: Schedule
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Schedule */}
        {step === 3 && (
          <div className="mt-6 flex flex-col gap-5" data-testid="step-3">
            <p className="text-sm text-text-muted">
              Set the start time and posting interval for your{" "}
              {generatedPosts.filter((p) => p.included).length} posts.
            </p>

            {/* Start date/time */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="bulk-start-date"
                className="text-xs font-medium text-text-muted"
              >
                Start Date & Time
              </label>
              <input
                id="bulk-start-date"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={cn(
                  "rounded-none border border-border bg-surface px-3 py-2",
                  "text-sm text-text",
                  "focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand",
                )}
              />
            </div>

            {/* Interval */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="bulk-interval"
                className="text-xs font-medium text-text-muted"
              >
                Interval Between Posts
              </label>
              <select
                id="bulk-interval"
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className={cn(
                  "rounded-none border border-border bg-surface px-3 py-2",
                  "text-sm text-text",
                  "focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand",
                )}
              >
                {INTERVALS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleScheduleAll}
                disabled={!startDate}
              >
                Schedule All
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
