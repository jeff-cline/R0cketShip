import { NextResponse } from "next/server";
import { getAuthContext, canAccess } from "@/src/auth/context";
import { ingestRows } from "@/src/leads/ingest";
import { parseCsvStream } from "@/src/leads/parse";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!canAccess(ctx.user.role, ["god", "manager"])) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const tenantId = ctx.user.role === "god" ? url.searchParams.get("tenantId") : ctx.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  if (ctx.user.role === "manager" && tenantId !== ctx.user.tenantId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "file required" }, { status: 400 });

  const text = await file.text();
  const summary = await ingestRows(tenantId, "upload", parseCsvStream(text));
  return NextResponse.json(summary);
}
