import { getAuthContext } from "@/src/auth/context";
import { readFile } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";

// Serve a partner's 1099 PDF to god (or the owner) only. Never public.
export async function GET(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const ctx = await getAuthContext();
  if (!ctx || (ctx.user.role !== "god" && ctx.user.id !== userId)) return new Response("unauthorized", { status: 401 });
  try {
    const buf = await readFile(join(process.cwd(), "private-uploads", "1099", `${userId}.pdf`));
    return new Response(new Uint8Array(buf), {
      headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="1099-${userId}.pdf"` },
    });
  } catch {
    return new Response("not found", { status: 404 });
  }
}
