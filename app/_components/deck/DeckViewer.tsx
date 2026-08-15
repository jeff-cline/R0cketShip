"use client";

import { useCallback, useEffect, useState } from "react";
import type { Deck, Slide, OperatingDeck, DeckAnchor } from "./types";
import { HomeRocket } from "@/app/_components/HomeRocket";
import { VizChart } from "./Charts";

// Reusable password-gated slide deck. Drives the Cataño deck and every
// corporate-structure division deck. Content comes in via `deck`; the gate
// password and a per-deck storage key are props so unlocking one deck never
// unlocks another. Not a security boundary — just keeps decks from being
// browsed by a stray click.

const ACCENT = "#ff5b2e"; // rocket orange, fixed regardless of tenant theme

function Rocket({ size = 22 }: { size?: number }) {
  // Canonical R0cketShip rocket-ship image (public/rocket.png).
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/rocket.png" width={size} height={size} alt="" aria-hidden className="inline-block shrink-0" style={{ objectFit: "contain" }} />;
}

function Gate({ brand, password, storageKey, gateKey, onPass }: { brand: string; password: string | string[]; storageKey: string; gateKey?: string; onPass: () => void }) {
  const [val, setVal] = useState("");
  const [err, setErr] = useState(false);
  const [mode, setMode] = useState<"enter" | "set">("enter");
  const [newPw, setNewPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasNiche, setHasNiche] = useState<boolean | null>(null);

  // Has someone already set an extra niche password for this deck? (Additive —
  // the built-in passwords always work regardless; this just gates whether we
  // offer to add one on first open.)
  useEffect(() => {
    if (!gateKey) return;
    fetch("/api/deck-gate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key: gateKey, op: "status" }) })
      .then((r) => r.json()).then((d) => setHasNiche(!!d.hasNiche)).catch(() => setHasNiche(true));
  }, [gateKey]);

  const pass = () => { try { sessionStorage.setItem(storageKey, "1"); } catch {} onPass(); };
  const clientMatch = (v: string) => (Array.isArray(password) ? password : [password]).some((p) => p.trim().toLowerCase() === v.trim().toLowerCase());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(false);
    if (clientMatch(val)) {
      // First opener of a deck that has no niche password yet → offer to add one.
      if (gateKey && hasNiche === false) { setMode("set"); return; }
      pass(); return;
    }
    // Not a built-in password — it may be a recipient-set niche password.
    if (gateKey) {
      setBusy(true);
      try {
        const r = await fetch("/api/deck-gate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key: gateKey, op: "verify", password: val }) });
        const d = await r.json();
        if (d.ok) { pass(); return; }
      } catch {} finally { setBusy(false); }
    }
    setErr(true);
  };

  const saveNiche = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gateKey || newPw.trim().length < 3) { pass(); return; }
    setBusy(true);
    try {
      await fetch("/api/deck-gate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key: gateKey, op: "set", password: newPw.trim() }) });
    } catch {} finally { setBusy(false); }
    pass();
  };

  return (
    <div className="grid min-h-[100dvh] place-items-center px-6">
      {mode === "enter" ? (
        <form onSubmit={submit} className="w-full max-w-sm text-center">
          <div className="mb-6 flex items-center justify-center gap-2">
            <Rocket size={28} />
            <span className="text-xl font-extrabold tracking-tight text-white">{brand}</span>
          </div>
          <p className="mb-6 text-sm text-white/55">Private presentation. Enter the password to continue.</p>
          <input
            autoFocus
            type="password"
            value={val}
            onChange={(e) => { setVal(e.target.value); setErr(false); }}
            placeholder="Password"
            className="w-full rounded-xl border bg-white/5 px-4 py-3 text-center text-white outline-none transition placeholder:text-white/30"
            style={{ borderColor: err ? "#e11d48" : "rgba(255,255,255,.16)" }}
          />
          {err && <p className="mt-3 text-sm" style={{ color: "#ff8ca3" }}>That's not it. Try again.</p>}
          <button type="submit" disabled={busy} className="mt-5 w-full rounded-xl py-3 font-bold text-white transition active:translate-y-px disabled:opacity-50" style={{ background: ACCENT }}>
            {busy ? "Checking…" : "Enter →"}
          </button>
        </form>
      ) : (
        <form onSubmit={saveNiche} className="w-full max-w-sm text-center">
          <div className="mb-6 flex items-center justify-center gap-2">
            <Rocket size={28} />
            <span className="text-xl font-extrabold tracking-tight text-white">{brand}</span>
          </div>
          <p className="mb-1.5 text-base font-bold text-white">Set a private password for this deck</p>
          <p className="mb-6 text-sm text-white/55">Optional — add a password unique to this presentation. The original access link still works; this just adds your own.</p>
          <input
            autoFocus
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="New password (min 3 characters)"
            className="w-full rounded-xl border bg-white/5 px-4 py-3 text-center text-white outline-none transition placeholder:text-white/30"
            style={{ borderColor: "rgba(255,255,255,.16)" }}
          />
          <button type="submit" disabled={busy} className="mt-5 w-full rounded-xl py-3 font-bold text-white transition active:translate-y-px disabled:opacity-50" style={{ background: ACCENT }}>
            {busy ? "Saving…" : "Set & continue →"}
          </button>
          <button type="button" onClick={pass} className="mt-3 w-full rounded-xl border py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/5" style={{ borderColor: "rgba(255,255,255,.16)" }}>
            Skip for now
          </button>
        </form>
      )}
    </div>
  );
}

function Cover({ deck, linkify }: { deck: Deck; linkify?: Linkify }) {
  const c = deck.cover;
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-7 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-white" style={{ background: "color-mix(in srgb, #ff5b2e 26%, transparent)" }}>
        <Rocket size={15} /> {c.tag}
      </div>
      <h1 className="font-serif-display flame-text mx-auto max-w-4xl text-5xl font-extrabold leading-[1.04] sm:text-7xl md:text-8xl">
        {c.title}{c.titleSub && <><br />{c.titleSub}</>}
      </h1>
      <p className="mx-auto mt-7 max-w-3xl text-xl text-white/75 sm:text-2xl">{lk(c.sub, linkify)}</p>
      <p className="mt-10 text-sm font-semibold tracking-wide text-white/45">{c.footer}</p>
      <p className="mt-12 animate-pulse text-xs text-white/35">Press → or click Next to begin</p>
    </div>
  );
}

function Closing({ deck }: { deck: Deck }) {
  const cl = deck.closing;
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col justify-center px-6 py-16 sm:px-12">
      <div className="mb-3 flex items-center gap-2 text-base font-semibold" style={{ color: ACCENT }}>
        <Rocket size={18} /> {cl.kicker}
      </div>
      <h2 className="font-serif-display flame-text text-4xl font-extrabold leading-tight sm:text-6xl lg:text-7xl">
        {cl.title}<br />{cl.titleSub}
      </h2>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {cl.steps.map((s) => (
          <div key={s.k} className="rounded-2xl border p-6" style={{ borderColor: "rgba(255,255,255,.12)", background: "rgba(255,255,255,.03)" }}>
            <div className="text-sm font-bold" style={{ color: ACCENT }}>{s.k}</div>
            <div className="mt-1 text-2xl font-bold text-white">{s.t}</div>
            <div className="mt-1 text-base text-white/65">{s.d}</div>
          </div>
        ))}
      </div>

      <p className="font-serif-display flame-text mt-14 flex flex-wrap items-center justify-center gap-3 text-center text-xl font-extrabold leading-tight sm:text-3xl">
        &ldquo;Every industry is a geek away from being Uberized.&rdquo; — R0cketShip <Rocket size={28} />
      </p>
    </div>
  );
}

function Chart({ bars }: { bars: NonNullable<Slide["chart"]> }) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <div className="mt-5 flex flex-col gap-2.5">
      {bars.map((b, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-32 shrink-0 text-right text-xs font-semibold text-white/65 sm:w-44 sm:text-sm">{b.label}</div>
          <div className="h-6 flex-1 overflow-hidden rounded-md" style={{ background: "rgba(255,255,255,.06)" }}>
            <div className="flex h-full items-center justify-end rounded-md px-2" style={{ width: `${Math.max((b.value / max) * 100, 8)}%`, background: `linear-gradient(90deg, color-mix(in srgb, ${ACCENT} 55%, transparent), ${ACCENT})` }}>
              <span className="text-xs font-bold text-white">{b.display}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

type Linkify = { term: string; href: string } | null | undefined;

/** Render text with every occurrence of `l.term` turned into a link to `l.href`. */
function lk(text: string, l: Linkify): React.ReactNode {
  if (!l || !text.includes(l.term)) return text;
  const parts = text.split(l.term);
  return parts.flatMap((part, i) =>
    i === 0
      ? [part]
      : [
          <a key={`l${i}`} href={l.href} className="font-semibold underline decoration-2 underline-offset-2 transition hover:opacity-80" style={{ color: ACCENT }}>{l.term}</a>,
          part,
        ],
  );
}

function SlideView({ s, anchor, linkify }: { s: Slide; anchor?: DeckAnchor | null; linkify?: Linkify }) {
  // Big, wide layout — fills the screen for presenting. Uses most of the viewport
  // width with larger type; still 2-column points so it fits without scrolling.
  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[88rem] flex-col justify-center px-6 py-8 sm:px-12 sm:py-10">
      <div className="pointer-events-none absolute right-2 top-4 select-none text-[18vw] font-black leading-none text-white/[0.03]">
        {s.n}
      </div>
      <div className="relative">
        <div className="flex items-center gap-3 text-base font-semibold" style={{ color: ACCENT }}>
          <span className="grid h-8 w-8 place-items-center rounded-full text-sm text-white" style={{ background: ACCENT }}>{s.n}</span>
          <span className="uppercase tracking-wide">{s.kicker}</span>
        </div>
        <h2 className="mt-5 max-w-6xl text-3xl font-extrabold leading-[1.1] text-white sm:text-5xl lg:text-6xl" style={{ textShadow: "0 2px 18px rgba(0,0,0,.6)" }}>{lk(s.title, linkify)}</h2>
        <p className="font-serif-display mt-5 max-w-5xl border-l-4 pl-5 text-lg italic leading-relaxed text-white/85 sm:text-2xl lg:text-3xl" style={{ borderColor: ACCENT }}>
          {lk(s.vision, linkify)}
        </p>
        {s.chart && <Chart bars={s.chart} />}
        {s.chartNote && <p className="mt-2 text-sm text-white/40">{s.chartNote}</p>}
        {s.viz && <VizChart viz={s.viz} />}
        {s.points.length > 0 && (
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {s.points.map((p, i) => (
              <div key={i} className="rounded-2xl border p-5 sm:p-6" style={{ borderColor: "rgba(255,255,255,.10)", background: "rgba(255,255,255,.025)" }}>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0"><Rocket size={20} /></span>
                  <div>
                    <div className="text-lg font-bold text-white sm:text-xl">{lk(p.q, linkify)}</div>
                    <div className="mt-1.5 text-base leading-relaxed text-white/75 sm:text-lg">{lk(p.a, linkify)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {s.footnote && (
          <p className="mt-6 max-w-5xl rounded-xl border p-4 text-sm leading-relaxed text-white/60 sm:text-base" style={{ borderColor: "rgba(255,255,255,.1)", background: "rgba(255,255,255,.03)" }}>
            {lk(s.footnote, linkify)}
          </p>
        )}
        {anchor && (
          <a href={anchor.href} className="mt-7 inline-flex items-center gap-2 text-sm font-bold" style={{ color: ACCENT }}>
            <Rocket size={15} /> {anchor.label}
          </a>
        )}
      </div>
    </div>
  );
}

function BonusSlide({ d }: { d: OperatingDeck }) {
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-4xl flex-col justify-center px-6 py-12 text-center">
      <div className="mb-3 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest" style={{ color: ACCENT }}>
        <Rocket size={16} /> Operating Entity Pitch Deck
      </div>
      <h2 className="font-serif-display flame-text mx-auto max-w-3xl text-3xl font-extrabold leading-tight sm:text-5xl">{d.title}</h2>
      {d.highlight && (
        <div className="mx-auto mt-5 inline-block rounded-full px-4 py-1.5 text-sm font-bold text-white" style={{ background: "color-mix(in srgb, #ff5b2e 24%, transparent)" }}>{d.highlight}</div>
      )}
      {d.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={d.imageUrl} alt="" className="mx-auto mt-6 max-h-56 rounded-2xl object-contain" />
      )}
      {d.description && <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">{d.description}</p>}
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <a href={d.pdfUrl} target="_blank" rel="noopener noreferrer" className="rounded-full px-8 py-4 text-lg font-bold text-white transition active:translate-y-px" style={{ background: ACCENT, boxShadow: "0 10px 30px -8px rgba(255,91,46,.6)" }}>Download the deck ↓</a>
        <a href={`mailto:jeff.cline@me.com?subject=${encodeURIComponent("Connect with Founder — " + d.title)}`} className="rounded-full border px-7 py-4 font-bold text-white transition hover:bg-white/5" style={{ borderColor: "rgba(255,255,255,.28)" }}>Connect with Founder</a>
      </div>
    </div>
  );
}

export function DeckViewer({ deck, password, storageKey, gateKey, bonus, anchor, linkify }: { deck: Deck; password: string | string[]; storageKey: string; gateKey?: string; bonus?: OperatingDeck | null; anchor?: DeckAnchor | null; linkify?: Linkify }) {
  const [ok, setOk] = useState(false);
  const [i, setI] = useState(0);
  const total = deck.slides.length + 2 + (bonus ? 1 : 0); // cover + sections + closing + optional bonus

  useEffect(() => {
    try { if (sessionStorage.getItem(storageKey) === "1") setOk(true); } catch {}
  }, [storageKey]);

  const go = useCallback((d: number) => setI((p) => Math.min(total - 1, Math.max(0, p + d))), [total]);

  useEffect(() => {
    if (!ok) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(-1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ok, go]);

  const shell = (children: React.ReactNode) => (
    <main className="grid-bg-dark relative min-h-[100dvh] overflow-hidden" style={{ background: "radial-gradient(120% 90% at 80% -10%, #161d2e, #0a0e17 60%)" }}>
      {children}
    </main>
  );

  if (!ok) return shell(<Gate brand={deck.brand} password={password} storageKey={storageKey} gateKey={gateKey} onPass={() => setOk(true)} />);

  const isCover = i === 0;
  const isBonus = !!bonus && i === total - 1;
  const isClosing = i === deck.slides.length + 1; // right after the last section
  const slide = !isCover && !isClosing && !isBonus ? deck.slides[i - 1] : null;

  return shell(
    <>
      {isCover ? <Cover deck={deck} linkify={linkify} /> : isBonus && bonus ? <BonusSlide d={bonus} /> : isClosing ? <Closing deck={deck} /> : slide ? <SlideView s={slide} anchor={anchor} linkify={linkify} /> : null}

      <div className="fixed inset-x-0 top-0 z-40 h-1" style={{ background: "rgba(255,255,255,.06)" }}>
        <div className="h-full transition-all duration-300" style={{ width: `${(i / (total - 1)) * 100}%`, background: ACCENT }} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between px-5 py-4 sm:px-8" style={{ background: "linear-gradient(180deg, transparent, rgba(10,14,23,.85))" }}>
        <button onClick={() => go(-1)} disabled={i === 0} className="rounded-full border px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-30" style={{ borderColor: "rgba(255,255,255,.18)", background: "rgba(255,255,255,.04)" }}>
          ← Back
        </button>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: total }).map((_, d) => (
            <button key={d} onClick={() => setI(d)} aria-label={`Go to slide ${d + 1}`} className="h-1.5 rounded-full transition-all" style={{ width: d === i ? 22 : 7, background: d === i ? ACCENT : "rgba(255,255,255,.22)" }} />
          ))}
        </div>
        <button onClick={() => go(1)} disabled={i === total - 1} className="rounded-full px-5 py-2.5 text-sm font-bold text-white transition active:translate-y-px disabled:opacity-30" style={{ background: ACCENT }}>
          Next →
        </button>
      </div>

      <div className="fixed right-5 top-4 z-40 text-xs font-semibold text-white/40 sm:right-8">{i + 1} / {total}</div>

      <HomeRocket corner="top-left" />
    </>
  );
}
