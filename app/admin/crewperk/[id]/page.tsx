import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { crewMerchants } from "@/src/db/schema";
import { requireAuth } from "@/src/auth/guard";
import { MerchantForm } from "../MerchantForm";
import { saveMerchantAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditMerchant({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth(["god"]);
  const { id } = await params;
  const m = (await db.select().from(crewMerchants).where(eq(crewMerchants.id, id)).limit(1))[0];
  if (!m) notFound();

  return (
    <div>
      <a href="/admin/crewperk" className="text-sm font-semibold" style={{ color: "var(--color-accent)" }}>← All merchants</a>
      <div className="mb-1 mt-2 text-2xl font-extrabold" style={{ color: "var(--ink)" }}>{m.name}</div>
      <p className="mb-5 text-sm" style={{ color: "var(--muted)" }}>🚀 {m.rating} ({m.reviewCount} reviews) · {m.clicks} clicks · <a href={`https://crewperk.com/m/${m.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-accent)" }}>crewperk.com/m/{m.slug}</a></p>
      <div className="card p-5"><MerchantForm merchant={m} action={saveMerchantAction} submitLabel="Save changes" /></div>
    </div>
  );
}
