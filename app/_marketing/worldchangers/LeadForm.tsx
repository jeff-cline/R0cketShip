"use client";

import { useState } from "react";

const TEAL = "#0d7377";

type Fields = { name: string; company: string; email: string; work: string; cell: string; message: string; predictive: string };
const EMPTY: Fields = { name: "", company: "", email: "", work: "", cell: "", message: "", predictive: "" };

// Leads POST to the core's /api/business-lead so god accounts (Jeff + Krystalore)
// see them in the CRM and both get the new-lead email notification.
export function LeadForm() {
  const [f, setF] = useState<Fields>(EMPTY);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/business-lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          source: "worldchangers",
          name: f.name, company: f.company, email: f.email,
          workPhone: f.work, cellPhone: f.cell, message: f.message, predictive: f.predictive,
        }),
      });
      setState(res.ok ? "done" : "error");
      if (res.ok) setF(EMPTY);
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="card p-8 text-center">
        <div className="text-3xl">🚀</div>
        <h3 className="mt-2 text-xl font-extrabold">You're in. We'll be in touch.</h3>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Krystalore &amp; Jeff both got your note.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card grid gap-3 p-6 sm:grid-cols-2">
      <input required value={f.name} onChange={set("name")} placeholder="Name" className="input" />
      <input value={f.company} onChange={set("company")} placeholder="Company" className="input" />
      <input type="email" value={f.email} onChange={set("email")} placeholder="Email" className="input" />
      <input value={f.work} onChange={set("work")} placeholder="Work phone" className="input" />
      <input value={f.cell} onChange={set("cell")} placeholder="Cell phone" className="input" />
      <input value={f.predictive} onChange={set("predictive")} placeholder="Predictive data of interest" className="input" />
      <textarea value={f.message} onChange={set("message")} placeholder="How can we serve you today?" rows={3} className="input sm:col-span-2" />
      <div className="sm:col-span-2 flex items-center gap-3">
        <button disabled={state === "sending"} className="btn btn-primary" style={{ background: TEAL }}>
          {state === "sending" ? "Sending…" : "Talk to us →"}
        </button>
        {state === "error" && <span className="text-sm" style={{ color: "var(--neg)" }}>Something went wrong — try again.</span>}
      </div>
    </form>
  );
}
