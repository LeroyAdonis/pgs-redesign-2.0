/**
 * Puter.js type declarations
 *
 * Declares the global `puter` object injected by the Puter.js CDN script.
 * @see https://docs.puter.com/
 */

interface PuterAIChatMessage {
  content: string;
}

interface PuterAIChatResponse {
  message: PuterAIChatMessage;
}

interface PuterAIChatOptions {
  model?: string;
  stream?: boolean;
}

interface PuterAI {
  chat(
    prompt: string,
    options?: PuterAIChatOptions,
  ): Promise<PuterAIChatResponse>;
  txt2img(
    prompt: string,
    options?: { model?: string; width?: number; height?: number },
  ): Promise<HTMLImageElement>;
  txt2vid(
    prompt: string,
    options?: { model?: string; duration?: number },
  ): Promise<HTMLVideoElement>;
}

interface Puter {
  ai: PuterAI;
}

interface Window {
  puter: Puter;
}
