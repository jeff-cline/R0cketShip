import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { outreachQueue } from "@/src/db/schema";
import { suppress } from "@/src/outreach/verify";

export const runtime = "nodejs";

function page(message: string): Response {
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribe</title></head>
<body style="font-family:Arial,sans-serif;background:#f5f6f8;margin:0;padding:64px 16px;text-align:center;color:#1a1a1a">
<div style="max-width:440px;margin:0 auto;background:#fff;border-radius:10px;padding:40px">
<div style="font-size:18px;font-weight:bold;margin-bottom:10px">${message}</div>
<div style="font-size:14px;color:#555">You won't receive any more messages at this address.</div>
</div></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}

/** One-click unsubscribe: add the address to the global suppression list. */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const row = (await db.select().from(outreachQueue).where(eq(outreachQueue.clickToken, token)).limit(1))[0];
  if (!row) return page("Link not recognized.");
  await suppress(row.toAddr, "unsubscribe", row.tenantId);
  await db.update(outreachQueue).set({ status: row.status === "queued" ? "suppressed" : row.status }).where(eq(outreachQueue.id, row.id));
  return page("You've been unsubscribed.");
}
