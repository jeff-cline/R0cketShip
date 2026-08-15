import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/src/db/client";
import { yellowNotes, yellowPages } from "@/src/db/schema";
import { getYellowAuth } from "@/src/yellow/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Upload a page photo → store it and drop a photo-note at the bottom of the page.
export async function POST(req: Request) {
  const auth = await getYellowAuth();
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const pageId = String(form.get("pageId") || "");
  if (!(file instanceof File)) return NextResponse.json({ error: "no file" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "images only" }, { status: 400 });
  if (file.size > 25 * 1024 * 1024) return NextResponse.json({ error: "max 25MB" }, { status: 400 });

  // page must belong to the signed-in user
  const owned = await db.select({ id: yellowPages.id }).from(yellowPages)
    .where(and(eq(yellowPages.id, pageId), eq(yellowPages.userId, auth.user.id))).limit(1);
  if (!owned[0]) return NextResponse.json({ error: "bad page" }, { status: 400 });

  const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const buf = Buffer.from(await file.arrayBuffer());
  const hash = buf.subarray(0, 8).toString("hex") + buf.length.toString(36);
  const dir = join(process.cwd(), "public", "uploads", "yellow", auth.user.id);
  await mkdir(dir, { recursive: true });
  const name = `${hash}.${ext}`;
  await writeFile(join(dir, name), buf);
  const url = `/uploads/yellow/${auth.user.id}/${name}`;

  const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${yellowNotes.position}), -1)` })
    .from(yellowNotes).where(eq(yellowNotes.pageId, pageId));
  const [note] = await db.insert(yellowNotes)
    .values({ pageId, text: "📷 Page photo", photoUrl: url, priority: "medium", position: Number(max) + 1 })
    .returning();

  return NextResponse.json({ ok: true, note: { id: note.id, url, createdAt: note.createdAt.toISOString() } });
}
