import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const countResult = await sql`SELECT COUNT(*) as total FROM agent_memory`;
    const categoryResult = await sql`SELECT category, COUNT(*) as count FROM agent_memory GROUP BY category`;
    const dateResult = await sql`SELECT MIN(created_at) as oldest, MAX(created_at) as newest FROM agent_memory`;
    const patternCount = await sql`SELECT COUNT(*) as total FROM agent_patterns`;
    const checkpointCount = await sql`SELECT COUNT(*) as total FROM agent_checkpoints`;

    return NextResponse.json({
      total: Number(countResult[0]?.total || 0),
      byCategory: Object.fromEntries(
        categoryResult.map((r: any) => [r.category, Number(r.count)])
      ),
      oldestDate: dateResult[0]?.oldest || null,
      newestDate: dateResult[0]?.newest || null,
      patterns: Number(patternCount[0]?.total || 0),
      checkpoints: Number(checkpointCount[0]?.total || 0),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
