import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

/** Lazy connection — avoids crash during Next.js build when DATABASE_URL is absent */
function getSql() {
  return neon(process.env.DATABASE_URL!);
}

interface CategoryRow {
  category: string;
  count: string | number;
}

interface CountRow {
  total: string | number;
}

interface DateRow {
  oldest: string | null;
  newest: string | null;
}

export async function GET() {
  try {
    const sql = getSql();
    const countResult = await sql`SELECT COUNT(*) as total FROM agent_memory`;
    const categoryResult = await sql`SELECT category, COUNT(*) as count FROM agent_memory GROUP BY category`;
    const dateResult = await sql`SELECT MIN(created_at) as oldest, MAX(created_at) as newest FROM agent_memory`;
    const patternCount = await sql`SELECT COUNT(*) as total FROM agent_patterns`;
    const checkpointCount = await sql`SELECT COUNT(*) as total FROM agent_checkpoints`;

    return NextResponse.json({
      total: Number((countResult[0] as CountRow | undefined)?.total || 0),
      byCategory: Object.fromEntries(
        (categoryResult as CategoryRow[]).map((r) => [r.category, Number(r.count)])
      ),
      oldestDate: (dateResult[0] as DateRow | undefined)?.oldest || null,
      newestDate: (dateResult[0] as DateRow | undefined)?.newest || null,
      patterns: Number((patternCount[0] as CountRow | undefined)?.total || 0),
      checkpoints: Number((checkpointCount[0] as CountRow | undefined)?.total || 0),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch memory stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
