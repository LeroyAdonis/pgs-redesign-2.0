/**
 * POST /api/chat — Chatbot AI endpoint
 *
 * Accepts a conversation (messages array) and returns an AI response
 * via NVIDIA NIM API (OpenAI-compatible). Used by the floating ChatbotWidget.
 *
 * This route is intentionally public (no auth required) so that
 * unauthenticated visitors can interact with the chatbot on the
 * landing page. Rate limiting is IP-based to prevent abuse.
 */

import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { createRateLimiter } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/security/sanitize";

// ── Rate limiting — 20 chatbot messages / minute per IP ─────────

const rateLimiter = createRateLimiter({ maxRequests: 20, windowMs: 60_000 });

// ── NIM API config ──────────────────────────────────────────────

const NIM_API_KEY = process.env.NIM_API_KEY;
const NIM_BASE_URL = "https://integrate.api.nvidia.com/v1";
const NIM_CHAT_MODEL = "meta/llama-3.1-8b-instruct"; // fast model for chatbot

const SYSTEM_PROMPT = [
  "You are the Purple Glow Social assistant, a friendly South African chatbot.",
  "You help users with: linking social accounts, AI content generation,",
  "scheduling posts, billing (tiers: Seedling free, Hustler R299/mo,",
  "Grower R799/mo, Mogul R1999/mo), credits, and analytics.",
  "Use occasional SA expressions like 'Howzit!', 'Lekker!',",
  "'No worries, we've got you sorted'.",
  "Keep responses concise (under 150 words).",
  "If you can't help, suggest the user talk to a human.",
].join(" ");

// ── Types ───────────────────────────────────────────────────────

interface ChatRequestMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatRequestMessage[];
}

interface ChatSuccessResponse {
  reply: string;
}

interface ChatErrorResponse {
  error: string;
}

type ChatResponse = ChatSuccessResponse | ChatErrorResponse;

// ── Helpers ─────────────────────────────────────────────────────

/** Extract client IP for rate limiting */
function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  // Fallback for local development
  return "127.0.0.1";
}

/** Validate the incoming request body */
function validateRequest(
  body: unknown,
): { valid: true; data: ChatRequest } | { valid: false; error: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body is required" };
  }

  const { messages } = body as Record<string, unknown>;

  if (!Array.isArray(messages) || messages.length === 0) {
    return { valid: false, error: "messages array is required and must not be empty" };
  }

  // Cap conversation length to prevent abuse (last 20 messages)
  const MAX_MESSAGES = 20;
  const trimmed = messages.slice(-MAX_MESSAGES) as unknown[];

  // Validate each message
  for (const msg of trimmed) {
    if (
      typeof msg !== "object" ||
      msg === null ||
      !("role" in msg) ||
      !("content" in msg)
    ) {
      return { valid: false, error: "Each message must have role and content" };
    }

    const { role, content } = msg as { role: unknown; content: unknown };

    if (role !== "user" && role !== "assistant") {
      return { valid: false, error: "Message role must be 'user' or 'assistant'" };
    }

    if (typeof content !== "string" || content.trim().length === 0) {
      return { valid: false, error: "Message content must be a non-empty string" };
    }

    if (content.length > 2000) {
      return { valid: false, error: "Message content must be under 2000 characters" };
    }
  }

  return {
    valid: true,
    data: {
      messages: trimmed.map((m) => {
        const msg = m as { role: string; content: string };
        return {
          role: msg.role as "user" | "assistant",
          content: sanitizeText(msg.content),
        };
      }),
    },
  };
}

// ── Route handler ───────────────────────────────────────────────

export async function POST(
  request: Request,
): Promise<NextResponse<ChatResponse>> {
  try {
    // Check API key availability
    if (!NIM_API_KEY) {
      logger.error("NIM_API_KEY not configured");
      return NextResponse.json(
        { error: "Chat service is not configured. Please try again later." },
        { status: 503 },
      );
    }

    // Rate limit by IP
    const clientIp = getClientIp(request);
    const rateCheck = rateLimiter.check(clientIp);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many messages. Please wait a moment before sending again." },
        { status: 429 },
      );
    }

    // Parse and validate request
    const body: unknown = await request.json().catch(() => null);
    const validation = validateRequest(body);

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 },
      );
    }

    const { messages } = validation.data;

    // Build OpenAI-compatible messages array with system prompt
    const nimMessages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    // Call NIM API (OpenAI-compatible chat completions)
    const nimResponse = await fetch(`${NIM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NIM_API_KEY}`,
      },
      body: JSON.stringify({
        model: NIM_CHAT_MODEL,
        messages: nimMessages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!nimResponse.ok) {
      const errorBody = await nimResponse.text().catch(() => "Unknown error");
      logger.error("NIM API error", {
        status: nimResponse.status,
        body: errorBody.slice(0, 500),
      });

      if (nimResponse.status === 429) {
        return NextResponse.json(
          { error: "The AI assistant is busy right now. Please try again in a moment." },
          { status: 429 },
        );
      }

      return NextResponse.json(
        { error: "Sorry, I'm having trouble thinking right now. Please try again." },
        { status: 502 },
      );
    }

    const nimData = await nimResponse.json();

    // Extract the reply text (OpenAI format)
    const replyText = nimData.choices?.[0]?.message?.content;

    if (!replyText) {
      logger.warn("NIM returned empty response", {
        choices: JSON.stringify(nimData.choices ?? []).slice(0, 200),
      });
      return NextResponse.json(
        { error: "I didn't get a response. Could you try rephrasing your question?" },
        { status: 502 },
      );
    }

    return NextResponse.json({ reply: replyText });
  } catch (error) {
    logger.error("Chat API error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
