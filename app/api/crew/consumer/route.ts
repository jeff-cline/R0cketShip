import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/src/db/client";
import { businessLeads, crewUsers, crewReferrals } from "@/src/db/schema";

export const runtime = "nodejs";
const POINTS_PER_SIGNUP = 1500; // crew member earns this when a consumer signs up via their link

export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as { name?: string; email?: string; port?: string; ref?: string } | null;
  const email = String(b?.email ?? "").trim().toLowerCase();
  if (!email.includes("@")) return NextResponse.json({ error: "valid email required" }, { status: 400 });
  const port = String(b?.port ?? "").slice(0, 120) || null;
  const ref = String(b?.ref ?? "").trim();

  await db.insert(businessLeads).values({
    source: "consumer",
    name: String(b?.name ?? "").slice(0, 80) || null,
    email,
    message: port ? `Port: ${port}` : null,
    meta: { port, site: "cruise.plus", ref: ref || null },
  });

  let awarded = 0;
  if (ref) {
    const u = (await db.select({ id: crewUsers.id }).from(crewUsers).where(eq(crewUsers.passCode, ref)).limit(1))[0];
    if (u) {
      awarded = POINTS_PER_SIGNUP;
      await db.update(crewUsers).set({ points: sql`${crewUsers.points} + ${awarded}` }).where(eq(crewUsers.id, u.id));
      await db.insert(crewReferrals).values({ crewUserId: u.id, consumerEmail: email, port, pointsAwarded: awarded });
    }
  }
  return NextResponse.json({ ok: true, awarded });
}
