/**
 * Memory API Routes
 * 
 * POST /api/memory/store - Store a new memory
 * GET /api/memory/search?q=...&category=...&limit=... - Search memories
 * GET /api/memory/recent?limit=...&category=... - Get recent memories
 * GET /api/memory/stats - Get memory statistics
 */

import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY!;

async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/text-embedding-3-small",
      input: text.substring(0, 8000),
    }),
  });
  const data = await res.json();
  return data.data[0].embedding;
}

export async function POST(request: Request) {
  try {
    const { content, category = "general", metadata = {}, sessionId } = await request.json();

    if (!content) {
      return NextResponse.json({ error: "content required" }, { status: 400 });
    }

    const embedding = await getEmbedding(content);
    const embStr = `[${embedding.join(",")}]`;

    const result = await sql`
      INSERT INTO agent_memory (content, embedding, category, metadata, session_id)
      VALUES (${content}, ${embStr}::vector, ${category}, ${JSON.stringify(metadata)}, ${sessionId || null})
      RETURNING id, created_at
    `;

    return NextResponse.json({ id: result[0].id, created_at: result[0].created_at });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
