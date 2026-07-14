"use client";

import { useState } from "react";

const ORANGE = "#ff5b2e";
const usd = (c: number) => `$${(c / 100).toFixed(0)}`;

export function TicketReserve({ ticketId, name, priceCents }: { ticketId: string; name: string; priceCents: number }) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const reserve = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    let passCode = "";
    try { passCode = localStorage.getItem("crewperk_pass") || ""; } catch {}
    try {
      await fetch("/api/crew/ticket-order", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ticketId, qty, email, passCode }) });
    } catch {}
    setBusy(false); setDone(true);
  };

  return (
    <>
      <button onClick={() => { setOpen(true); setDone(false); }} className="rounded-full px-4 py-2 text-sm font-bold text-white" style={{ background: ORANGE }}>Get tickets · {usd(priceCents)}</button>
      {open && (
        <div className="fixed inset-0 z-[70] grid place-items-center px-4 text-left" style={{ background: "rgba(10,14,23,.55)", backdropFilter: "blur(3px)" }} onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <button onClick={() => setOpen(false)} aria-label="Close" className="float-right text-xl leading-none" style={{ color: "#8b97ad" }}>×</button>
            {done ? (
              <div className="text-center">
                <div className="text-2xl font-extrabold" style={{ color: "#16a34a" }}>Reserved! 🎟️</div>
                <p className="mt-2 text-sm" style={{ color: "#61708a" }}>We&apos;re holding {qty} for <b>{name}</b>. We&apos;ll email your tickets and payment link shortly.</p>
              </div>
            ) : (
              <form onSubmit={reserve}>
                <div className="text-lg font-extrabold" style={{ color: "#0a0e17" }}>{name}</div>
                <p className="mt-1 text-sm" style={{ color: "#61708a" }}>{usd(priceCents)} per crew ticket.</p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-sm font-semibold" style={{ color: "#2a3550" }}>Quantity</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-8 w-8 place-items-center rounded-lg border font-bold" style={{ borderColor: "#d3dae6" }}>−</button>
                    <span className="w-6 text-center font-bold">{qty}</span>
                    <button type="button" onClick={() => setQty((q) => Math.min(10, q + 1))} className="grid h-8 w-8 place-items-center rounded-lg border font-bold" style={{ borderColor: "#d3dae6" }}>+</button>
                  </div>
                  <span className="ml-auto text-lg font-extrabold" style={{ color: ORANGE }}>{usd(priceCents * qty)}</span>
                </div>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email for your tickets" className="mt-4 w-full rounded-lg border px-3 py-2.5 text-sm outline-none" style={{ borderColor: "#d3dae6" }} />
                <button type="submit" disabled={busy} className="mt-4 w-full rounded-xl py-3 font-bold text-white disabled:opacity-50" style={{ background: ORANGE }}>{busy ? "Reserving…" : "Reserve tickets →"}</button>
                <p className="mt-2 text-center text-[11px]" style={{ color: "#8b97ad" }}>Secure checkout coming — we&apos;ll email your payment link.</p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
