import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getServerSession } from "@/lib/auth-session";

// Lazy getter — avoids module-level neon() call that throws during build if env missing
const getSql = () => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
};

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = getSql();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const category = searchParams.get("category") || undefined;

    const results = category
      ? await sql`SELECT id, content, category, created_at FROM agent_memory WHERE category = ${category} ORDER BY created_at DESC LIMIT ${limit}`
      : await sql`SELECT id, content, category, created_at FROM agent_memory ORDER BY created_at DESC LIMIT ${limit}`;

    return NextResponse.json({
      results: results.map((r: Record<string, unknown>) => ({
        id: r.id,
        content: r.content,
        category: r.category,
        created_at: r.created_at,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch recent memories";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
