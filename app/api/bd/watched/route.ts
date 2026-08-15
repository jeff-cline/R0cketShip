import { NextResponse } from "next/server";
import { getAuthContext } from "@/src/auth/context";
import { markVideoWatched } from "@/src/bd/partners";

export const runtime = "nodejs";

export async function POST() {
  const ctx = await getAuthContext();
  if (!ctx || ctx.user.role !== "bd_partner") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await markVideoWatched(ctx.user.id);
  return NextResponse.json({ ok: true });
}
