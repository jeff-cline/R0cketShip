import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { businessLeads, businessLeadNotes, users } from "@/src/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { addNoteAction, setStatusAction, assignLeadAction } from "./actions";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "contacted", "qualified", "won", "lost"];

function fmt(d: Date | null) {
  if (!d) return "";
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default async function BusinessLeadsPage() {
  const ctx = await requireAuth(["god", "manager", "sales_manager"]);
  const isGod = ctx.user.role === "god";

  const leads = isGod
    ? await db.select().from(businessLeads).orderBy(desc(businessLeads.createdAt))
    : await db.select().from(businessLeads).where(eq(businessLeads.assignedToUserId, ctx.user.id)).orderBy(desc(businessLeads.createdAt));

  const ids = leads.map((l) => l.id);
  const notes = ids.length
    ? await db.select().from(businessLeadNotes).where(inArray(businessLeadNotes.leadId, ids)).orderBy(desc(businessLeadNotes.createdAt))
    : [];
  const notesByLead = new Map<string, typeof notes>();
  for (const n of notes) {
    const arr = notesByLead.get(n.leadId) ?? [];
    arr.push(n);
    notesByLead.set(n.leadId, arr);
  }

  const platformUsers = isGod ? await db.select({ id: users.id, email: users.email, role: users.role }).from(users) : [];

  return (
    <div>
      <div className="mb-1 text-2xl font-extrabold" style={{ color: "var(--ink)" }}>Business Leads</div>
      <p className="mb-6 text-sm" style={{ color: "var(--muted)" }}>
        Inbound submissions from r0cketship.com — contact, investor, and partner forms. Click a phone to dial, log timestamped notes, and assign leads out to your team.
      </p>

      {leads.length === 0 ? (
        <div className="card p-8 text-center" style={{ color: "var(--muted)" }}>No leads yet. Submissions from the site will appear here.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {leads.map((l) => {
            const leadNotes = notesByLead.get(l.id) ?? [];
            return (
              <div key={l.id} className="card p-5">
                {/* header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-extrabold" style={{ color: "var(--ink)" }}>{l.name || "—"}</span>
                      <span className="chip" style={{ textTransform: "capitalize" }}>{l.source}</span>
                      <span className="chip" style={{ background: "color-mix(in srgb, var(--color-accent) 16%, transparent)", color: "var(--ink)", textTransform: "capitalize" }}>{l.status}</span>
                    </div>
                    {l.company && <div className="mt-0.5 text-sm" style={{ color: "var(--muted)" }}>{l.company}</div>}
                  </div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>{fmt(l.createdAt)}</div>
                </div>

                {/* contact + dial */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {l.email && <a href={`mailto:${l.email}`} className="btn btn-ghost" style={{ padding: "7px 12px" }}>✉️ {l.email}</a>}
                  {l.workPhone && <a href={`tel:${l.workPhone}`} className="btn btn-ghost" style={{ padding: "7px 12px" }}>📞 Work: {l.workPhone}</a>}
                  {l.cellPhone && <a href={`tel:${l.cellPhone}`} className="btn btn-ghost" style={{ padding: "7px 12px" }}>📱 Cell: {l.cellPhone}</a>}
                </div>

                {(l.message || l.predictive) && (
                  <div className="mt-3 rounded-lg p-3 text-sm" style={{ background: "var(--surface-2)", color: "var(--ink-2)" }}>
                    {l.message && <div>{l.message}</div>}
                    {l.predictive && <div className="mt-1" style={{ color: "var(--muted)" }}><b>Predictive data:</b> {l.predictive}</div>}
                  </div>
                )}

                {/* status + assign */}
                <div className="mt-3 flex flex-wrap items-end gap-4">
                  <form action={setStatusAction} className="flex items-end gap-2">
                    <input type="hidden" name="leadId" value={l.id} />
                    <label className="flex flex-col">
                      <span className="label">Status</span>
                      <select name="status" defaultValue={l.status} className="input" style={{ width: 150 }}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </label>
                    <button className="btn btn-ghost" style={{ padding: "9px 14px" }}>Save</button>
                  </form>

                  {isGod && (
                    <form action={assignLeadAction} className="flex items-end gap-2">
                      <input type="hidden" name="leadId" value={l.id} />
                      <label className="flex flex-col">
                        <span className="label">Assign to</span>
                        <select name="userId" defaultValue={l.assignedToUserId ?? ""} className="input" style={{ width: 220 }}>
                          <option value="">Unassigned (everyone)</option>
                          {platformUsers.map((u) => <option key={u.id} value={u.id}>{u.email} · {u.role}</option>)}
                        </select>
                      </label>
                      <button className="btn btn-ghost" style={{ padding: "9px 14px" }}>Assign</button>
                    </form>
                  )}
                </div>

                {/* notes */}
                <div className="mt-4 border-t pt-3" style={{ borderColor: "var(--line)" }}>
                  <div className="label mb-2">Notes</div>
                  {leadNotes.length > 0 && (
                    <ul className="mb-3 flex flex-col gap-2">
                      {leadNotes.map((n) => (
                        <li key={n.id} className="rounded-lg p-2.5 text-sm" style={{ background: "var(--surface-2)" }}>
                          <div className="text-xs" style={{ color: "var(--muted)" }}>{fmt(n.createdAt)} · {n.authorEmail ?? "system"}</div>
                          <div style={{ color: "var(--ink)" }}>{n.body}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <form action={addNoteAction} className="flex items-end gap-2">
                    <input type="hidden" name="leadId" value={l.id} />
                    <textarea name="body" rows={1} placeholder="Add a note… (timestamped automatically)" className="input" style={{ flex: 1 }} />
                    <button className="btn btn-primary" style={{ padding: "9px 14px" }}>Add note</button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
