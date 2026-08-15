import { NextResponse } from "next/server";
import { getAuthContext } from "@/src/auth/context";
import { set1099Url } from "@/src/bd/partners";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";

// 1099s hold tax IDs, so they are stored OUTSIDE /public and served only via an authed route.
export async function POST(req: Request) {
  const ctx = await getAuthContext();
  if (!ctx || ctx.user.role !== "bd_partner") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "no file" }, { status: 400 });
  if (file.type !== "application/pdf") return NextResponse.json({ error: "PDF only." }, { status: 400 });
  if (file.size > 15 * 1024 * 1024) return NextResponse.json({ error: "Max 15MB." }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const dir = join(process.cwd(), "private-uploads", "1099");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, `${ctx.user.id}.pdf`), buf);
  await set1099Url(ctx.user.id, `/api/bd/1099/${ctx.user.id}`);
  return NextResponse.json({ ok: true, url: `/api/bd/1099/${ctx.user.id}` });
}
