import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

export const runtime = "nodejs";

// Per-deck *additional* niche passwords, set by the first recipient who opens a
// deck. Purely additive — the built-in passwords (TEMP!234 + any issued one) are
// checked client-side and always keep working; this only adds an extra password.
// Stored as a flat JSON file OUTSIDE the deployed app tree so it survives
// rebuilds and needs no DB migration (keeps it clear of the schema work).
const FILE = process.env.DECK_GATE_FILE || "/var/www/deck-gate.json";
const norm = (s: string) => (s ?? "").trim().toLowerCase();

async function load(): Promise<Record<string, string>> {
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as Record<string, string>;
  } catch {
    return {};
  }
}

async function save(store: Record<string, string>): Promise<void> {
  try { await mkdir(dirname(FILE), { recursive: true }); } catch {}
  await writeFile(FILE, JSON.stringify(store), "utf8");
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { key?: string; op?: string; password?: string };
  const key = body.key;
  if (!key || typeof key !== "string") return NextResponse.json({ error: "key required" }, { status: 400 });
  const store = await load();

  if (body.op === "status") return NextResponse.json({ hasNiche: !!store[key] });

  if (body.op === "verify") {
    return NextResponse.json({ ok: !!store[key] && norm(store[key]) === norm(body.password ?? "") });
  }

  if (body.op === "set") {
    // Set once, additively. Never overwrite an existing niche password.
    if (store[key]) return NextResponse.json({ ok: false, reason: "already set" });
    const pw = (body.password ?? "").trim();
    if (pw.length < 3) return NextResponse.json({ ok: false, reason: "too short" });
    store[key] = pw;
    await save(store);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "bad op" }, { status: 400 });
}
