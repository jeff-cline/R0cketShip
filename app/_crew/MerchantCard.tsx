"use client";

import { useState } from "react";

// Yelp-style merchant card with an image slider (when a product has multiple
// images) and a 1–5 rocket rating below it.
const ORANGE = "#ff5b2e";

export type Merchant = {
  name: string;
  cat: string;
  rating: number;
  reviews: number;
  perk: string;
  price: string;
  images: string[];
  href?: string;
};

function RocketIcon({ size = 14, dim = false }: { size?: number; dim?: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/rocket.png" width={size} height={size} alt="" aria-hidden className="inline-block shrink-0" style={{ objectFit: "contain", opacity: dim ? 0.22 : 1 }} />;
}

export function MerchantCard({ m }: { m: Merchant }) {
  const [i, setI] = useState(0);
  const many = m.images.length > 1;
  const go = (d: number, e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setI((p) => (p + d + m.images.length) % m.images.length); };

  return (
    <a href={m.href ?? "#join"} className="group flex flex-col overflow-hidden rounded-2xl border bg-white transition hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: "#e6eaf1" }}>
      <div className="relative h-40 w-full overflow-hidden bg-[#eef2f8]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={m.images[i]} alt={m.name} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-[1.03]" />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold shadow-sm" style={{ color: ORANGE }}>🎁 {m.perk}</span>
        {many && (
          <>
            <button onClick={(e) => go(-1, e)} aria-label="Previous photo" className="absolute left-2 top-1/2 hidden h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-sm font-bold shadow group-hover:grid">‹</button>
            <button onClick={(e) => go(1, e)} aria-label="Next photo" className="absolute right-2 top-1/2 hidden h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-sm font-bold shadow group-hover:grid">›</button>
            <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
              {m.images.map((_, d) => (
                <span key={d} className="h-1.5 rounded-full transition-all" style={{ width: d === i ? 14 : 5, background: d === i ? "#fff" : "rgba(255,255,255,.6)" }} />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="text-base font-extrabold leading-tight" style={{ color: "#0a0e17" }}>{m.name}</div>
        <div className="mt-0.5 text-xs" style={{ color: "#61708a" }}>{m.cat} · {m.price}</div>
        <div className="mt-2 flex items-center gap-2">
          <span className="inline-flex items-center gap-0.5" aria-label={`${m.rating} out of 5 rockets`}>
            {Array.from({ length: 5 }).map((_, d) => <RocketIcon key={d} size={15} dim={d >= m.rating} />)}
          </span>
          <span className="text-xs font-semibold" style={{ color: "#8b97ad" }}>{m.reviews} reviews</span>
        </div>
      </div>
    </a>
  );
}
