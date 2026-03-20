/**
 * OpenRouter API client (server-side)
 *
 * Replaces the Puter.js client-side AI with server-side OpenRouter calls.
 * Uses fetch() for Next.js serverless compatibility.
 * Supports model fallback: hunter-alpha → healer-alpha → minimax free.
 */

// ── Constants ───────────────────────────────────────────────────

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

const FALLBACK_MODELS = [
  "openrouter/hunter-alpha",   // Primary — 1T param, 1M context, free on OpenRouter
  "openrouter/auto",           // OpenRouter's auto-router fallback
  "minimax/minimax-m2.5:free", // Free minimax fallback
  "openai/gpt-4o-mini",        // Fast GPT fallback
] as const;

const DEFAULT_MAX_RETRIES = 1; // per-model retries
const REQUEST_TIMEOUT_MS = 30_000;

// ── Types ───────────────────────────────────────────────────────

export interface GenerateTextOptions {
  /** Override the model (skips fallback chain) */
  model?: string;
  /** Temperature (0–2, default 0.8) */
  temperature?: number;
  /** Max tokens in response */
  maxTokens?: number;
  /** System prompt */
  system?: string;
}

export interface GenerateTextResult {
  content: string;
  model: string;
}

// ── Internal ────────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error(
      "OPENROUTER_API_KEY environment variable is not set. " +
      "Add it to your .env.local or Vercel environment variables.",
    );
  }
  return key;
}

/**
 * Call OpenRouter chat completions for a single model.
 */
async function callModel(
  model: string,
  prompt: string,
  options: GenerateTextOptions,
): Promise<string> {
  const apiKey = getApiKey();

  const messages: Array<{ role: string; content: string }> = [];
  if (options.system) {
    messages.push({ role: "system", content: options.system });
  }
  messages.push({ role: "user", content: prompt });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://purpleglowsocial.com",
        "X-Title": "Purple Glow Social",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.8,
        max_tokens: options.maxTokens ?? 2048,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "Unknown error");
      throw new Error(
        `OpenRouter API error (${response.status}): ${errorBody}`,
      );
    }

    const data = await response.json();

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error(
        `OpenRouter returned empty content for model ${model}`,
      );
    }

    return content;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Check if an error is retryable (transient).
 */
function isRetryable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("rate limit") ||
    msg.includes("429") ||
    msg.includes("500") ||
    msg.includes("502") ||
    msg.includes("503") ||
    msg.includes("timeout") ||
    msg.includes("network") ||
    msg.includes("abort")
  );
}

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Public API ──────────────────────────────────────────────────

/**
 * Generate text using OpenRouter API with model fallback.
 *
 * If a specific model is provided, only that model is tried.
 * Otherwise, falls back through: hunter-alpha → healer-alpha → minimax free.
 *
 * Each model gets up to (maxRetries + 1) attempts with exponential backoff.
 *
 * @param prompt - The user prompt
 * @param options - Generation options
 * @returns Generated content and the model that succeeded
 */
export async function generateText(
  prompt: string,
  options?: GenerateTextOptions,
): Promise<GenerateTextResult> {
  const models = options?.model
    ? [options.model]
    : [...FALLBACK_MODELS];

  const maxRetries = DEFAULT_MAX_RETRIES;
  const errors: string[] = [];

  for (const model of models) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const content = await callModel(model, prompt, options ?? {});
        return { content, model };
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        errors.push(`[${model}] attempt ${attempt + 1}: ${error.message}`);

        // Don't retry non-transient errors for this model
        if (!isRetryable(error)) {
          break;
        }

        // Exponential backoff before retry
        if (attempt < maxRetries) {
          await sleep(1000 * Math.pow(2, attempt));
        }
      }
    }
    // Move to next fallback model
  }

  throw new Error(
    `All models failed. Errors:\n${errors.join("\n")}`,
  );
}

/**
 * Check if OpenRouter is configured (API key present).
 */
export function isOpenRouterConfigured(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}

/**
 * Image generation placeholder.
 *
 * OpenRouter's free text models don't support image generation.
 * This returns a helpful error. For image gen, integrate a dedicated
 * service like Replicate, Stability AI, or DALL-E via OpenAI.
 */
export async function generateImage(
  _prompt: string,
): Promise<{ imageDataUrl: string; model: string }> {
  throw new Error(
    "Image generation is not available via OpenRouter free models. " +
    "Use a dedicated image generation service (Replicate, Stability AI, etc.) " +
    "or upgrade to a model that supports image output.",
  );
}

/**
 * Video generation placeholder.
 *
 * OpenRouter does not support video generation.
 */
export async function generateVideo(
  _prompt: string,
): Promise<{ videoUrl: string; model: string }> {
  throw new Error(
    "Video generation is not available via OpenRouter. " +
    "Use a dedicated video generation service.",
  );
}
