import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const getSql = () => { const url = process.env.DATABASE_URL; if (!url) throw new Error("DATABASE_URL is not set"); return neon(url); };

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
    const countResult = await getSql()`SELECT COUNT(*) as total FROM agent_memory`;
    const categoryResult = await getSql()`SELECT category, COUNT(*) as count FROM agent_memory GROUP BY category`;
    const dateResult = await getSql()`SELECT MIN(created_at) as oldest, MAX(created_at) as newest FROM agent_memory`;
    const patternCount = await getSql()`SELECT COUNT(*) as total FROM agent_patterns`;
    const checkpointCount = await getSql()`SELECT COUNT(*) as total FROM agent_checkpoints`;

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
