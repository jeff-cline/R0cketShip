"use client";

import { useActionState, useState, type CSSProperties } from "react";
import type { NoteView, PageView, Priority, UserRow } from "@/src/yellow/data";
import { YellowSheet, BlackBand, PRIORITY_COLORS, MARGIN_X, LINE_H } from "./ui";
import {
  createNoteAction, toggleDoneAction, setPriorityAction, editNoteAction, deleteNoteAction,
  reorderNotesAction, addSubnoteAction, setContactAction, createPageAction, renamePageAction,
  logoutAction, impersonateAction, exitImpersonationAction, createUserAction,
} from "./actions";

type Me = { id: string; name: string; username: string; isAdmin: boolean };
const PRANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
const PLABEL: Record<Priority, string> = { high: "High", medium: "Med", low: "Low" };
const NEXT_PRI: Record<Priority, Priority> = { high: "medium", medium: "low", low: "high" };

function fmt(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours(); const m = d.getMinutes(); const ap = h < 12 ? "a" : "p";
  h = h % 12 || 12;
  return `${d.getMonth() + 1}/${d.getDate()} ${h}:${String(m).padStart(2, "0")}${ap}`;
}

export function YellowApp({ me, impersonating, isAdmin, pages: initialPages, users }: {
  me: Me; impersonating: boolean; isAdmin: boolean; pages: PageView[]; users: UserRow[];
}) {
  const [pages, setPages] = useState<PageView[]>(initialPages);
  const [pageIdx, setPageIdx] = useState(0);
  const [rollKey, setRollKey] = useState(1);
  const [showCompleted, setShowCompleted] = useState(false);
  const [sortPri, setSortPri] = useState(false);
  const [modalId, setModalId] = useState<string | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const page = pages[Math.min(pageIdx, Math.max(0, pages.length - 1))];
  if (!page) return <div style={{ minHeight: "100vh", background: "#111" }} />;

  // ── local-state mutators (optimistic) ─────────────────────────────────────
  const patchPage = (pid: string, fn: (p: PageView) => PageView) =>
    setPages((ps) => ps.map((p) => (p.id === pid ? fn(p) : p)));
  const patchNote = (pid: string, nid: string, fn: (n: NoteView) => NoteView) =>
    patchPage(pid, (p) => ({ ...p, notes: p.notes.map((n) => (n.id === nid ? fn(n) : n)) }));

  function switchPage(i: number) {
    if (i === pageIdx) return;
    setPageIdx(i); setShowCompleted(false); setRollKey((k) => k + 1);
  }

  function addNote(text: string, priority: Priority) {
    const t = text.trim(); if (!t || !page) return;
    const tmp: NoteView = {
      id: `tmp_${Math.random().toString(36).slice(2)}`, text: t, priority, done: false,
      position: page.notes.length, completedAt: null, createdAt: new Date().toISOString(),
      contactName: null, contactEmail: null, contactPhone: null, photoUrl: null, subnotes: [],
    };
    patchPage(page.id, (p) => ({ ...p, notes: [...p.notes, tmp] }));
    createNoteAction(page.id, t, priority).catch(() => {});
  }
  function toggleDone(n: NoteView) {
    patchNote(page.id, n.id, (x) => ({ ...x, done: !x.done, completedAt: !x.done ? new Date().toISOString() : null }));
    toggleDoneAction(n.id, !n.done).catch(() => {});
  }
  function cyclePriority(n: NoteView) {
    const np = NEXT_PRI[n.priority];
    patchNote(page.id, n.id, (x) => ({ ...x, priority: np }));
    setPriorityAction(n.id, np).catch(() => {});
  }
  function removeNote(n: NoteView) {
    patchPage(page.id, (p) => ({ ...p, notes: p.notes.filter((x) => x.id !== n.id) }));
    deleteNoteAction(n.id).catch(() => {});
  }
  function saveEdit(n: NoteView, text: string) {
    patchNote(page.id, n.id, (x) => ({ ...x, text }));
    editNoteAction(n.id, text).catch(() => {});
  }
  function saveContact(noteId: string, name: string, email: string, phone: string) {
    patchNote(page.id, noteId, (x) => ({ ...x, contactName: name.trim() || null, contactEmail: email.trim() || null, contactPhone: phone.trim() || null }));
    setContactAction(noteId, name, email, phone).catch(() => {});
  }
  async function uploadPhoto(file: File) {
    if (!file || uploading) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("pageId", page.id);
    try {
      const res = await fetch("/api/yellow/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.note) {
        const tmp: NoteView = {
          id: data.note.id, text: "📷 Page photo", priority: "medium", done: false,
          position: page.notes.length, completedAt: null, createdAt: data.note.createdAt || new Date().toISOString(),
          contactName: null, contactEmail: null, contactPhone: null, photoUrl: data.note.url, subnotes: [],
        };
        patchPage(page.id, (p) => ({ ...p, notes: [...p.notes, tmp] }));
        setModalId(data.note.id);
      } else {
        alert(data.error || "Upload failed");
      }
    } catch {
      alert("Upload failed");
    }
    setUploading(false);
  }
  function addSub(noteId: string, text: string) {
    const t = text.trim(); if (!t) return;
    patchNote(page.id, noteId, (x) => ({
      ...x, subnotes: [...x.subnotes, { id: `tmp_${Math.random()}`, text: t, createdAt: new Date().toISOString() }],
    }));
    addSubnoteAction(noteId, t).catch(() => {});
  }
  function persistOrder(active: NoteView[]) {
    const completed = page.notes.filter((n) => n.done);
    const merged = [...active, ...completed];
    patchPage(page.id, (p) => ({ ...p, notes: merged }));
    reorderNotesAction(page.id, merged.map((n) => n.id)).catch(() => {});
  }
  function onDrop(overId: string) {
    if (!dragId || dragId === overId) return;
    const active = page.notes.filter((n) => !n.done);
    const from = active.findIndex((n) => n.id === dragId);
    const to = active.findIndex((n) => n.id === overId);
    if (from < 0 || to < 0) return;
    const next = [...active];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    persistOrder(next);
    setDragId(null);
  }

  async function identity(fn: () => Promise<void>) { await fn().catch(() => {}); window.location.assign("/yellow"); }

  const activeNotes = page ? page.notes.filter((n) => !n.done) : [];
  const doneNotes = page ? page.notes.filter((n) => n.done) : [];
  const shown = (showCompleted ? doneNotes : activeNotes)
    .slice()
    .sort((a, b) => (sortPri ? PRANK[a.priority] - PRANK[b.priority] : 0));

  const modalNote = page?.notes.find((n) => n.id === modalId) || null;

  return (
    <div style={{ minHeight: "100vh", background: "#111", padding: "22px 16px 60px" }}>
      <style>{`
        @keyframes yroll { from { transform: perspective(1400px) rotateX(-72deg); opacity: 0; transform-origin: top center; }
                           to   { transform: perspective(1400px) rotateX(0deg);   opacity: 1; transform-origin: top center; } }
        .yroll { animation: yroll .45s cubic-bezier(.2,.8,.2,1) both; }
        .ynote { transition: opacity .2s; }
        .ynote:hover .ydel { opacity: 1; }
      `}</style>

      {impersonating && (
        <div style={{ maxWidth: 850, margin: "0 auto 10px", background: "#7a2e0e", color: "#ffd9a8",
          borderRadius: 8, padding: "8px 14px", fontSize: 13.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Viewing <b>{me.name}</b>&apos;s pad (impersonating)</span>
          <button onClick={() => identity(exitImpersonationAction)}
            style={{ background: "#ffd9a8", color: "#7a2e0e", border: 0, borderRadius: 999, padding: "5px 12px", fontWeight: 700, cursor: "pointer" }}>
            Exit ✕
          </button>
        </div>
      )}

      <YellowSheet>
        <BlackBand right={me.name}>
          <div style={{ display: "flex", gap: 8, marginLeft: 6, alignItems: "center" }}>
            {isAdmin && (
              <button onClick={() => setAdminOpen((v) => !v)} style={bandBtn}>Users</button>
            )}
            <label style={{ ...uploadBtn, opacity: uploading ? 0.6 : 1 }} title="Upload a photo of a page">
              {uploading ? "Uploading…" : "📷 Upload"}
              <input type="file" accept="image/*" style={{ display: "none" }} disabled={uploading}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); e.currentTarget.value = ""; }} />
            </label>
            <button onClick={() => identity(logoutAction)} style={bandBtn}>Sign out</button>
          </div>
        </BlackBand>

        {/* page tabs + controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px 4px", flexWrap: "wrap",
          borderBottom: "1px solid rgba(0,0,0,.08)" }}>
          {pages.map((p, i) => (
            <button key={p.id} onClick={() => switchPage(i)}
              style={{ ...tab, ...(i === pageIdx ? tabActive : {}) }}
              onDoubleClick={() => {
                const t = prompt("Rename page", p.title); if (t) { patchPage(p.id, (x) => ({ ...x, title: t })); renamePageAction(p.id, t).catch(() => {}); }
              }}>
              {p.title}
            </button>
          ))}
          <button onClick={() => {
            const t = (prompt("New page name", "New page") || "").trim(); if (!t) return;
            const id = `tmp_${Math.random()}`;
            setPages((ps) => [...ps, { id, title: t, position: ps.length, notes: [] }]);
            setPageIdx(pages.length); setRollKey((k) => k + 1);
            createPageAction(t).catch(() => {});
          }} style={{ ...tab, fontWeight: 800 }}>+ page</button>

          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button onClick={() => { setShowCompleted((v) => !v); setRollKey((k) => k + 1); }} style={pill(showCompleted)}>
              {showCompleted ? `Active (${activeNotes.length})` : `Completed (${doneNotes.length})`}
            </button>
            <button onClick={() => setSortPri((v) => !v)} style={pill(sortPri)}>Sort by priority</button>
          </div>
        </div>

        {/* notes */}
        <div key={`${page?.id}-${showCompleted}-${rollKey}`} className="yroll"
          style={{ padding: `10px ${MARGIN_X - 12}px 60px ${MARGIN_X + 6}px`, minHeight: 420 }}>
          {!showCompleted && (
            <AddBar onAdd={addNote} />
          )}
          {shown.length === 0 && (
            <div style={{ color: "#8a7f42", fontSize: 14, lineHeight: `${LINE_H}px` }}>
              {showCompleted ? "Nothing completed yet." : "Nothing here yet — add your first note above."}
            </div>
          )}
          {shown.map((n) => (
            <div key={n.id} className="ynote"
              draggable={!showCompleted && !sortPri}
              onDragStart={() => setDragId(n.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(n.id)}
              style={{ display: "flex", alignItems: "center", gap: 9, minHeight: LINE_H, lineHeight: `${LINE_H}px`,
                cursor: !showCompleted && !sortPri ? "grab" : "default", opacity: dragId === n.id ? 0.4 : 1 }}>
              <input type="checkbox" checked={n.done} onChange={() => toggleDone(n)}
                style={{ width: 17, height: 17, accentColor: "#111", cursor: "pointer" }} />
              <button title={`${PLABEL[n.priority]} priority — click to change`} onClick={() => cyclePriority(n)}
                style={{ width: 11, height: 11, borderRadius: 999, background: PRIORITY_COLORS[n.priority], border: 0, cursor: "pointer", flexShrink: 0 }} />
              <button onClick={() => setModalId(n.id)}
                style={{ flex: 1, textAlign: "left", background: "none", border: 0, cursor: "pointer", padding: 0,
                  fontSize: 16, color: "#1a1a1a", fontFamily: "'Segoe Print','Bradley Hand',cursive,system-ui",
                  fontWeight: n.priority === "high" ? 800 : 400,
                  textDecoration: n.done ? "line-through" : "none", textDecorationColor: "#c0392b", opacity: n.done ? 0.55 : 1 }}>
                {n.text}
                {n.subnotes.length > 0 && <span style={{ fontSize: 11, color: "#7a6f2a", marginLeft: 8 }}>💬 {n.subnotes.length}</span>}
              </button>
              <span style={{ fontSize: 10.5, color: "#8a7f42", whiteSpace: "nowrap" }}>{fmt(n.done && n.completedAt ? n.completedAt : n.createdAt)}</span>
              <button className="ydel" onClick={() => removeNote(n)} title="Delete"
                style={{ opacity: 0, background: "none", border: 0, color: "#b3261e", cursor: "pointer", fontSize: 14 }}>✕</button>
            </div>
          ))}
        </div>
      </YellowSheet>

      {modalNote && (
        <NoteModal note={modalNote} onClose={() => setModalId(null)} onAddSub={(t) => addSub(modalNote.id, t)}
          onSaveText={(t) => saveEdit(modalNote, t)}
          onSaveContact={(name, email, phone) => saveContact(modalNote.id, name, email, phone)} />
      )}
      {adminOpen && isAdmin && <AdminPanel users={users} onClose={() => setAdminOpen(false)}
        onImpersonate={(id) => identity(() => impersonateAction(id))} />}
    </div>
  );
}

// ── sub-components ────────────────────────────────────────────────────────────
function AddBar({ onAdd }: { onAdd: (text: string, p: Priority) => void }) {
  const [text, setText] = useState("");
  const [pri, setPri] = useState<Priority>("medium");
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", minHeight: LINE_H, marginBottom: 4 }}>
      <input value={text} onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && text.trim()) { onAdd(text, pri); setText(""); } }}
        placeholder="Add a note and press Enter…"
        style={{ flex: 1, border: 0, borderBottom: "1.5px dashed #b9ac4e", background: "transparent",
          fontSize: 16, padding: "4px 2px", color: "#1a1a1a", outline: "none",
          fontFamily: "'Segoe Print','Bradley Hand',cursive,system-ui" }} />
      <button onClick={() => setPri(NEXT_PRI[pri])} title="Priority"
        style={{ display: "flex", alignItems: "center", gap: 5, border: "1px solid #cbbf5a", background: "#fffdf0",
          borderRadius: 999, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#4a4632" }}>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: PRIORITY_COLORS[pri] }} /> {PLABEL[pri]}
      </button>
      <button onClick={() => { if (text.trim()) { onAdd(text, pri); setText(""); } }}
        style={{ border: 0, background: "#111", color: "#ffe94d", borderRadius: 999, padding: "6px 14px", fontWeight: 800, cursor: "pointer" }}>Add</button>
    </div>
  );
}

function NoteModal({ note, onClose, onAddSub, onSaveText, onSaveContact }: {
  note: NoteView; onClose: () => void; onAddSub: (t: string) => void; onSaveText: (t: string) => void;
  onSaveContact: (name: string, email: string, phone: string) => void;
}) {
  const [sub, setSub] = useState("");
  const [text, setText] = useState(note.text);
  const [cName, setCName] = useState(note.contactName ?? "");
  const [cEmail, setCEmail] = useState(note.contactEmail ?? "");
  const [cPhone, setCPhone] = useState(note.contactPhone ?? "");
  const saveContact = () => onSaveContact(cName, cEmail, cPhone);
  const telDigits = cPhone.replace(/[^\d+]/g, "");

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "grid", placeItems: "center", zIndex: 100, padding: 18 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 520, maxHeight: "92vh", overflowY: "auto", background: "#fffbe0",
        borderRadius: 12, boxShadow: "0 30px 80px rgba(0,0,0,.5)" }}>
        <div style={{ position: "sticky", top: 0, background: "#141414", color: "#fff", padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <b style={{ fontSize: 14 }}>Note</b>
          <button onClick={onClose} style={{ background: "none", border: 0, color: "#fff", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding: 18 }}>
          {note.photoUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <a href={note.photoUrl} target="_blank" rel="noreferrer" style={{ display: "block", marginBottom: 14 }} title="Open full size">
              <img src={note.photoUrl} alt="Uploaded page" style={{ width: "100%", borderRadius: 8, border: "1px solid #e2d98a", cursor: "zoom-in" }} />
            </a>
          )}
          <textarea value={text} onChange={(e) => setText(e.target.value)} onBlur={() => text.trim() && text !== note.text && onSaveText(text.trim())}
            rows={2} style={{ width: "100%", fontSize: 16, border: "1px solid #e2d98a", borderRadius: 8, padding: 10, background: "#fffef5", color: "#1a1a1a", resize: "vertical", boxSizing: "border-box" }} />

          {/* Contact */}
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8a7f42", margin: "16px 0 6px" }}>Contact</div>
          <div style={{ display: "grid", gap: 7 }}>
            <input value={cName} onChange={(e) => setCName(e.target.value)} onBlur={saveContact} placeholder="Name" style={ci} />
            <input value={cEmail} onChange={(e) => setCEmail(e.target.value)} onBlur={saveContact} placeholder="Email" type="email" style={ci} />
            <input value={cPhone} onChange={(e) => setCPhone(e.target.value)} onBlur={saveContact} placeholder="Phone" type="tel" style={ci} />
          </div>
          {(telDigits || cEmail.trim()) && (
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              {telDigits && <a href={`tel:${telDigits}`} style={actBtn("#0b8a3c")}>📞 Call</a>}
              {telDigits && <a href={`sms:${telDigits}`} style={actBtn("#1457e6")}>💬 Text</a>}
              {cEmail.trim() && <a href={`mailto:${cEmail.trim()}`} style={actBtn("#c0392b")}>✉️ Email</a>}
            </div>
          )}

          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8a7f42", margin: "18px 0 6px" }}>Notes</div>
          <div style={{ display: "grid", gap: 6, maxHeight: 240, overflowY: "auto" }}>
            {note.subnotes.length === 0 && <div style={{ fontSize: 13, color: "#9a8f52" }}>No notes yet.</div>}
            {note.subnotes.map((s) => (
              <div key={s.id} style={{ borderLeft: "3px solid #e2b93a", background: "#fffef5", padding: "7px 10px", borderRadius: 6 }}>
                <div style={{ fontSize: 14, color: "#1a1a1a" }}>{s.text}</div>
                <div style={{ fontSize: 10.5, color: "#9a8f52", marginTop: 2 }}>{fmt(s.createdAt)}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <input value={sub} onChange={(e) => setSub(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && sub.trim()) { onAddSub(sub); setSub(""); } }}
              placeholder="Add a timestamped note…"
              style={{ flex: 1, border: "1px solid #e2d98a", borderRadius: 8, padding: "9px 11px", fontSize: 14, background: "#fffef5", color: "#1a1a1a", outline: "none" }} />
            <button onClick={() => { if (sub.trim()) { onAddSub(sub); setSub(""); } }}
              style={{ border: 0, background: "#111", color: "#ffe94d", borderRadius: 8, padding: "0 16px", fontWeight: 800, cursor: "pointer" }}>Add</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminPanel({ users, onClose, onImpersonate }: {
  users: UserRow[]; onClose: () => void; onImpersonate: (id: string) => void;
}) {
  const [state, formAction, pending] = useActionState(createUserAction, {} as { error?: string; ok?: string });
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "grid", placeItems: "center", zIndex: 100, padding: 18 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 560, background: "#fffbe0", borderRadius: 12, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,.5)" }}>
        <div style={{ background: "#141414", color: "#fff", padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <b style={{ fontSize: 14 }}>Users &amp; access</b>
          <button onClick={onClose} style={{ background: "none", border: 0, color: "#fff", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8a7f42", marginBottom: 8 }}>New account</div>
          <form action={formAction} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 6 }}>
            <input name="name" placeholder="Name" required style={ai} />
            <input name="username" placeholder="Username" required style={ai} />
            <input name="email" placeholder="Email" type="email" required style={ai} />
            <input name="password" placeholder="Temp password" required style={ai} />
            <button type="submit" disabled={pending} style={{ gridColumn: "1 / -1", border: 0, background: "#111", color: "#ffe94d", borderRadius: 8, padding: "9px", fontWeight: 800, cursor: "pointer", opacity: pending ? 0.6 : 1 }}>
              {pending ? "…" : "Create account"}
            </button>
          </form>
          {state?.error && <div style={{ color: "#b3261e", fontSize: 13, fontWeight: 600 }}>{state.error}</div>}
          {state?.ok && <div style={{ color: "#1a7f3c", fontSize: 13, fontWeight: 600 }}>{state.ok}</div>}

          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8a7f42", margin: "18px 0 6px" }}>All users</div>
          <div style={{ display: "grid", gap: 6, maxHeight: 240, overflowY: "auto" }}>
            {users.map((u) => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fffef5", border: "1px solid #eadf9a", borderRadius: 8, padding: "8px 11px" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{u.name} {u.isAdmin && <span style={{ fontSize: 10, color: "#ff5b2e" }}>ADMIN</span>}</div>
                  <div style={{ fontSize: 12, color: "#8a7f42" }}>@{u.username} · {u.email}{u.mustReset ? " · must reset" : ""}</div>
                </div>
                <button onClick={() => onImpersonate(u.id)} style={{ border: "1px solid #cbbf5a", background: "#fff", borderRadius: 999, padding: "5px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer", color: "#4a4632" }}>Open ↗</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// styles
const bandBtn: CSSProperties = { background: "rgba(255,255,255,.12)", color: "#fff", border: 0, borderRadius: 999, padding: "5px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" };
const uploadBtn: CSSProperties = { display: "inline-flex", alignItems: "center", background: "#ffe94d", color: "#111", border: 0, borderRadius: 999, padding: "6px 13px", fontSize: 12.5, fontWeight: 800, cursor: "pointer" };
const tab: CSSProperties = { background: "rgba(0,0,0,.05)", border: "1px solid rgba(0,0,0,.12)", borderRadius: "8px 8px 0 0", padding: "6px 14px", fontSize: 13, fontWeight: 700, color: "#4a4632", cursor: "pointer" };
const tabActive: CSSProperties = { background: "#111", color: "#ffe94d", borderColor: "#111" };
const pill = (on: boolean): CSSProperties => ({ border: "1px solid #cbbf5a", background: on ? "#111" : "#fffdf0", color: on ? "#ffe94d" : "#4a4632", borderRadius: 999, padding: "5px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" });
const ai: CSSProperties = { border: "1px solid #e2d98a", borderRadius: 8, padding: "9px 11px", fontSize: 14, background: "#fffef5", color: "#1a1a1a", outline: "none" };
const ci: CSSProperties = { border: "1px solid #e2d98a", borderRadius: 8, padding: "8px 11px", fontSize: 14, background: "#fffef5", color: "#1a1a1a", outline: "none", width: "100%", boxSizing: "border-box" };
const actBtn = (bg: string): CSSProperties => ({ display: "inline-flex", alignItems: "center", gap: 5, background: bg, color: "#fff", textDecoration: "none", borderRadius: 999, padding: "8px 15px", fontWeight: 700, fontSize: 13.5, cursor: "pointer" });
