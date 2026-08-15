"use client";

import { useState } from "react";

// Investor Portal — accredited-only. Docs stay locked until the visitor opens
// the request form, then agrees to the accredited-investor disclaimer. Agreeing
// emails Jeff (notify) via mailto and unlocks the downloads. No backend needed;
// persistence/approval UI is a separate phase.

const ACCENT = "#ff5b2e";
const TO = "jeff.cline@me.com";

const DOCS = [
  { file: "09-Investor-One-Pager.pdf", title: "Investor One-Pager", desc: "The thesis on a single page — the fastest first look at the opportunity." },
  { file: "06-Investor-Deck.pdf", title: "Investor Deck", desc: "The full pitch: vision, model, market, traction, and the path to scale." },
  { file: "01-Business-Plan.pdf", title: "Business Plan", desc: "The complete operating plan — market, model, financials, and roadmap." },
  { file: "07-Riches-In-Niches.pdf", title: "Riches in Niches", desc: "How the multi-niche roll-up compounds advantage across verticals." },
  { file: "02-Wave-1-Launch-Playbook.pdf", title: "Wave 1 Launch Playbook", desc: "The go-to-market plan for the first wave of markets." },
  { file: "08-Sales-Rep-Opportunity.pdf", title: "Sales Rep Opportunity", desc: "The commission and equity opportunity for revenue partners." },
  { file: "04-SDR-Call-Scripts.pdf", title: "SDR Call Scripts", desc: "The outbound scripts powering the demand-generation engine." },
  { file: "05-Preflight-Hardening-Spec.pdf", title: "Preflight Hardening Spec", desc: "The technical readiness and security-hardening specification." },
];

// Where non-qualified visitors should go instead.
const ELSEWHERE = [
  { href: "/advertise", label: "Advertise with us" },
  { href: "/niches", label: "Quick-start with predictive data" },
  { href: "/e-partnership", label: "Joint venture with us" },
  { href: "/corporate-structure", label: "Explore the company" },
  { href: "/signup", label: "Get $50 free credit" },
];

const QUALIFY = "I agree that I am either an accredited investor, a family office, a private equity firm, or a fund seeking information on R0cketShip. This material is not for retail consumption.";

type Fields = { name: string; firm: string; type: string; email: string; phone: string; message: string };
const EMPTY: Fields = { name: "", firm: "", type: "Accredited investor", email: "", phone: "", message: "" };

function RImg({ size = 16, className = "" }: { size?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/rocket.png" width={size} height={size} alt="" aria-hidden className={`inline-block shrink-0 ${className}`} style={{ objectFit: "contain" }} />;
}

function founderMailto(context: string) {
  return `mailto:${TO}?subject=${encodeURIComponent(`Connect with Founder — ${context}`)}&body=${encodeURIComponent(`I'd like to connect with the founder regarding: ${context}\n\nName:\nFirm:\nPhone:\n`)}`;
}

function requestMailto(f: Fields) {
  const body = [
    `Investor access request for R0cketShip.`,
    ``,
    `Name: ${f.name}`,
    `Firm: ${f.firm}`,
    `Investor type: ${f.type}`,
    `Email: ${f.email}`,
    `Phone: ${f.phone}`,
    ``,
    `Message: ${f.message}`,
    ``,
    `Attestation: ${QUALIFY}`,
  ].join("\n");
  return `mailto:${TO}?subject=${encodeURIComponent("Investor Access Request")}&body=${encodeURIComponent(body)}`;
}

export function InvestorPortal() {
  const [unlocked, setUnlocked] = useState(false);
  const [modal, setModal] = useState<null | "request" | "disclaimer">(null);
  const [f, setF] = useState<Fields>(EMPTY);

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const agree = () => {
    // Persist the investor request to the CRM, then open the email notification.
    fetch("/api/business-lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source: "investor", name: f.name, company: f.firm, email: f.email, workPhone: f.phone, message: f.message, meta: { investorType: f.type, attestation: true } }),
    }).catch(() => {});
    window.location.href = requestMailto(f);
    setUnlocked(true);
    setModal(null);
  };

  const elsewhereLinks = (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {ELSEWHERE.map((l) => (
        <a key={l.href} href={l.href} className="text-sm font-bold underline-offset-2 hover:underline" style={{ color: ACCENT }}>{l.label} →</a>
      ))}
    </div>
  );

  return (
    <main className="grid-bg-dark relative min-h-[100dvh] overflow-hidden" style={{ background: "radial-gradient(120% 60% at 80% -8%, #1a1322, #06080d 55%)", color: "#fff" }}>
      <nav className="sticky top-0 z-40 flex items-center justify-between px-5 py-4 backdrop-blur sm:px-8" style={{ background: "rgba(6,8,13,.66)", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
        <a href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight"><RImg size={26} /> R<span style={{ color: ACCENT }}>0</span>cketShip</a>
        <a href="/corporate-structure" className="rounded-full border px-4 py-2 text-sm font-semibold transition hover:bg-white/5" style={{ borderColor: "rgba(255,255,255,.2)" }}>Corporate structure →</a>
      </nav>

      {/* Hero */}
      <header className="mx-auto max-w-4xl px-5 pb-10 pt-16 text-center sm:px-8 sm:pt-24">
        <RImg size={64} className="drop-shadow-[0_8px_30px_rgba(255,91,46,.5)]" />
        <h1 className="font-serif-display flame-text mx-auto mt-6 max-w-3xl text-5xl font-extrabold leading-[1.02] sm:text-7xl">Investor Portal</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
          The full picture of R0cketShip — for serious capital. Request access to the deck, the business plan, and the full data room.
        </p>
      </header>

      {/* Accredited-only notice */}
      <section className="px-5 sm:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border p-6 sm:p-8" style={{ borderColor: "color-mix(in srgb, #ff5b2e 50%, transparent)", background: "linear-gradient(100deg, color-mix(in srgb, #ff5b2e 12%, transparent), rgba(255,255,255,.03))" }}>
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest" style={{ color: ACCENT }}><RImg size={16} /> Accredited investors only</div>
          <p className="mt-3 text-lg font-bold leading-snug text-white">
            This portal is exclusively for accredited investors, family offices, private equity firms, and venture funds. It is <span style={{ color: ACCENT }}>not for retail consumption.</span>
          </p>
          <div className="mt-5 border-t pt-5" style={{ borderColor: "rgba(255,255,255,.12)" }}>
            <div className="mb-2 text-sm font-semibold text-white/70">Not a fit? Here&apos;s where you should be:</div>
            {elsewhereLinks}
          </div>
        </div>
      </section>

      {/* CTAs */}
      <section className="px-5 py-10 text-center sm:px-8">
        <button onClick={() => setModal("request")} className="rounded-full px-8 py-4 text-lg font-bold text-white transition active:translate-y-px" style={{ background: ACCENT, boxShadow: "0 10px 30px -8px rgba(255,91,46,.6)" }}>
          Request Access
        </button>
        <div className="mt-4">
          <a href={founderMailto("Investor Portal")} className="text-sm font-bold" style={{ color: ACCENT }}>Or connect with the founder directly →</a>
        </div>
        {unlocked && <p className="mt-4 text-sm font-semibold" style={{ color: "#79f2a8" }}>Access granted — your documents are unlocked below.</p>}
      </section>

      {/* Documents */}
      <section className="px-5 pb-16 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-serif-display text-center text-3xl font-extrabold sm:text-4xl">What&apos;s inside the data room</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {DOCS.map((d) => (
              <div key={d.file} className="flex flex-col rounded-2xl border p-5" style={{ borderColor: "rgba(255,255,255,.1)", background: "rgba(255,255,255,.03)" }}>
                <div className="flex items-center gap-2 text-lg font-extrabold text-white"><RImg size={18} /> {d.title}</div>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-white/60">{d.desc}</p>
                {unlocked ? (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <a href={`/investor/${d.file}`} target="_blank" rel="noopener noreferrer" className="rounded-full px-4 py-2 text-sm font-bold text-white" style={{ background: ACCENT }}>Download PDF ↓</a>
                    <a href={founderMailto(d.title)} className="rounded-full border px-4 py-2 text-sm font-bold text-white hover:bg-white/5" style={{ borderColor: "rgba(255,255,255,.25)" }}>Connect with Founder</a>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-white/40">
                    🔒 Request access to unlock
                  </div>
                )}
              </div>
            ))}
          </div>

          {unlocked && (
            <div className="mt-10 text-center">
              <a href={founderMailto("Investor Portal — full data room")} className="inline-block rounded-full px-8 py-4 text-lg font-bold text-white" style={{ background: ACCENT, boxShadow: "0 10px 30px -8px rgba(255,91,46,.6)" }}>
                Connect with Founder
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Bottom flame quote */}
      <footer className="px-5 pb-16 pt-10 text-center sm:px-8" style={{ borderTop: "1px solid rgba(255,255,255,.08)" }}>
        <p className="font-serif-display flame-text mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-3 text-2xl font-extrabold leading-tight sm:text-4xl">
          &ldquo;Every industry is a geek away from being Uberized.&rdquo; — R0cketShip <RImg size={34} />
        </p>
        <p className="mt-6 text-xs text-white/30">© R0cketShip Holdings · Jeff Cline</p>
      </footer>

      {/* Request modal */}
      {modal === "request" && (
        <div className="fixed inset-0 z-[60] grid place-items-center px-4" style={{ background: "rgba(4,6,10,.8)", backdropFilter: "blur(4px)" }} onClick={() => setModal(null)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); setModal("disclaimer"); }} className="w-full max-w-md rounded-2xl border p-6" style={{ borderColor: "rgba(255,255,255,.14)", background: "linear-gradient(180deg,#11151f,#0a0e17)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-extrabold text-white"><RImg size={20} /> Request Access</div>
              <button type="button" onClick={() => setModal(null)} aria-label="Close" className="text-white/40 hover:text-white">✕</button>
            </div>
            <p className="mt-1 text-sm text-white/50">For accredited investors, family offices, PE firms, and funds.</p>
            <div className="mt-4 grid gap-3">
              <input required value={f.name} onChange={set("name")} placeholder="Name" className="rounded-lg border bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30" style={{ borderColor: "rgba(255,255,255,.14)" }} />
              <input value={f.firm} onChange={set("firm")} placeholder="Firm / fund name" className="rounded-lg border bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30" style={{ borderColor: "rgba(255,255,255,.14)" }} />
              <select value={f.type} onChange={set("type")} className="rounded-lg border bg-white/5 px-3 py-2.5 text-sm text-white outline-none" style={{ borderColor: "rgba(255,255,255,.14)" }}>
                {["Accredited investor", "Family office", "Private equity firm", "Venture fund"].map((o) => <option key={o} value={o} className="bg-[#0a0e17]">{o}</option>)}
              </select>
              <input required type="email" value={f.email} onChange={set("email")} placeholder="Email" className="rounded-lg border bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30" style={{ borderColor: "rgba(255,255,255,.14)" }} />
              <input value={f.phone} onChange={set("phone")} placeholder="Phone" className="rounded-lg border bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30" style={{ borderColor: "rgba(255,255,255,.14)" }} />
              <textarea value={f.message} onChange={set("message")} placeholder="Anything we should know?" rows={2} className="rounded-lg border bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30" style={{ borderColor: "rgba(255,255,255,.14)" }} />
            </div>
            <button type="submit" className="mt-5 w-full rounded-xl py-3 font-bold text-white transition active:translate-y-px" style={{ background: ACCENT }}>Continue →</button>
          </form>
        </div>
      )}

      {/* Disclaimer gate */}
      {modal === "disclaimer" && (
        <div className="fixed inset-0 z-[60] grid place-items-center px-4" style={{ background: "rgba(4,6,10,.85)", backdropFilter: "blur(4px)" }} onClick={() => setModal("request")}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border p-6" style={{ borderColor: "color-mix(in srgb, #ff5b2e 45%, transparent)", background: "linear-gradient(180deg,#11151f,#0a0e17)" }}>
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest" style={{ color: ACCENT }}><RImg size={16} /> Before you proceed</div>
            <p className="mt-3 text-base font-semibold leading-snug text-white">&ldquo;{QUALIFY}&rdquo;</p>
            <div className="mt-5 border-t pt-4" style={{ borderColor: "rgba(255,255,255,.12)" }}>
              <div className="mb-2 text-sm text-white/55">Not a fit? Here&apos;s where you should be:</div>
              {elsewhereLinks}
            </div>
            <button onClick={agree} className="mt-6 w-full rounded-xl py-3 font-bold text-white transition active:translate-y-px" style={{ background: ACCENT }}>I agree to the terms</button>
            <button onClick={() => setModal(null)} className="mt-2 w-full rounded-xl py-2.5 text-sm font-semibold text-white/60 hover:text-white">I don&apos;t qualify</button>
            <p className="mt-2 text-center text-xs text-white/35">Agreeing notifies our team at {TO} and unlocks the data room.</p>
          </div>
        </div>
      )}
    </main>
  );
}
