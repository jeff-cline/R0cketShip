import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { merchantBySlug } from "@/app/_crew/merchants";
import { ReviewForm, ClickBeacon } from "@/app/_crew/ReviewForm";
import { ShowPass } from "@/app/_crew/ShowPass";
import { AdSlot } from "@/app/_crew/AdSlot";
import { ticketsByMerchant } from "@/app/_crew/tickets";
import { TicketsSection } from "@/app/_crew/TicketsSection";

export const dynamic = "force-dynamic";
const ORANGE = "#ff5b2e";
const TEAL = "#0e9aa7";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const r = await merchantBySlug(slug);
  return { title: r ? `${r.m.name} — CrewPerk` : "CrewPerk", robots: { index: false, follow: false } };
}

function RImg({ size = 16, dim = false }: { size?: number; dim?: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/rocket.png" width={size} height={size} alt="" aria-hidden className="inline-block shrink-0" style={{ objectFit: "contain", opacity: dim ? 0.22 : 1 }} />;
}
function Rating({ n, size = 16 }: { n: number; size?: number }) {
  return <span className="inline-flex items-center gap-0.5">{Array.from({ length: 5 }).map((_, i) => <RImg key={i} size={size} dim={i >= n} />)}</span>;
}
function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function MerchantProfile({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await merchantBySlug(slug);
  if (!r) notFound();
  const { m, reviews } = r;
  const rating = Math.round(Number(m.rating));
  const imgs = (m.images ?? []) as string[];
  const tix = await ticketsByMerchant(m.id);

  return (
    <main className="min-h-[100dvh] bg-white" style={{ color: "#0a0e17" }}>
      <ClickBeacon slug={m.slug} />
      <nav className="sticky top-0 z-40 flex items-center justify-between border-b bg-white/90 px-5 py-3 backdrop-blur sm:px-8" style={{ borderColor: "#e6eaf1" }}>
        <a href="/" className="flex items-center gap-2 text-lg font-extrabold"><RImg size={22} /> Crew<span style={{ color: TEAL }}>Perk</span></a>
        <div className="hidden items-center gap-6 text-sm font-semibold md:flex" style={{ color: "#2a3550" }}>
          <a href="/#explore" className="hover:opacity-70">Explore</a>
          <a href="/#map" className="hover:opacity-70">Map</a>
          <a href="/crewperk/ports" className="hover:opacity-70">Ports</a>
          <a href="/crewperk/partner" className="hover:opacity-70">For merchants</a>
          <a href="/#join" className="rounded-full px-4 py-2 text-white" style={{ background: ORANGE }}>Get crew access</a>
        </div>
        <a href="/" className="text-sm font-semibold md:hidden" style={{ color: "#61708a" }}>← All perks</a>
      </nav>

      {/* Gallery */}
      {imgs.length > 0 && (
        <div className="mx-auto grid max-w-5xl gap-2 px-5 pt-5 sm:grid-cols-3 sm:px-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgs[0]} alt={m.name} className="h-56 w-full rounded-2xl object-cover sm:col-span-2 sm:h-72" />
          <div className="grid gap-2">
            {imgs.slice(1, 3).map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt="" className="h-28 w-full rounded-2xl object-cover sm:h-[8.5rem]" />
            ))}
            {imgs.length < 2 && <div className="grid h-28 place-items-center rounded-2xl text-sm sm:h-[8.5rem]" style={{ background: "#f3fbfc", color: TEAL }}>📸 More photos coming</div>}
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-7 sm:px-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-extrabold">{m.name}</h1>
            {m.tier === "advanced" && <span className="rounded-full px-2.5 py-1 text-xs font-bold text-white" style={{ background: ORANGE }}>Featured Partner</span>}
          </div>
          <div className="mt-1 text-sm" style={{ color: "#61708a" }}>{m.category} · {m.port.split(",")[0]} · {m.priceLevel}</div>
          <div className="mt-2 flex items-center gap-2">
            <Rating n={rating} /><span className="text-sm font-semibold" style={{ color: "#8b97ad" }}>{m.rating} · {m.reviewCount} reviews</span>
          </div>

          {/* Perk */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4" style={{ borderColor: "color-mix(in srgb, #ff5b2e 35%, transparent)", background: "#fff6f2" }}>
            <div>
              <div className="text-xs font-bold uppercase tracking-wide" style={{ color: ORANGE }}>Crew Perk</div>
              <div className="text-lg font-extrabold">🎁 {m.perk}</div>
            </div>
            <ShowPass merchantId={m.id} merchantName={m.name} perk={m.perk} />
          </div>

          {m.description && <p className="mt-5 leading-relaxed" style={{ color: "#2a3550" }}>{m.description}</p>}

          {tix.length > 0 && <div className="mt-7"><TicketsSection tickets={tix} title="Book this experience" compact /></div>}

          {/* Reviews */}
          <div className="mt-8">
            <h2 className="text-xl font-extrabold">Crew reviews</h2>
            <div className="mt-3"><ReviewForm slug={m.slug} /></div>
            <div className="mt-4 flex flex-col gap-3">
              {reviews.length === 0 && <p className="text-sm" style={{ color: "#8b97ad" }}>Be the first crew to review this spot.</p>}
              {reviews.map((rv) => (
                <div key={rv.id} className="rounded-2xl border p-4" style={{ borderColor: "#e6eaf1" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><Rating n={rv.rating} size={14} /><span className="text-sm font-bold">{rv.authorName ?? "Crew member"}</span></div>
                    <span className="text-xs" style={{ color: "#8b97ad" }}>{fmtDate(rv.createdAt)}</span>
                  </div>
                  {rv.comment && <p className="mt-1.5 text-sm" style={{ color: "#2a3550" }}>{rv.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact sidebar */}
        <aside className="lg:col-span-1">
          <div className="sticky top-20 rounded-2xl border p-5 shadow-sm" style={{ borderColor: "#e6eaf1" }}>
            <div className="text-sm font-bold" style={{ color: "#0a0e17" }}>Get there</div>
            <div className="mt-3 flex flex-col gap-2.5 text-sm">
              {m.phone && <a href={`tel:${m.phone}`} className="flex items-center gap-2 font-semibold" style={{ color: TEAL }}>📞 {m.phone}</a>}
              {m.address && <div className="flex items-start gap-2" style={{ color: "#2a3550" }}>📍 {m.address}</div>}
              {m.website && <a href={m.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-semibold" style={{ color: TEAL }}>🌐 Website</a>}
            </div>
            {m.address && (
              <a href={`https://maps.google.com/?q=${encodeURIComponent(m.address)}`} target="_blank" rel="noopener noreferrer" className="mt-4 block rounded-xl border-2 py-2.5 text-center text-sm font-bold" style={{ borderColor: ORANGE, color: ORANGE }}>Open in Maps</a>
            )}
          </div>
          <div className="mt-4"><AdSlot port={m.port} variant="card" /></div>
        </aside>
      </div>
    </main>
  );
}
