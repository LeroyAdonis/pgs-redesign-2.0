/**
 * TypeScript declarations for the Puter.js global SDK
 *
 * Puter.js is loaded via CDN (`<script src="https://js.puter.com/v2/">`).
 * It exposes a `puter` global on `window` with AI generation methods.
 *
 * @see https://docs.puter.com/
 */

/** Options for puter.ai.chat() text generation */
interface PuterChatOptions {
  /** AI model to use (e.g., "gpt-4o-mini", "claude-sonnet") */
  model?: string;
  /** System prompt / instructions */
  system?: string;
  /** Temperature (0–2, default 1) */
  temperature?: number;
  /** Maximum tokens in response */
  maxTokens?: number;
  /** Whether to stream the response */
  stream?: boolean;
}

/** Response from puter.ai.chat() */
interface PuterChatResponse {
  /** Generated text content */
  message: {
    content: string;
    role: string;
  };
  /** Finish reason */
  finish_reason: string;
  /** Usage statistics */
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/** Options for puter.ai.txt2img() image generation */
interface PuterTxt2ImgOptions {
  /** Test mode — skips actual generation for testing */
  testMode?: boolean;
  /** Model to use for image generation */
  model?: string;
}

/** Options for puter.ai.txt2vid() video generation */
interface PuterTxt2VidOptions {
  /** Test mode — skips actual generation for testing */
  testMode?: boolean;
  /** Model to use for video generation */
  model?: string;
}

/** The puter.ai namespace with generation methods */
interface PuterAI {
  /** Generate text via an LLM */
  chat(
    prompt: string | Array<{ role: string; content: string }>,
    options?: PuterChatOptions,
  ): Promise<PuterChatResponse>;

  /** Generate an image from a text prompt */
  txt2img(
    prompt: string,
    options?: PuterTxt2ImgOptions,
  ): Promise<HTMLImageElement>;

  /** Generate a video from a text prompt */
  txt2vid(
    prompt: string,
    options?: PuterTxt2VidOptions,
  ): Promise<HTMLVideoElement>;
}

/** The global puter SDK object */
interface PuterSDK {
  ai: PuterAI;
}

declare global {
  interface Window {
    puter?: PuterSDK;
  }
}

export type {
  PuterSDK,
  PuterAI,
  PuterChatOptions,
  PuterChatResponse,
  PuterTxt2ImgOptions,
  PuterTxt2VidOptions,
};