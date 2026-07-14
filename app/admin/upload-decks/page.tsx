import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { operatingDecks } from "@/src/db/schema";
import { desc } from "drizzle-orm";
import { INDUSTRIES } from "@/app/corporate-structure/industries";
import { deleteDeckAction, toggleDeckAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function UploadDecksPage() {
  await requireAuth(["god"]);
  const decks = await db.select().from(operatingDecks).orderBy(desc(operatingDecks.createdAt));

  return (
    <div>
      <div className="mb-1 text-2xl font-extrabold" style={{ color: "var(--ink)" }}>Upload Decks</div>
      <p className="mb-6 text-sm" style={{ color: "var(--muted)" }}>
        Operating Entity Pitch Decks — featured at the end of a division&apos;s deck flow on /corporate-structure. Attach one to a division and it appears live with a big download button.
      </p>

      {/* Upload form (posts to the API route so large PDFs are handled cleanly). */}
      <form action="/api/admin/upload-deck" method="post" encType="multipart/form-data" className="card mb-8 flex flex-col gap-3 p-5">
        <div className="text-sm font-bold" style={{ color: "var(--ink)" }}>New deck</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col"><span className="label">Title *</span><input name="title" required className="input" placeholder="Ascend Health Intelligence Investor Pitch Deck" /></label>
          <label className="flex flex-col"><span className="label">Headline numbers</span><input name="highlight" className="input" placeholder="$164B → $295B market · $2M raise @ $20M" /></label>
          <label className="flex flex-col"><span className="label">Subtitle</span><input name="subtitle" className="input" placeholder="A R0cketShip joint venture" /></label>
          <label className="flex flex-col">
            <span className="label">Attach to division</span>
            <select name="slug" className="input" defaultValue="">
              <option value="">— none (unattached) —</option>
              {INDUSTRIES.map((i) => <option key={i.slug} value={i.slug}>{i.name}</option>)}
            </select>
          </label>
        </div>
        <label className="flex flex-col"><span className="label">Description</span><textarea name="description" rows={3} className="input" placeholder="Puffed-up pitch — the opportunity, the numbers, why R0cketShip wins." /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col"><span className="label">Image (optional)</span><input type="file" name="image" accept="image/*" className="input" style={{ padding: "7px" }} /></label>
          <label className="flex flex-col"><span className="label">Deck PDF *</span><input type="file" name="pdf" accept="application/pdf" required className="input" style={{ padding: "7px" }} /></label>
        </div>
        <div><button className="btn btn-primary" style={{ padding: "10px 18px" }}>Upload deck</button></div>
      </form>

      {/* Existing decks */}
      {decks.length === 0 ? (
        <div className="card p-8 text-center" style={{ color: "var(--muted)" }}>No decks uploaded yet.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {decks.map((d) => (
            <div key={d.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold" style={{ color: "var(--ink)" }}>{d.title}</span>
                  {d.slug && <span className="chip">{d.slug}</span>}
                  {!d.active && <span className="chip" style={{ color: "var(--neg)" }}>hidden</span>}
                </div>
                {d.highlight && <div className="text-sm" style={{ color: "var(--muted)" }}>{d.highlight}</div>}
                <div className="mt-1 flex gap-3 text-xs">
                  <a href={d.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-accent)" }}>PDF ↗</a>
                  {d.imageUrl && <a href={d.imageUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-accent)" }}>Image ↗</a>}
                </div>
              </div>
              <div className="flex gap-2">
                <form action={toggleDeckAction}>
                  <input type="hidden" name="id" value={d.id} />
                  <input type="hidden" name="active" value={String(d.active)} />
                  <button className="btn btn-ghost" style={{ padding: "7px 12px" }}>{d.active ? "Hide" : "Show"}</button>
                </form>
                <form action={deleteDeckAction}>
                  <input type="hidden" name="id" value={d.id} />
                  <button className="btn btn-ghost" style={{ padding: "7px 12px", color: "var(--neg)" }}>Delete</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
