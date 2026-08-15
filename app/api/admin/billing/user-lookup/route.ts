import { NextResponse } from "next/server";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import {
  users,
  wallets,
  creditLedger,
  payments,
  leadDeliveries,
  zipSubscriptions,
  tenants,
} from "@/src/db/schema";

export const runtime = "nodejs";

/**
 * God / manager-only user-lookup for the Grant credits panel.
 *
 *   GET /api/admin/billing/user-lookup?q=jeff@me.com
 *
 * Returns up to 20 matches. For each match we also assemble the full account
 * snapshot the operator needs to decide how much to grant: wallet balance,
 * lifetime spend, leads delivered, active subscriptions, plus the last 5
 * admin grants on that wallet.
 */
export async function GET(req: Request) {
  const ctx = await requireAuth(["god", "manager"]);
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ users: [] });

  const scopeTenantId = ctx.user.role === "god" ? null : ctx.user.tenantId;

  const whereEmail = scopeTenantId
    ? and(ilike(users.email, `%${q}%`), eq(users.tenantId, scopeTenantId))
    : ilike(users.email, `%${q}%`);

  const matches = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      tenantId: users.tenantId,
      tenantDomain: tenants.domain,
      createdAt: users.createdAt,
    })
    .from(users)
    .innerJoin(tenants, eq(tenants.id, users.tenantId))
    .where(whereEmail)
    .orderBy(desc(users.createdAt))
    .limit(20);

  if (matches.length === 0) return NextResponse.json({ users: [] });

  // Pull wallet rows for matched users (LEFT join — accounts may not have one yet).
  const userIds = matches.map((m) => m.id);
  const walletRows = await db
    .select({ id: wallets.id, userId: wallets.userId })
    .from(wallets)
    .where(sql`${wallets.userId} = ANY(${userIds})`);
  const walletByUser = new Map(walletRows.map((w) => [w.userId, w.id]));

  // Per-wallet aggregates — one query each, joined back by user id.
  const out = [];
  for (const m of matches) {
    const walletId = walletByUser.get(m.id) ?? null;

    let balance = 0;
    let spentUsd = 0;
    let creditsPurchased = 0;
    let recentGrants: Array<{
      amount: number;
      description: string | null;
      createdAt: string;
    }> = [];

    if (walletId) {
      const balRow = (
        await db
          .select({ c: sql<number>`coalesce(sum(${creditLedger.amount}), 0)::float` })
          .from(creditLedger)
          .where(eq(creditLedger.walletId, walletId))
      )[0];
      balance = Number(balRow?.c ?? 0);

      const payRow = (
        await db
          .select({
            usd: sql<number>`coalesce(sum(${payments.amountUsd}), 0)::float`,
            credits: sql<number>`coalesce(sum(${payments.credits}), 0)::float`,
          })
          .from(payments)
          .where(and(eq(payments.walletId, walletId), eq(payments.status, "paid")))
      )[0];
      spentUsd = Number(payRow?.usd ?? 0);
      creditsPurchased = Number(payRow?.credits ?? 0);

      const grants = await db
        .select({
          amount: creditLedger.amount,
          description: creditLedger.description,
          createdAt: creditLedger.createdAt,
        })
        .from(creditLedger)
        .where(and(eq(creditLedger.walletId, walletId), eq(creditLedger.type, "admin_grant")))
        .orderBy(desc(creditLedger.createdAt))
        .limit(5);
      recentGrants = grants.map((g) => ({
        amount: Number(g.amount),
        description: g.description,
        createdAt: g.createdAt.toISOString(),
      }));
    }

    const leadsRow = (
      await db
        .select({ c: sql<number>`count(*)::int` })
        .from(leadDeliveries)
        .where(eq(leadDeliveries.customerId, m.id))
    )[0];

    const subsRow = (
      await db
        .select({ c: sql<number>`count(*)::int` })
        .from(zipSubscriptions)
        .where(and(eq(zipSubscriptions.customerId, m.id), eq(zipSubscriptions.status, "active")))
    )[0];

    out.push({
      id: m.id,
      email: m.email,
      role: m.role,
      tenantDomain: m.tenantDomain,
      createdAt: m.createdAt.toISOString(),
      walletId,
      balance,
      spentUsd,
      creditsPurchased,
      leadsDelivered: Number(leadsRow?.c ?? 0),
      activeSubscriptions: Number(subsRow?.c ?? 0),
      recentGrants,
    });
  }

  return NextResponse.json({ users: out });
}
