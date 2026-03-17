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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "5");
    const category = searchParams.get("category") || undefined;

    if (!query) {
      return NextResponse.json({ error: "q parameter required" }, { status: 400 });
    }

    const embedding = await getEmbedding(query);
    const embStr = `[${embedding.join(",")}]`;

    const results = category
      ? await sql`SELECT id, content, category, metadata, created_at, 1 - (embedding <=> ${embStr}::vector) as similarity FROM agent_memory WHERE category = ${category} ORDER BY embedding <=> ${embStr}::vector LIMIT ${limit}`
      : await sql`SELECT id, content, category, metadata, created_at, 1 - (embedding <=> ${embStr}::vector) as similarity FROM agent_memory ORDER BY embedding <=> ${embStr}::vector LIMIT ${limit}`;

    return NextResponse.json({
      results: results.map((r: any) => ({
        id: r.id,
        content: r.content,
        category: r.category,
        metadata: r.metadata,
        similarity: Number(r.similarity),
        created_at: r.created_at,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
