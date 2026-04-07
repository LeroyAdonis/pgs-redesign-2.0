/**
 * Memory API Routes
 * 
 * POST /api/memory/store - Store a new memory
 */

import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getServerSession } from "@/lib/auth-session";

/** Lazy connection — avoids crash during Next.js build when env vars are absent */
function getSql() {
  return neon(process.env.DATABASE_URL!);
}

const NIM_BASE_URL = "https://integrate.api.nvidia.com/v1";

async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch(`${NIM_BASE_URL}/embeddings`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.NIM_API_KEY!}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "nvidia/nv-embedqa-e5-v5",
      input: [text.substring(0, 2048)],
      input_type: "query",
      encoding_format: "float",
    }),
  });
  const data = await res.json();
  return data.data[0].embedding;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { content, category = "general", metadata = {}, sessionId } = await request.json();

    if (!content) {
      return NextResponse.json({ error: "content required" }, { status: 400 });
    }

    const embedding = await getEmbedding(content);
    const embStr = `[${embedding.join(",")}]`;
    const sql = getSql();

    const result = await sql`
      INSERT INTO agent_memory (content, embedding, category, metadata, session_id)
      VALUES (${content}, ${embStr}::vector, ${category}, ${JSON.stringify(metadata)}, ${sessionId || null})
      RETURNING id, created_at
    `;

    return NextResponse.json({ id: (result[0] as Record<string, unknown>).id, created_at: (result[0] as Record<string, unknown>).created_at });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to store memory";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
