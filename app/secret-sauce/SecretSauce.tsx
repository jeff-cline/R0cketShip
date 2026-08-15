"use client";

import { useEffect, useState } from "react";

const ACCENT = "#ff5b2e";
const FOUNDER_EMAIL = "jeff.cline@me.com";
const VIDEO_SRC = "/uploads/secret-sauce.mp4";
const VIDEO_POSTER = "/uploads/secret-sauce-poster.jpg";
const GATE_PASSWORD = "jeffcline";

function Rocket({ size = 22, className = "" }: { size?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/rocket.png" width={size} height={size} alt="" aria-hidden className={`inline-block shrink-0 ${className}`} style={{ objectFit: "contain" }} />;
}

/** The video player with a big rocket + play button. Hitting play launches the
 *  rocket up off-screen, then the self-hosted video autoplays. */
function RocketPlayer({ src, poster }: { src: string; poster: string }) {
  const [launching, setLaunching] = useState(false);
  const [playing, setPlaying] = useState(false);

  const launch = () => {
    if (launching || playing) return;
    setLaunching(true);
    window.setTimeout(() => setPlaying(true), 1150);
  };

  return (
    <div className="relative mx-auto aspect-video w-full max-w-4xl overflow-hidden rounded-2xl border" style={{ borderColor: "rgba(255,255,255,.14)", boxShadow: "0 30px 90px -30px rgba(255,91,46,.45)" }}>
      {playing ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          className="absolute inset-0 h-full w-full bg-black"
          src={src}
          poster={poster}
          controls
          autoPlay
          playsInline
        />
      ) : (
        <button
          type="button"
          onClick={launch}
          aria-label="Play the video"
          className="group absolute inset-0 h-full w-full cursor-pointer"
          style={{ backgroundImage: `linear-gradient(180deg, rgba(10,14,23,.35), rgba(10,14,23,.78)), url(${poster})`, backgroundSize: "cover", backgroundPosition: "center" }}
        >
          {/* Flame trail — only visible during launch */}
          <span className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 ${launching ? "ss-flame" : "opacity-0"}`} aria-hidden />
          {/* The rocket */}
          <span className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${launching ? "ss-launch" : "ss-idle"}`} aria-hidden>
            <Rocket size={108} />
          </span>
          {/* Play chip */}
          <span className={`pointer-events-none absolute left-1/2 top-[calc(50%+74px)] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ${launching ? "opacity-0" : "opacity-100"}`}>
            <span className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-lg" style={{ background: ACCENT }}>
              ▶ Play
            </span>
          </span>
        </button>
      )}
    </div>
  );
}

interface FormState {
  firstName: string; lastName: string; businessName: string; website: string; phone: string; email: string; comments: string;
}
const EMPTY: FormState = { firstName: "", lastName: "", businessName: "", website: "", phone: "", email: "", comments: "" };

function ContactModal({ onClose }: { onClose: () => void }) {
  const [f, setF] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    // 1) Persist the lead in our database (never block the user on it).
    try {
      await fetch("/api/secret-sauce", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
    } catch {}
    // 2) Pop a pre-formatted email to the founder so they can add notes and send.
    const subject = `Secret Sauce inquiry — ${f.businessName || `${f.firstName} ${f.lastName}`.trim()}`;
    const body =
      `First name: ${f.firstName}\n` +
      `Last name: ${f.lastName}\n` +
      `Business name: ${f.businessName}\n` +
      `Website: ${f.website}\n` +
      `Phone: ${f.phone}\n` +
      `Email: ${f.email}\n\n` +
      `Comments:\n${f.comments}\n\n` +
      `— Add any other notes above this line and hit send —`;
    window.location.href = `mailto:${FOUNDER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
    setBusy(false);
  };

  const inputCls = "w-full rounded-xl border bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-white/40";
  const inputStyle = { borderColor: "rgba(255,255,255,.16)" } as const;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-4 py-8" style={{ background: "rgba(5,8,14,.78)" }} onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border p-6 sm:p-8" style={{ borderColor: "rgba(255,255,255,.14)", background: "linear-gradient(180deg,#11151f,#0a0e17)" }} onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket size={22} />
            <span className="text-lg font-extrabold text-white">Contact the Founder</span>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg px-2 py-1 text-xl text-white/50 transition hover:text-white">×</button>
        </div>

        {sent ? (
          <div className="py-8 text-center">
            <div className="mb-3 text-4xl">🚀</div>
            <h3 className="text-xl font-bold text-white">You're in.</h3>
            <p className="mt-2 text-sm text-white/65">Your details were saved and an email to Jeff just opened — add any extra notes and hit send. He'll be in touch about the Secret Sauce.</p>
            <button onClick={onClose} className="mt-6 rounded-xl px-6 py-3 font-bold text-white transition active:translate-y-px" style={{ background: ACCENT }}>Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input required value={f.firstName} onChange={set("firstName")} placeholder="First name" className={inputCls} style={inputStyle} />
              <input required value={f.lastName} onChange={set("lastName")} placeholder="Last name" className={inputCls} style={inputStyle} />
            </div>
            <input required value={f.businessName} onChange={set("businessName")} placeholder="Business name" className={inputCls} style={inputStyle} />
            <input value={f.website} onChange={set("website")} placeholder="Website" className={inputCls} style={inputStyle} />
            <div className="grid grid-cols-2 gap-3">
              <input required type="tel" value={f.phone} onChange={set("phone")} placeholder="Phone number" className={inputCls} style={inputStyle} />
              <input required type="email" value={f.email} onChange={set("email")} placeholder="Email address" className={inputCls} style={inputStyle} />
            </div>
            <textarea value={f.comments} onChange={set("comments")} placeholder="Comments" rows={4} className={inputCls} style={inputStyle} />
            <button type="submit" disabled={busy} className="w-full rounded-xl py-3.5 text-base font-bold text-white transition active:translate-y-px disabled:opacity-50" style={{ background: ACCENT, boxShadow: "0 12px 30px -10px rgba(255,91,46,.6)" }}>
              {busy ? "Sending…" : "Send to Founder →"}
            </button>
            <p className="text-center text-xs text-white/40">Your info is saved and an email to Jeff opens so you can add notes.</p>
          </form>
        )}
      </div>
    </div>
  );
}

function SauceGate({ onPass }: { onPass: () => void }) {
  const [val, setVal] = useState("");
  const [err, setErr] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (val.trim().toLowerCase() === GATE_PASSWORD) {
      try { sessionStorage.setItem("ss-ok", "1"); } catch {}
      onPass();
    } else { setErr(true); }
  };
  return (
    <main className="grid-bg-dark grid min-h-[100dvh] place-items-center px-6" style={{ background: "radial-gradient(120% 90% at 80% -10%, #161d2e, #0a0e17 60%)" }}>
      <form onSubmit={submit} className="w-full max-w-sm text-center">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Rocket size={28} />
          <span className="text-xl font-extrabold tracking-tight text-white">The Secret Sauce</span>
        </div>
        <p className="mb-6 text-sm text-white/55">Private. Enter the password to continue.</p>
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
        <button type="submit" className="mt-5 w-full rounded-xl py-3 font-bold text-white transition active:translate-y-px" style={{ background: ACCENT }}>Enter →</button>
      </form>
    </main>
  );
}

export function SecretSauce() {
  const [open, setOpen] = useState(false);
  const [ok, setOk] = useState(false);
  useEffect(() => { try { if (sessionStorage.getItem("ss-ok") === "1") setOk(true); } catch {} }, []);
  if (!ok) return <SauceGate onPass={() => setOk(true)} />;
  return (
    <main className="grid-bg-dark relative min-h-[100dvh] overflow-hidden" style={{ background: "radial-gradient(120% 90% at 80% -10%, #161d2e, #0a0e17 60%)" }}>
      <style>{`
        .ss-idle { animation: ssBob 3s ease-in-out infinite; }
        @keyframes ssBob { 0%,100% { transform: translate(-50%, -50%); } 50% { transform: translate(-50%, calc(-50% - 8px)); } }
        .ss-launch { animation: ssLaunch 1.15s cubic-bezier(.5,0,.4,1) forwards; }
        @keyframes ssLaunch {
          0%   { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
          12%  { transform: translate(-50%, calc(-50% + 10px)) scale(.94) rotate(-2deg); }
          30%  { transform: translate(-50%, calc(-50% - 30px)) scale(1) rotate(-1deg); }
          100% { transform: translate(-50%, -150vh) scale(.55) rotate(6deg); opacity: 0; }
        }
        .ss-flame { animation: ssFlame 1.15s ease-in forwards; width: 46px; transform-origin: top center; }
        @keyframes ssFlame {
          0%   { opacity: 0; height: 0; transform: translate(-50%, 36px); }
          18%  { opacity: 1; height: 70px; }
          55%  { opacity: 1; height: 150px; transform: translate(-50%, 18px); }
          100% { opacity: 0; height: 320px; transform: translate(-50%, -40vh); }
        }
        .ss-flame { background: linear-gradient(180deg, #fff7d6 0%, #ffc24d 22%, #ff7a2e 55%, rgba(255,91,46,0) 100%); border-radius: 50% 50% 40% 40% / 60% 60% 100% 100%; filter: blur(3px); }
      `}</style>

      {/* Brand mark */}
      <header className="relative z-10 flex items-center gap-2.5 px-6 py-5 sm:px-10">
        <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: ACCENT }}><Rocket size={16} /></span>
        <span className="text-sm font-extrabold tracking-tight text-white">r<span style={{ color: ACCENT }}>0</span>cketship</span>
      </header>

      <section className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pb-24 pt-6 text-center sm:pt-10">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-white" style={{ background: "color-mix(in srgb, #ff5b2e 26%, transparent)" }}>
          <Rocket size={14} /> By invitation · The Secret Sauce
        </div>
        <h1 className="font-serif-display flame-text text-5xl font-extrabold leading-[1.04] sm:text-7xl md:text-8xl">The Secret Sauce</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70 sm:text-xl">How R0cketShip turns any niche into a category-defining machine. Hit the rocket to play.</p>

        <div className="mt-10 w-full">
          <RocketPlayer src={VIDEO_SRC} poster={VIDEO_POSTER} />
        </div>

        <div className="mt-16 flex flex-col items-center">
          <p className="mb-5 max-w-xl text-base text-white/65 sm:text-lg">Ready to put the Secret Sauce to work in your business?</p>
          <button onClick={() => setOpen(true)} className="rounded-full px-9 py-5 text-lg font-extrabold text-white transition active:translate-y-px sm:text-xl" style={{ background: ACCENT, boxShadow: "0 16px 44px -12px rgba(255,91,46,.7)" }}>
            Contact Founder for Secret Sauce →
          </button>
          <a href={`mailto:${FOUNDER_EMAIL}`} className="mt-4 text-sm font-semibold text-white/45 underline-offset-4 hover:underline">{FOUNDER_EMAIL}</a>
        </div>
      </section>

      {open && <ContactModal onClose={() => setOpen(false)} />}
    </main>
  );
}
