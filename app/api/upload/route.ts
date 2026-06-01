import { NextResponse } from "next/server";
import { getAuthContext } from "@/src/auth/context";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(req: Request) {
  const ctx = await getAuthContext();
  if (!ctx || (ctx.user.role !== "god" && ctx.user.role !== "manager")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "no file" }, { status: 400 });
  const okTypes = ["image/png", "image/jpeg", "image/webp", "image/gif", "video/mp4"];
  if (!okTypes.includes(file.type)) return NextResponse.json({ error: "type not allowed" }, { status: 400 });
  if (file.size > 30 * 1024 * 1024) return NextResponse.json({ error: "max 30MB" }, { status: 400 });
  const ext = file.type === "video/mp4" ? "mp4" : file.type.split("/")[1].replace("jpeg", "jpg");
  const id = ctx.user.tenantId;
  const buf = Buffer.from(await file.arrayBuffer());
  const hash = buf.subarray(0, 8).toString("hex") + buf.length.toString(36);
  const dir = join(process.cwd(), "public", "uploads", id);
  await mkdir(dir, { recursive: true });
  const name = `${hash}.${ext}`;
  await writeFile(join(dir, name), buf);
  return NextResponse.json({ url: `/uploads/${id}/${name}` });
}
