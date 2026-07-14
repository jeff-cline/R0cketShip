"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ORANGE = "#ff5b2e";

function Rk({ size = 22, dim = false }: { size?: number; dim?: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/rocket.png" width={size} height={size} alt="" style={{ objectFit: "contain", opacity: dim ? 0.25 : 1 }} />;
}

/** Fires a click event when a profile is viewed (powers the merchant dashboard). */
export function ClickBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    fetch("/api/crew/click", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug }) }).catch(() => {});
  }, [slug]);
  return null;
}

export function ReviewForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/crew/review", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, rating, name, comment }) });
    } catch {}
    setDone(true);
    router.refresh();
  };

  if (done) {
    return <div className="rounded-2xl border bg-white p-5 text-sm shadow-sm" style={{ borderColor: "#e6eaf1", color: "#16a34a" }}>Thanks — your 🚀 review is in!</div>;
  }
  return (
    <form onSubmit={submit} className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: "#e6eaf1" }}>
      <div className="text-base font-extrabold" style={{ color: "#0a0e17" }}>Leave a rocket review</div>
      <div className="mt-3 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} rockets`} className="transition hover:scale-110"><Rk dim={n > rating} /></button>
        ))}
        <span className="ml-2 text-sm font-bold" style={{ color: ORANGE }}>{rating}/5</span>
      </div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (or ship)" className="mt-3 w-full rounded-lg border px-3 py-2.5 text-sm outline-none" style={{ borderColor: "#d3dae6" }} />
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was it? Tips for other crew…" rows={2} className="mt-2 w-full rounded-lg border px-3 py-2.5 text-sm outline-none" style={{ borderColor: "#d3dae6" }} />
      <button type="submit" className="mt-3 rounded-xl px-5 py-2.5 text-sm font-bold text-white" style={{ background: ORANGE }}>Post review</button>
    </form>
  );
}
