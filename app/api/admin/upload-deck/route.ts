import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getAuthContext } from "@/src/auth/context";
import { db } from "@/src/db/client";
import { operatingDecks } from "@/src/db/schema";

export const runtime = "nodejs";

const DECK_DIR = path.join(process.cwd(), "public", "decks");

async function save(file: File | null, prefix: string): Promise<string | null> {
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) return null;
  await mkdir(DECK_DIR, { recursive: true });
  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
  const fname = `${prefix}-${Date.now()}-${Math.round(file.size % 100000)}.${ext}`;
  await writeFile(path.join(DECK_DIR, fname), Buffer.from(await file.arrayBuffer()));
  return `/decks/${fname}`;
}

const back = (req: Request) => NextResponse.redirect(new URL("/admin/upload-decks", req.url), { status: 303 });

export async function POST(req: Request) {
  const ctx = await getAuthContext();
  if (!ctx || ctx.user.role !== "god") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const fd = await req.formData();
  const title = String(fd.get("title") ?? "").trim();
  const pdf = fd.get("pdf");
  if (!title || !(pdf instanceof File) || pdf.size === 0) return back(req);

  const pdfUrl = await save(pdf, "deck");
  if (!pdfUrl) return back(req);
  const img = fd.get("image");
  const imageUrl = img instanceof File ? await save(img, "img") : null;

  await db.insert(operatingDecks).values({
    slug: (String(fd.get("slug") ?? "").trim() || null),
    title,
    subtitle: String(fd.get("subtitle") ?? "").trim() || null,
    description: String(fd.get("description") ?? "").trim() || null,
    highlight: String(fd.get("highlight") ?? "").trim() || null,
    imageUrl,
    pdfUrl,
    createdBy: ctx.user.id,
  });
  return back(req);
}
