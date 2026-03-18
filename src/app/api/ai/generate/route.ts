/**
 * POST /api/ai/generate
 *
 * Server-side API route for text generation using OpenRouter.
 * Replaces client-side Puter.js calls with a secure server-side proxy.
 *
 * Auth: requires a valid session (same as all dashboard API routes).
 * Rate limit: 20 requests per minute per user.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { generateText } from "@/lib/ai/openrouter-client";
import { createRateLimiter } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

// Rate limiting — 20 AI generation requests / minute per user
const rateLimiter = createRateLimiter({ maxRequests: 20, windowMs: 60_000 });

interface GenerateRequest {
  prompt: string;
  system?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Auth check — must be logged in
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as GenerateRequest;

    if (!body.prompt?.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      );
    }

    // Rate limit check
    if (!rateLimiter.check(session.user.id).allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a minute before trying again." },
        { status: 429 },
      );
    }

    // Prompt length validation
    if (body.prompt.length > 5000) {
      return NextResponse.json(
        { error: "Prompt is too long. Maximum 5000 characters." },
        { status: 400 },
      );
    }

    const result = await generateText(body.prompt, {
      system: body.system,
      model: body.model,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
    });

    return NextResponse.json({
      content: result.content,
      model: result.model,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    console.error("[/api/ai/generate] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
