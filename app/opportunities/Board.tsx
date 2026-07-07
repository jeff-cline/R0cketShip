"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  createOpportunityAction,
  updateOpportunityAction,
  setStageAction,
  addNoteAction,
  deleteOpportunityAction,
  reorderAction,
} from "./actions";

const ORANGE = "#ff5b2e"; // Jeff
const TEAL = "#0d7377"; // Krystalore

export interface BoardNote {
  id: string;
  body: string;
  color: "orange" | "teal";
  authorEmail: string;
  createdAt: string;
}
export interface BoardOpportunity {
  id: string;
  title: string;
  businessName: string;
  address: string;
  keyPeople: string;
  entryValue: string;
  monthlyValue: string;
  stage: number;
  status: string;
  createdByEmail: string;
  notes: BoardNote[];
}

function money(v: string | number): string {
  const n = Number(v || 0);
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
function fmt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function Board({
  opportunities,
  meEmail,
  meColor,
  meName,
  totalMonthly,
}: {
  opportunities: BoardOpportunity[];
  meEmail: string;
  meColor: "orange" | "teal";
  meName: string;
  totalMonthly: number;
}) {
  const [, startTransition] = useTransition();

  // Local ordering so drag/drop feels instant; re-sync if the id set changes
  // (add / delete on the server) but keep our order across note/field edits.
  const byId = useMemo(() => new Map(opportunities.map((o) => [o.id, o])), [opportunities]);
  const [order, setOrder] = useState<string[]>(opportunities.map((o) => o.id));
  useEffect(() => {
    const serverIds = opportunities.map((o) => o.id);
    setOrder((prev) => {
      const kept = prev.filter((id) => byId.has(id)); // drop deleted, keep our order
      const added = serverIds.filter((id) => !kept.includes(id)); // new opps (created at top)
      return dedupe([...added, ...kept]);
    });
  }, [opportunities, byId]);

  const dragId = useRef<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  function onDrop(targetId: string) {
    const src = dragId.current;
    dragId.current = null;
    setOverId(null);
    if (!src || src === targetId) return;
    setOrder((prev) => {
      const next = prev.filter((id) => id !== src);
      const at = next.indexOf(targetId);
      next.splice(at, 0, src);
      startTransition(() => reorderAction(next));
      return next;
    });
  }

  const me = meColor === "orange" ? ORANGE : TEAL;
  const cards = order.map((id) => byId.get(id)).filter(Boolean) as BoardOpportunity[];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 px-6 py-4 backdrop-blur"
        style={{ background: "color-mix(in srgb, var(--bg-app) 82%, transparent)", borderBottom: "1px solid var(--line)" }}
      >
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${TEAL}, ${ORANGE})` }}>◎</span>
          <div>
            <h1 className="text-lg font-extrabold leading-none">Opportunities</h1>
            <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>Krystalore × R0cketShip — joint deal board</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-right">
            <div className="label">Pipeline / mo</div>
            <div className="font-extrabold" style={{ color: TEAL }}>{money(totalMonthly)}</div>
          </div>
          <span className="chip">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: me }} /> You: {meName.split("@")[0]}
          </span>
          <a href="/" className="btn btn-ghost" style={{ padding: "7px 13px" }}>← Site</a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-8">
        {/* Add new opportunity */}
        <details className="card mb-6 p-5">
          <summary className="cursor-pointer list-none text-sm font-bold" style={{ color: TEAL }}>+ Add an opportunity</summary>
          <form action={createOpportunityAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input name="title" required placeholder="Title (e.g. Acme Roofing — Statewide)" className="input sm:col-span-2" />
            <input name="businessName" placeholder="Business name" className="input" />
            <input name="address" placeholder="Address" className="input" />
            <input name="keyPeople" placeholder="Key people" className="input sm:col-span-2" />
            <input name="entryValue" inputMode="numeric" placeholder="Entry value $" className="input" />
            <input name="monthlyValue" inputMode="numeric" placeholder="Monthly value $" className="input" />
            <div className="sm:col-span-2">
              <button className="btn btn-primary" style={{ background: TEAL }}>Add to board</button>
            </div>
          </form>
        </details>

        <p className="mb-3 text-xs" style={{ color: "var(--muted)" }}>
          Drag cards to reprioritize — top is highest. Notes stamp <span style={{ color: ORANGE, fontWeight: 700 }}>orange (Jeff)</span> / <span style={{ color: TEAL, fontWeight: 700 }}>teal (Krystalore)</span>. Every change emails the other partner.
        </p>

        {cards.length === 0 && (
          <div className="card p-8 text-center text-sm" style={{ color: "var(--muted)" }}>No opportunities yet. Add the first one above.</div>
        )}

        <div className="flex flex-col gap-4">
          {cards.map((o) => (
            <div
              key={o.id}
              draggable
              onDragStart={() => (dragId.current = o.id)}
              onDragOver={(e) => { e.preventDefault(); setOverId(o.id); }}
              onDragLeave={() => setOverId((v) => (v === o.id ? null : v))}
              onDrop={() => onDrop(o.id)}
              className="card p-5"
              style={{
                borderLeft: `4px solid ${o.status === "won" ? TEAL : o.status === "lost" ? "var(--neg)" : ORANGE}`,
                outline: overId === o.id ? `2px dashed ${TEAL}` : "none",
                cursor: "grab",
              }}
            >
              <OpportunityCard o={o} meColor={meColor} startTransition={startTransition} />
            </div>
          ))}
        </div>

        {/* Business footer */}
        <footer className="mt-12 border-t pt-6 text-sm" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
          <p className="font-semibold" style={{ color: "var(--ink)" }}>Krystalore × R0cketShip</p>
          <p>5869 Av. Isla Verde, Carolina, Puerto Rico</p>
          <p className="mt-1 flex flex-wrap gap-x-4">
            <a href="https://www.krystalorecrews.com" target="_blank" rel="noreferrer" style={{ color: TEAL }}>Krystalore Crews</a>
            <a href="https://r0cketship.com" target="_blank" rel="noreferrer" style={{ color: ORANGE }}>R0cketShip.com</a>
            <a href="mailto:krystalore@thecrewscoach.com">krystalore@thecrewscoach.com</a>
            <a href="mailto:jeff.cline@me.com">jeff.cline@me.com</a>
          </p>
        </footer>
      </main>
    </div>
  );
}

function OpportunityCard({
  o,
  meColor,
  startTransition,
}: {
  o: BoardOpportunity;
  meColor: "orange" | "teal";
  startTransition: (cb: () => void) => void;
}) {
  const [editing, setEditing] = useState(false);
  const meHex = meColor === "orange" ? ORANGE : TEAL;

  function setStage(n: number) {
    const fd = new FormData();
    fd.set("id", o.id);
    fd.set("stage", String(Math.max(0, Math.min(5, n))));
    startTransition(() => setStageAction(fd));
  }

  return (
    <div onDragStart={(e) => { if (editing) e.preventDefault(); }}>
      {/* Title row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-extrabold leading-tight">{o.title}</h3>
          {o.businessName && <p className="text-sm" style={{ color: "var(--ink-2)" }}>{o.businessName}</p>}
          {o.address && <p className="text-xs" style={{ color: "var(--muted)" }}>{o.address}</p>}
        </div>
        <div className="text-right">
          <div className="text-sm font-extrabold" style={{ color: TEAL }}>{money(o.monthlyValue)}/mo</div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>Entry {money(o.entryValue)}</div>
        </div>
      </div>

      {o.keyPeople && (
        <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
          <span className="label" style={{ marginRight: 6 }}>Key people</span>{o.keyPeople}
        </p>
      )}

      {/* Stage pips — R0cketShip values-to-close (0..5) */}
      <div className="mt-3 flex items-center gap-2">
        <span className="label">Close</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setStage(n === o.stage ? n - 1 : n)}
            title={`Set ${n} of 5 values to close`}
            className="h-4 w-4 rounded-full transition"
            style={{ background: n <= o.stage ? ORANGE : "var(--surface-3)", border: `1px solid ${n <= o.stage ? ORANGE : "var(--line-strong)"}` }}
          />
        ))}
        <span className="text-xs" style={{ color: "var(--muted)" }}>{o.stage}/5</span>
      </div>

      {/* Notes timeline (top-to-bottom, color attributed) */}
      <div className="mt-4 flex flex-col gap-2">
        {o.notes.map((n) => (
          <div key={n.id} className="rounded-lg border p-2.5" style={{ borderColor: "var(--line)", borderLeft: `3px solid ${n.color === "orange" ? ORANGE : TEAL}` }}>
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
              <span className="h-2 w-2 rounded-full" style={{ background: n.color === "orange" ? ORANGE : TEAL }} />
              <span style={{ fontWeight: 700, color: n.color === "orange" ? ORANGE : TEAL }}>{n.authorEmail.split("@")[0] || (n.color === "orange" ? "Jeff" : "Krystalore")}</span>
              <span>· {fmt(n.createdAt)}</span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm" style={{ color: "var(--ink)" }}>{n.body}</p>
          </div>
        ))}
      </div>

      {/* Add note */}
      <form action={addNoteAction} className="mt-3 flex items-end gap-2">
        <input type="hidden" name="opportunityId" value={o.id} />
        <input name="body" required placeholder="Add a note…" className="input" />
        <button className="btn" style={{ background: meHex, color: "#fff" }}>Note</button>
      </form>

      {/* Edit / status / delete */}
      <div className="mt-3 flex items-center gap-3 text-xs">
        <button type="button" onClick={() => setEditing((v) => !v)} className="font-semibold" style={{ color: "var(--muted)" }}>
          {editing ? "Close edit" : "Edit"}
        </button>
        <StatusForm o={o} />
        <form action={deleteOpportunityAction} onSubmit={(e) => { if (!confirm("Delete this opportunity?")) e.preventDefault(); }}>
          <input type="hidden" name="id" value={o.id} />
          <button className="font-semibold" style={{ color: "var(--neg)" }}>Delete</button>
        </form>
      </div>

      {editing && (
        <form action={updateOpportunityAction} className="mt-3 grid gap-2 rounded-lg p-3 sm:grid-cols-2" style={{ background: "var(--surface-2)" }}>
          <input type="hidden" name="id" value={o.id} />
          <input name="title" defaultValue={o.title} placeholder="Title" className="input sm:col-span-2" />
          <input name="businessName" defaultValue={o.businessName} placeholder="Business name" className="input" />
          <input name="address" defaultValue={o.address} placeholder="Address" className="input" />
          <input name="keyPeople" defaultValue={o.keyPeople} placeholder="Key people" className="input sm:col-span-2" />
          <input name="entryValue" defaultValue={o.entryValue} inputMode="numeric" placeholder="Entry value $" className="input" />
          <input name="monthlyValue" defaultValue={o.monthlyValue} inputMode="numeric" placeholder="Monthly value $" className="input" />
          <div className="sm:col-span-2"><button className="btn btn-primary" style={{ background: TEAL }}>Save changes</button></div>
        </form>
      )}
    </div>
  );
}

function StatusForm({ o }: { o: BoardOpportunity }) {
  return (
    <form action={updateOpportunityAction} className="flex items-center gap-1">
      <input type="hidden" name="id" value={o.id} />
      <select name="status" defaultValue={o.status} className="input" style={{ padding: "3px 8px", width: "auto", fontSize: 12 }} onChange={(e) => e.currentTarget.form?.requestSubmit()}>
        <option value="open">Open</option>
        <option value="won">Won</option>
        <option value="lost">Lost</option>
      </select>
    </form>
  );
}

function dedupe(a: string[]): string[] {
  return Array.from(new Set(a));
}
