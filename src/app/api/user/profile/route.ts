import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  });
}

export async function PATCH(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { name } = body;
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
  await db.update(user).set({ name: name.trim() }).where(eq(user.id, session.user.id));
  return NextResponse.json({ success: true });
}
