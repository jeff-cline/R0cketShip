import { requireAuth } from "@/src/auth/guard";
import { listOpportunities, getAllNotes, colorForEmail } from "@/src/opportunities/store";
import { Board, type BoardOpportunity } from "./Board";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GOD-ONLY. The joint Krystalore × R0cketShip deal board. Reachable from any
// core/white-label host (worldchangers.ai/opportunities, r0cketship.com/opportunities…)
// but requireAuth(["god"]) gates it to the two partner accounts.
export default async function OpportunitiesPage() {
  const ctx = await requireAuth(["god"]);
  const rows = await listOpportunities();
  const notesByOpp = await getAllNotes();

  const opportunities: BoardOpportunity[] = rows.map((o) => ({
    id: o.id,
    title: o.title,
    businessName: o.businessName ?? "",
    address: o.address ?? "",
    keyPeople: o.keyPeople ?? "",
    entryValue: o.entryValue ?? "0",
    monthlyValue: o.monthlyValue ?? "0",
    stage: o.stage ?? 0,
    status: o.status ?? "open",
    createdByEmail: o.createdByEmail ?? "",
    notes: (notesByOpp.get(o.id) ?? []).map((n) => ({
      id: n.id,
      body: n.body,
      color: (n.authorColor as "orange" | "teal") ?? "teal",
      authorEmail: n.authorEmail ?? "",
      createdAt: (n.createdAt instanceof Date ? n.createdAt : new Date(n.createdAt)).toISOString(),
    })),
  }));

  const meColor = colorForEmail(ctx.user.email);
  const totalMonthly = rows.reduce((s, o) => s + Number(o.monthlyValue || 0), 0);

  return (
    <Board
      opportunities={opportunities}
      meEmail={ctx.user.email}
      meColor={meColor}
      meName={ctx.user.name ?? ctx.user.email}
      totalMonthly={totalMonthly}
    />
  );
}
