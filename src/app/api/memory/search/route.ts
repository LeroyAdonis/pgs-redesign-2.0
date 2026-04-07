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

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "5");
    const category = searchParams.get("category") || undefined;

    if (!query) {
      return NextResponse.json({ error: "q parameter required" }, { status: 400 });
    }

    const embedding = await getEmbedding(query);
    const embStr = `[${embedding.join(",")}]`;
    const sql = getSql();

    const results = category
      ? await sql`SELECT id, content, category, metadata, created_at, 1 - (embedding <=> ${embStr}::vector) as similarity FROM agent_memory WHERE category = ${category} ORDER BY embedding <=> ${embStr}::vector LIMIT ${limit}`
      : await sql`SELECT id, content, category, metadata, created_at, 1 - (embedding <=> ${embStr}::vector) as similarity FROM agent_memory ORDER BY embedding <=> ${embStr}::vector LIMIT ${limit}`;

    return NextResponse.json({
      results: results.map((r: Record<string, unknown>) => ({
        id: r.id,
        content: r.content,
        category: r.category,
        metadata: r.metadata,
        similarity: Number(r.similarity),
        created_at: r.created_at,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Memory search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
