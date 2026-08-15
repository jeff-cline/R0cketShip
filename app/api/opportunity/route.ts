import { NextResponse } from "next/server";
import { recordInvestorLead } from "@/src/bd/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Same-origin investor-opportunity submit: store + attribute + accrue the flat fee,
// then forward to the Core (medigap.plus) for the existing email + CRM pipeline.
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  const firstName = String(b.firstName ?? "").trim();
  const lastName = String(b.lastName ?? "").trim();
  const email = String(b.email ?? "").trim();
  const phone = String(b.phone ?? "").trim();
  const investorType = String(b.investorType ?? "").trim();
  const slug = b.slug ? String(b.slug).trim() : null;
  if (!firstName || !email) return NextResponse.json({ error: "First name and email are required." }, { status: 400 });

  const { referredByName, feeAccrued } = await recordInvestorLead({
    slug,
    firstName,
    lastName,
    email,
    phone,
    investorType,
    meta: { ua: req.headers.get("user-agent") || null },
  });

  // Preserve the proven notification path (emails Jeff via zapmail + Core CRM).
  fetch("https://medigap.plus/api/rocketship/opportunity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ firstName, lastName, email, phone, investorType, referredBy: referredByName || slug || "" }),
  }).catch(() => {});

  return NextResponse.json({ ok: true, feeAccrued });
}
