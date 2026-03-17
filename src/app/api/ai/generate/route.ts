/**
 * POST /api/ai/generate
 *
 * Server-side API route for text generation using OpenRouter.
 * Replaces client-side Puter.js calls with a secure server-side proxy.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/ai/openrouter-client";

export const runtime = "nodejs";

interface GenerateRequest {
  prompt: string;
  system?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateRequest;

    if (!body.prompt?.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
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
