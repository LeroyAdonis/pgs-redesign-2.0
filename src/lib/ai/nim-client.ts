/**
 * NVIDIA NIM API client (server-side)
 *
 * Unified AI provider using NVIDIA NIM for all AI tasks:
 * - Text generation via chat completions (OpenAI-compatible)
 * - Image generation via Stability AI SDXL Turbo on NIM
 *
 * Single API key (NIM_API_KEY) replaces OpenRouter, OpenAI, and Gemini.
 */

// ── Constants ───────────────────────────────────────────────────

const NIM_BASE_URL = "https://integrate.api.nvidia.com/v1";
const NIM_IMAGE_URL =
  "https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-xl";

const FALLBACK_MODELS = [
  "meta/llama-3.3-70b-instruct",             // Best quality
  "nvidia/llama-3.1-nemotron-70b-instruct",   // NVIDIA-tuned
  "meta/llama-3.1-8b-instruct",               // Fast / cheap fallback
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

function getNimApiKey(): string {
  const key = process.env.NIM_API_KEY;
  if (!key) {
    throw new Error(
      "NIM_API_KEY environment variable is not set. " +
        "Add it to your .env.local or Vercel environment variables.",
    );
  }
  return key;
}

/**
 * Call NIM chat completions for a single model.
 * NIM is OpenAI-compatible, so we use the standard chat format.
 */
async function callModel(
  model: string,
  prompt: string,
  options: GenerateTextOptions,
): Promise<string> {
  const apiKey = getNimApiKey();

  const messages: Array<{ role: string; content: string }> = [];
  if (options.system) {
    messages.push({ role: "system", content: options.system });
  }
  messages.push({ role: "user", content: prompt });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${NIM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
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
        `NIM API error (${response.status}): ${errorBody}`,
      );
    }

    const data = await response.json();

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error(`NIM returned empty content for model ${model}`);
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
 * Generate text using NVIDIA NIM API with model fallback.
 *
 * If a specific model is provided, only that model is tried.
 * Otherwise, falls back through the model chain.
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
  const models = options?.model ? [options.model] : [...FALLBACK_MODELS];

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

  throw new Error(`All models failed. Errors:\n${errors.join("\n")}`);
}

/**
 * Check if NIM is configured (API key present).
 */
export function isNimConfigured(): boolean {
  return !!process.env.NIM_API_KEY;
}

/**
 * Generate an image using Stability AI SDXL on NVIDIA NIM.
 *
 * Returns a base64-encoded data URL of the generated image.
 *
 * @param prompt - Text description of the image to generate
 * @returns Object with base64 data URL and model identifier
 */
export async function generateImage(
  prompt: string,
): Promise<{ imageDataUrl: string; model: string }> {
  const apiKey = getNimApiKey();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch(NIM_IMAGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        text_prompts: [
          {
            text: prompt,
            weight: 1,
          },
        ],
        cfg_scale: 5,
        height: 1024,
        width: 1024,
        steps: 25,
        sampler: "K_DPM_2_ANCESTRAL",
        seed: 0,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "Unknown error");
      throw new Error(
        `NIM Image API error (${response.status}): ${errorBody}`,
      );
    }

    const data = await response.json();

    const b64Image = data.artifacts?.[0]?.base64;
    if (!b64Image) {
      throw new Error("NIM image generation returned no image data");
    }

    const imageDataUrl = `data:image/png;base64,${b64Image}`;

    return {
      imageDataUrl,
      model: "stabilityai/stable-diffusion-xl",
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Video generation is not yet available via API.
 *
 * Services like Runway ML, Pika, and Kling offer video generation
 * but do not yet provide stable public APIs suitable for production
 * integration. This will be updated when a reliable video generation
 * API becomes available.
 *
 * @param _prompt - Text description (unused)
 * @throws Always throws with an informative error message
 */
export async function generateVideo(
  _prompt: string,
): Promise<{ videoUrl: string; model: string }> {
  throw new Error(
    "Video generation is not yet available. " +
      "AI video generation requires a dedicated service such as Runway ML, Pika, or Kling, " +
      "which do not yet offer stable public APIs for production use. " +
      "This feature will be enabled once a reliable video generation API is integrated.",
  );
}
