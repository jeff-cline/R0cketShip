import { asc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { opportunities, opportunityNotes } from "../db/schema";
import { coreEmail } from "../core-api/client";

export type OpportunityRow = typeof opportunities.$inferSelect;
export type OpportunityNoteRow = typeof opportunityNotes.$inferSelect;

// The two partners. Notes/timeline are color-attributed and every change
// notifies "the other one" so we always know when the board moved.
const JEFF = "jeff.cline@me.com";
const KRYSTALORE = "krystalore@thecrewscoach.com";

/** Orange = Jeff, teal = Krystalore (per the board spec). */
export function colorForEmail(email: string | null | undefined): "orange" | "teal" {
  return (email ?? "").toLowerCase() === JEFF ? "orange" : "teal";
}

/** Who to email when `actorEmail` makes a change: the *other* partner. */
function counterpartyOf(actorEmail: string | null | undefined): string {
  return (actorEmail ?? "").toLowerCase() === JEFF ? KRYSTALORE : JEFF;
}

/** Fire-and-forget partner notification via the Core API. Never throws into the request path. */
async function notifyCounterparty(actorEmail: string | null | undefined, title: string, action: string): Promise<void> {
  try {
    const to = counterpartyOf(actorEmail);
    const who = (actorEmail ?? "A partner").split("@")[0];
    await coreEmail({
      to,
      subject: `Opportunity updated: ${title}`,
      html: `<p><strong>${who}</strong> ${action} on the opportunity <strong>${escapeHtml(title)}</strong>.</p>
<p style="color:#61708a">Open the board at <a href="https://worldchangers.ai/opportunities">/opportunities</a> to see the change.</p>`,
    });
  } catch {
    /* notification is best-effort */
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

/** All opportunities, top-to-bottom by priority (drag/drop order), oldest tiebreak. */
export async function listOpportunities(): Promise<OpportunityRow[]> {
  return db.select().from(opportunities).orderBy(asc(opportunities.priority), asc(opportunities.createdAt));
}

export async function getNotesFor(opportunityId: string): Promise<OpportunityNoteRow[]> {
  return db
    .select()
    .from(opportunityNotes)
    .where(eq(opportunityNotes.opportunityId, opportunityId))
    .orderBy(asc(opportunityNotes.createdAt));
}

/** Every note grouped by opportunity id, in one query (board renders all cards). */
export async function getAllNotes(): Promise<Map<string, OpportunityNoteRow[]>> {
  const rows = await db.select().from(opportunityNotes).orderBy(asc(opportunityNotes.createdAt));
  const map = new Map<string, OpportunityNoteRow[]>();
  for (const r of rows) {
    const list = map.get(r.opportunityId) ?? [];
    list.push(r);
    map.set(r.opportunityId, list);
  }
  return map;
}

export interface OpportunityInput {
  title: string;
  businessName?: string | null;
  address?: string | null;
  keyPeople?: string | null;
  entryValue?: string | null;
  monthlyValue?: string | null;
  stage?: number | null;
  status?: string | null;
}

/** Create a new opportunity at the TOP of the board (highest priority). */
export async function createOpportunity(actorEmail: string, input: OpportunityInput): Promise<OpportunityRow> {
  const all = await listOpportunities();
  const topPriority = all.length ? Number(all[0].priority) - 1 : 1000;
  const [row] = await db
    .insert(opportunities)
    .values({
      title: input.title.slice(0, 200),
      businessName: clean(input.businessName),
      address: clean(input.address),
      keyPeople: clean(input.keyPeople),
      entryValue: numStr(input.entryValue),
      monthlyValue: numStr(input.monthlyValue),
      stage: clampStage(input.stage),
      status: input.status ?? "open",
      priority: String(topPriority),
      createdByEmail: actorEmail,
    })
    .returning();
  await notifyCounterparty(actorEmail, row.title, "added a new opportunity");
  return row;
}

/** Update fields (title/business/address/key people/values/stage/status). */
export async function updateOpportunity(actorEmail: string, id: string, input: Partial<OpportunityInput>): Promise<void> {
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.title != null) patch.title = input.title.slice(0, 200);
  if (input.businessName !== undefined) patch.businessName = clean(input.businessName);
  if (input.address !== undefined) patch.address = clean(input.address);
  if (input.keyPeople !== undefined) patch.keyPeople = clean(input.keyPeople);
  if (input.entryValue !== undefined) patch.entryValue = numStr(input.entryValue);
  if (input.monthlyValue !== undefined) patch.monthlyValue = numStr(input.monthlyValue);
  if (input.stage !== undefined) patch.stage = clampStage(input.stage);
  if (input.status != null) patch.status = input.status;

  const [row] = await db.update(opportunities).set(patch).where(eq(opportunities.id, id)).returning();
  if (row) await notifyCounterparty(actorEmail, row.title, "updated the details");
}

export async function deleteOpportunity(id: string): Promise<void> {
  await db.delete(opportunities).where(eq(opportunities.id, id));
}

/**
 * Persist a new top-to-bottom order. `orderedIds` is the full list of ids in the
 * order they now appear; priority is rewritten to 1000, 1010, 1020… so future
 * inserts and drags always have room.
 */
export async function reorderOpportunities(actorEmail: string, orderedIds: string[]): Promise<void> {
  let p = 1000;
  for (const id of orderedIds) {
    await db.update(opportunities).set({ priority: String(p) }).where(eq(opportunities.id, id));
    p += 10;
  }
  await notifyCounterparty(actorEmail, "the board", "reprioritized the board");
}

/** Add a color-attributed, timestamped note and notify the other partner. */
export async function addNote(actorEmail: string, actorId: string | null, opportunityId: string, body: string): Promise<void> {
  const text = body.trim();
  if (!text) return;
  await db.insert(opportunityNotes).values({
    opportunityId,
    authorId: actorId,
    authorEmail: actorEmail,
    authorColor: colorForEmail(actorEmail),
    body: text.slice(0, 4000),
  });
  const [opp] = await db.select().from(opportunities).where(eq(opportunities.id, opportunityId)).limit(1);
  if (opp) {
    await db.update(opportunities).set({ updatedAt: new Date() }).where(eq(opportunities.id, opportunityId));
    await notifyCounterparty(actorEmail, opp.title, "added a note");
  }
}

// ---- helpers ----
function clean(v: string | null | undefined): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s.slice(0, 2000) : null;
}
function numStr(v: string | null | undefined): string {
  const n = Number(String(v ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? String(n) : "0";
}
function clampStage(n: number | null | undefined): number {
  const v = Math.round(Number(n ?? 0));
  return Math.max(0, Math.min(5, Number.isFinite(v) ? v : 0));
}
