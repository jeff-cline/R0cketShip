"use client";

import { useState } from "react";

const ORANGE = "#ff5b2e";
const TEAL = "#0e9aa7";

// "Show my pass" → create a crew account (or recognize a returning one) → display
// a QR + paper pass tied to the account holder. Logs a pass-shown event so the
// perk redemption tracks back to the crew member and the merchant.
export function ShowPass({ merchantId, merchantName, perk }: { merchantId: string; merchantName: string; perk?: string | null }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"form" | "pass">("form");
  const [f, setF] = useState({ name: "", email: "", ship: "" });
  const [pass, setPass] = useState<{ code: string; name: string | null }>({ code: "", name: null });
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  const logShow = (code: string) => {
    fetch("/api/crew/pass", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ passCode: code, merchantId }) }).catch(() => {});
  };

  const launch = () => {
    setOpen(true);
    let code = "", name: string | null = null;
    try { code = localStorage.getItem("crewperk_pass") || ""; name = localStorage.getItem("crewperk_name"); } catch {}
    if (code) { setPass({ code, name }); setMode("pass"); logShow(code); }
    else setMode("form");
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch("/api/crew/account", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
      const d = await r.json();
      if (d.passCode) {
        try { localStorage.setItem("crewperk_pass", d.passCode); if (d.name) localStorage.setItem("crewperk_name", d.name); } catch {}
        setPass({ code: d.passCode, name: d.name ?? f.name });
        setMode("pass");
        logShow(d.passCode);
      }
    } catch {}
    setBusy(false);
  };

  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent("CREWPERK-PASS:" + pass.code)}`;

  return (
    <>
      <button onClick={launch} className="rounded-full px-5 py-2.5 text-sm font-bold text-white" style={{ background: ORANGE }}>Show my pass</button>

      {open && (
        <div className="fixed inset-0 z-[70] grid place-items-center px-4" style={{ background: "rgba(10,14,23,.55)", backdropFilter: "blur(3px)" }} onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <button onClick={() => setOpen(false)} aria-label="Close" className="float-right text-xl leading-none" style={{ color: "#8b97ad" }}>×</button>
            {mode === "form" ? (
              <form onSubmit={create} className="text-left">
                <div className="text-lg font-extrabold" style={{ color: "#0a0e17" }}>Create your free crew pass</div>
                <p className="mt-1 text-sm" style={{ color: "#61708a" }}>One pass unlocks every perk at every port. Show it to claim <b>{perk}</b>.</p>
                <div className="mt-4 grid gap-2.5">
                  <input required value={f.name} onChange={set("name")} placeholder="Name" className="rounded-lg border px-3 py-2.5 text-sm outline-none" style={{ borderColor: "#d3dae6" }} />
                  <input required type="email" value={f.email} onChange={set("email")} placeholder="Email" className="rounded-lg border px-3 py-2.5 text-sm outline-none" style={{ borderColor: "#d3dae6" }} />
                  <input value={f.ship} onChange={set("ship")} placeholder="Ship (optional)" className="rounded-lg border px-3 py-2.5 text-sm outline-none" style={{ borderColor: "#d3dae6" }} />
                </div>
                <button type="submit" disabled={busy} className="mt-4 w-full rounded-xl py-3 font-bold text-white disabled:opacity-50" style={{ background: ORANGE }}>{busy ? "Creating…" : "Create pass & show QR →"}</button>
                <p className="mt-2 text-center text-[11px]" style={{ color: "#8b97ad" }}>Free for crew. Not affiliated with any cruise line.</p>
              </form>
            ) : (
              <div>
                <div className="text-xs font-bold uppercase tracking-widest" style={{ color: TEAL }}>CrewPerk Pass</div>
                <div className="mt-1 text-lg font-extrabold" style={{ color: "#0a0e17" }}>{pass.name ?? "Crew member"}</div>
                <div className="mx-auto mt-3 w-fit rounded-2xl border-2 border-dashed p-3" style={{ borderColor: ORANGE }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qr} alt="Your CrewPerk QR pass" width={200} height={200} />
                </div>
                <div className="mt-3 rounded-lg px-3 py-2 text-sm font-bold" style={{ background: "#fff6f2", color: ORANGE }}>🎁 {perk} · {merchantName}</div>
                <div className="mt-2 text-xs font-mono" style={{ color: "#61708a" }}>{pass.code}</div>
                <p className="mt-3 text-xs" style={{ color: "#8b97ad" }}>Show this QR (or the code) to staff to redeem. Tracks to your account across every port.</p>
                <button onClick={() => window.print()} className="mt-3 w-full rounded-xl border-2 py-2.5 text-sm font-bold" style={{ borderColor: ORANGE, color: ORANGE }}>Print paper pass</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
