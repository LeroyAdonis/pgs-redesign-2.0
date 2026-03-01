"use client";

/**
 * ContentStudio — Main AI content generation interface
 *
 * Two-panel layout: controls (left) and preview (right).
 * Wraps itself in PuterProvider for Puter.js AI access.
 * Manages all generation state internally.
 */

import { useState, useCallback } from "react";
import { PuterProvider, usePuter } from "@/components/providers/PuterProvider";
import { PlatformSelector } from "./PlatformSelector";
import { LanguageSelector } from "./LanguageSelector";
import { ContentTypeSelector } from "./ContentTypeSelector";
import { GenerationPreview } from "./GenerationPreview";
import { FeedbackButtons } from "./FeedbackButtons";
import type { ContentType, GenerationState } from "@/lib/ai/types";

// ── Inner Component (needs PuterProvider context) ───────────────

function ContentStudioInner() {
  const { isLoaded, error: puterError } = usePuter();

  // ── State ─────────────────────────────────────────────────
  const [generationState, setGenerationState] = useState<GenerationState>("idle");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram"]);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [contentType, setContentType] = useState<ContentType>("text");
  const [prompt, setPrompt] = useState("");
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [includeSAContext, setIncludeSAContext] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastAiModel, setLastAiModel] = useState("puter-ai");

  // ── Build prompt with SA context ──────────────────────────
  function buildPrompt(): string {
    const platformNames = selectedPlatforms.join(", ");
    let fullPrompt = prompt;

    if (includeSAContext) {
      fullPrompt += `\n\nContext: This post is for a South African audience. `;
      fullPrompt += `Use local slang where appropriate (e.g., "lekker", "braai", "howzit"). `;
      fullPrompt += `Include relevant SA hashtags like #Mzansi, #LocalIsLekker. `;
    }

    if (contentType === "text") {
      fullPrompt += `\n\nPlatform: ${platformNames}. Language: ${selectedLanguage}. `;
      fullPrompt += `Generate an engaging social media post with relevant hashtags. `;
      fullPrompt += `Return ONLY the post content with hashtags — no explanations.`;
    }

    return fullPrompt;
  }

  // ── Generate Content ──────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    setGenerationState("generating");
    setErrorMessage(null);
    setGeneratedContent(null);
    setGeneratedImageUrl(null);
    setGeneratedVideoUrl(null);

    try {
      if (!isLoaded || !window.puter) {
        throw new Error("Puter.js is not loaded. Please wait a moment and try again.");
      }

      const fullPrompt = buildPrompt();

      if (contentType === "text") {
        const response = await window.puter.ai.chat(fullPrompt);
        const content = response.message.content;
        setGeneratedContent(content);
        setLastAiModel("puter-ai");
        setGenerationState("success");
      } else if (contentType === "image") {
        const img = await window.puter.ai.txt2img(fullPrompt);
        // Convert image element to data URL
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL("image/png");
          setGeneratedImageUrl(dataUrl);
        }
        setLastAiModel("puter-ai-img");
        setGenerationState("success");
      } else if (contentType === "video") {
        const video = await window.puter.ai.txt2vid(fullPrompt);
        setGeneratedVideoUrl(video.src);
        setLastAiModel("puter-ai-vid");
        setGenerationState("success");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed";
      setErrorMessage(message);
      setGenerationState("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt, contentType, isLoaded, selectedPlatforms, selectedLanguage, includeSAContext]);

  // ── Save as Draft ─────────────────────────────────────────
  const handleSaveDraft = useCallback(async () => {
    if (!generatedContent && !generatedImageUrl) return;

    setIsSaving(true);
    try {
      const platform = selectedPlatforms[0] ?? "instagram";
      const body: Record<string, unknown> = {
        content: generatedContent ?? prompt,
        platform,
        language: selectedLanguage,
        aiPrompt: prompt,
        aiModel: lastAiModel,
      };

      if (generatedImageUrl) {
        body.media = [{ type: "image", dataUrl: generatedImageUrl }];
      }

      await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      // Draft save failure is non-critical
    } finally {
      setIsSaving(false);
    }
  }, [generatedContent, generatedImageUrl, selectedPlatforms, selectedLanguage, prompt, lastAiModel]);

  // ── Copy to Clipboard ─────────────────────────────────────
  const handleCopy = useCallback(async () => {
    if (generatedContent) {
      await navigator.clipboard.writeText(generatedContent);
    }
  }, [generatedContent]);

  // ── Content Edit ──────────────────────────────────────────
  const handleContentEdit = useCallback((content: string) => {
    setGeneratedContent(content);
  }, []);

  // ── Char count ────────────────────────────────────────────
  const maxPromptLength = 1000;
  const charCount = prompt.length;

  return (
    <div className="mx-auto max-w-6xl">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Content Studio</h1>
        <p className="mt-1 text-sm text-text-muted">
          Generate AI-powered social media content for your South African audience
        </p>
      </div>

      {/* Puter.js status messages */}
      {puterError && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400" role="alert">
          {puterError}. You can still use the interface — content generation requires an internet connection.
        </div>
      )}

      {/* Two-panel layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Left Panel: Controls ─── */}
        <div className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-5">
          {/* Platform selector */}
          <div>
            <label className="mb-2 block text-xs font-medium text-text-muted">
              Platforms
            </label>
            <PlatformSelector
              selected={selectedPlatforms}
              onChange={setSelectedPlatforms}
            />
          </div>

          {/* Language + Content Type row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <LanguageSelector
              value={selectedLanguage}
              onChange={setSelectedLanguage}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-muted">
                Content Type
              </label>
              <ContentTypeSelector
                value={contentType}
                onChange={setContentType}
              />
            </div>
          </div>

          {/* Prompt textarea */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="prompt-input"
                className="text-xs font-medium text-text-muted"
              >
                Prompt
              </label>
              <span className="text-xs text-text-muted/70">
                {charCount}/{maxPromptLength}
              </span>
            </div>
            <textarea
              id="prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, maxPromptLength))}
              placeholder="Describe the content you want to generate..."
              rows={4}
              className={[
                "w-full resize-none rounded-lg border border-border bg-surface-raised p-3",
                "text-sm text-text placeholder:text-text-muted/50",
                "focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand",
                "transition-colors",
              ].join(" ")}
            />
          </div>

          {/* SA Context toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeSAContext}
              onChange={(e) => setIncludeSAContext(e.target.checked)}
              className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
            />
            <span className="text-sm text-text">
              Include South African context
            </span>
            <span className="text-xs text-text-muted">(slang, hashtags, cultural references)</span>
          </label>

          {/* Generate button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!prompt.trim() || generationState === "generating"}
            data-testid="generate-button"
            className={[
              "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5",
              "bg-brand text-sm font-medium text-white",
              "transition-colors hover:bg-brand/90",
              "disabled:cursor-not-allowed disabled:opacity-50",
            ].join(" ")}
          >
            {generationState === "generating" ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="15" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 2l.5 2a3 3 0 0 0 2 2L13 6.5l-2.5.5a3 3 0 0 0-2 2L8 11.5l-.5-2.5a3 3 0 0 0-2-2L3 6.5l2.5-.5a3 3 0 0 0 2-2L8 2Z" />
                </svg>
                Generate Content
              </>
            )}
          </button>

          {/* Not loaded hint */}
          {!isLoaded && !puterError && (
            <p className="text-xs text-text-muted/70">
              Loading AI engine...
            </p>
          )}
        </div>

        {/* ── Right Panel: Preview ─── */}
        <div className="flex flex-col gap-4">
          <GenerationPreview
            contentType={contentType}
            generationState={generationState}
            generatedContent={generatedContent}
            generatedImageUrl={generatedImageUrl}
            generatedVideoUrl={generatedVideoUrl}
            errorMessage={errorMessage}
            onContentEdit={handleContentEdit}
            onSaveDraft={handleSaveDraft}
            onRegenerate={handleGenerate}
            onCopy={handleCopy}
            isSaving={isSaving}
          />

          {/* Feedback buttons — only show after successful text generation */}
          {generationState === "success" && generatedContent && (
            <FeedbackButtons
              originalContent={generatedContent}
              aiModel={lastAiModel}
              aiPrompt={prompt}
              platform={selectedPlatforms[0] ?? "instagram"}
              contentType={contentType}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Outer Wrapper: provides PuterProvider ───────────────────────

export function ContentStudio() {
  return (
    <PuterProvider>
      <ContentStudioInner />
    </PuterProvider>
  );
}
