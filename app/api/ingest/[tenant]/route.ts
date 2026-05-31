import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { ingestKeyMatches } from "@/src/leads/ingest-key";
import { ingestRows } from "@/src/leads/ingest";
import { parseCsvStream, parseJsonArray } from "@/src/leads/parse";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tenant: string }> },
) {
  const { tenant } = await params;
  const row = (await db.select().from(tenants).where(eq(tenants.id, tenant)).limit(1))[0];
  if (!row) return NextResponse.json({ error: "unknown tenant" }, { status: 404 });
  if (!ingestKeyMatches(req.headers.get("x-ingest-key"), row.ingestKey)) {
    return NextResponse.json({ error: "invalid ingest key" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  const body = await req.text();
  try {
    const summary = contentType.includes("application/json")
      ? await ingestRows(tenant, "webhook", parseJsonArray(body))
      : await ingestRows(tenant, "webhook", parseCsvStream(body));
    return NextResponse.json(summary);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
