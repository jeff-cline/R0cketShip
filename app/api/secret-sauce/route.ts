import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/src/db/client";

export const runtime = "nodejs";

// Stores Secret-Sauce contact-form submissions as leads. Uses raw SQL against a
// standalone `secret_sauce_leads` table (created out-of-band) so it needs no
// schema.ts change or drizzle migration — keeping it clear of the parallel work.
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  const v = (s?: string) => (typeof s === "string" ? s.trim().slice(0, 2000) : "");
  const email = v(b.email);
  const firstName = v(b.firstName);
  if (!email || !firstName) return NextResponse.json({ error: "name and email required" }, { status: 400 });

  try {
    await db.execute(sql`
      INSERT INTO secret_sauce_leads (first_name, last_name, business_name, website, phone, email, comments)
      VALUES (${firstName}, ${v(b.lastName)}, ${v(b.businessName)}, ${v(b.website)}, ${v(b.phone)}, ${email}, ${v(b.comments)})
    `);
  } catch (e) {
    // Don't lose the lead on a DB hiccup — the founder still gets the email copy.
    console.error("[secret-sauce] insert failed:", (e as Error)?.message);
  }
  return NextResponse.json({ ok: true });
}
