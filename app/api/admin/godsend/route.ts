import { NextResponse } from "next/server";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { getAuthContext } from "@/src/auth/context";
import { db } from "@/src/db/client";
import { leads, outreachOffers, outreachQueue } from "@/src/db/schema";
import { enqueueLeads } from "@/src/outreach/enqueue";

export const runtime = "nodejs";

/**
 * God-only "Send emails" pressure-test endpoint.
 *
 * - Restricted to a single email (Jeff) so this can never be invoked by any
 *   other god/operator account.
 * - Pulls candidate leadIds for the requested tenant, narrows by mode
 *   (all / last N / random N), calls the standard `enqueueLeads` so all the
 *   normal deliverability gates apply (suppression, MX, dedup, drip pacing).
 * - Optional `immediate=true` collapses the drip schedule so the next cron
 *   tick attempts every send right away — useful for pressure-testing only.
 *
 * Request body: JSON { tenantId, mode, n?, immediate? }
 */

const ALLOWED_GOD_EMAIL = "jeff.cline@me.com";
const HARD_CAP = 50_000; // safety net — no single godsend call > 50k leads

type Mode = "all" | "last" | "random";

interface Body {
  tenantId?: string;
  mode?: Mode;
  n?: number;
  immediate?: boolean;
}

export async function POST(req: Request) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (ctx.user.role !== "god") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if ((ctx.user.email ?? "").toLowerCase().trim() !== ALLOWED_GOD_EMAIL) {
    return NextResponse.json({ error: "godsend_email_restricted" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  const mode = body.mode ?? "last";
  if (mode !== "all" && mode !== "last" && mode !== "random") {
    return NextResponse.json({ error: "bad mode" }, { status: 400 });
  }
  const n = Math.min(HARD_CAP, Math.max(1, Math.floor(Number(body.n) || 100)));

  // Confirm a tenant offer exists and is active — otherwise enqueueLeads will
  // no-op and the user will think nothing happened.
  const offer = (
    await db
      .select({ active: outreachOffers.active, title: outreachOffers.title })
      .from(outreachOffers)
      .where(eq(outreachOffers.tenantId, body.tenantId))
      .limit(1)
  )[0];
  if (!offer) {
    return NextResponse.json(
      { error: "no_offer", hint: "This tenant has no outreach offer configured." },
      { status: 400 },
    );
  }
  if (!offer.active) {
    return NextResponse.json(
      { error: "offer_inactive", hint: "Activate the tenant's outreach offer first." },
      { status: 400 },
    );
  }

  // Build the lead id set per mode. We also dedup against leads already in
  // outreach_queue (whatever the status) so a pressure test doesn't try to
  // re-enqueue the same recipient twice.
  let leadIds: string[];
  if (mode === "all") {
    const rows = await db
      .select({ id: leads.id })
      .from(leads)
      .where(eq(leads.tenantId, body.tenantId))
      .limit(HARD_CAP);
    leadIds = rows.map((r) => r.id);
  } else if (mode === "last") {
    const rows = await db
      .select({ id: leads.id })
      .from(leads)
      .where(eq(leads.tenantId, body.tenantId))
      .orderBy(desc(leads.createdAt))
      .limit(n);
    leadIds = rows.map((r) => r.id);
  } else {
    // mode === "random"
    const rows = await db
      .select({ id: leads.id })
      .from(leads)
      .where(eq(leads.tenantId, body.tenantId))
      .orderBy(sql`random()`)
      .limit(n);
    leadIds = rows.map((r) => r.id);
  }

  if (leadIds.length === 0) {
    return NextResponse.json({ ok: true, requested: 0, queued: 0, alreadyQueued: 0 });
  }

  const result = await enqueueLeads(body.tenantId, leadIds);

  // Optional pressure-test accelerator: collapse the drip schedule so the
  // next cron tick attempts every still-queued row for this tenant right
  // away. This affects ALL queued rows for the tenant, not just the freshly
  // enqueued ones — that's the desired behavior for "send the test now".
  let accelerated = 0;
  if (body.immediate) {
    const updated = await db
      .update(outreachQueue)
      .set({ scheduledFor: new Date() })
      .where(
        and(
          eq(outreachQueue.tenantId, body.tenantId),
          eq(outreachQueue.status, "queued"),
          gt(outreachQueue.scheduledFor, new Date()),
        ),
      )
      .returning({ id: outreachQueue.id });
    accelerated = updated.length;
  }

  return NextResponse.json({
    ok: true,
    requested: leadIds.length,
    queued: result.queued,
    skippedNoEmail: result.skippedNoEmail,
    skippedSuppressed: result.skippedSuppressed,
    skippedBadAddress: result.skippedBadAddress,
    skippedDuplicate: result.skippedDuplicate,
    immediate: !!body.immediate,
    accelerated,
    offerTitle: offer.title,
  });
}
