"use client";

import { useEffect, useState } from "react";

const BLUE = "#0284c7";

// Consumer capture for cruise.plus — name + email for updates & special offers.
// Picks up ?ref=<crewPassCode> so the referring crew member earns points.
export function ConsumerSignup({ port }: { port?: string }) {
  const [f, setF] = useState({ name: "", email: "" });
  const [ref, setRef] = useState("");
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    try { setRef(new URLSearchParams(window.location.search).get("ref") || ""); } catch {}
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    fetch("/api/crew/consumer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: f.name, email: f.email, port, ref }) }).catch(() => {});
    setDone(true);
  };

  if (done) {
    return (
      <div className="rounded-2xl border bg-white p-6 text-center shadow-sm" style={{ borderColor: "#e2e8f0" }}>
        <div className="text-2xl font-extrabold" style={{ color: "#0a0e17" }}>You're in! 🎉</div>
        <p className="mt-2 text-sm" style={{ color: "#64748b" }}>We&apos;ll send your local discounts and special offers{port ? ` for ${port.split(",")[0]}` : ""}.</p>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: "#e2e8f0" }}>
      <div className="text-lg font-extrabold" style={{ color: "#0a0e17" }}>Unlock local discounts</div>
      <p className="mt-1 text-sm" style={{ color: "#64748b" }}>Free. Get exclusive deals & offers{port ? ` in ${port.split(",")[0]}` : " at every port"}.</p>
      {ref && <p className="mt-1 text-xs font-semibold" style={{ color: BLUE }}>🎁 You were invited by crew — welcome aboard.</p>}
      <div className="mt-4 grid gap-2.5">
        <input required value={f.name} onChange={set("name")} placeholder="Name" className="rounded-lg border px-3 py-2.5 text-sm outline-none" style={{ borderColor: "#cbd5e1" }} />
        <input required type="email" value={f.email} onChange={set("email")} placeholder="Email" className="rounded-lg border px-3 py-2.5 text-sm outline-none" style={{ borderColor: "#cbd5e1" }} />
      </div>
      <button type="submit" className="mt-4 w-full rounded-xl py-3 font-bold text-white transition active:translate-y-px" style={{ background: BLUE }}>Get my discounts →</button>
    </form>
  );
}
