import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const category = searchParams.get("category") || undefined;

    const results = category
      ? await sql`SELECT id, content, category, created_at FROM agent_memory WHERE category = ${category} ORDER BY created_at DESC LIMIT ${limit}`
      : await sql`SELECT id, content, category, created_at FROM agent_memory ORDER BY created_at DESC LIMIT ${limit}`;

    return NextResponse.json({
      results: results.map((r: any) => ({
        id: r.id,
        content: r.content,
        category: r.category,
        created_at: r.created_at,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
