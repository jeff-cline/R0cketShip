"use client";

import { useState } from "react";

// Footer CONTACT column for the hub lander. Three of the links open an email
// popup that composes a preformatted message to Jeff; "Advertise with us" routes
// to /advertise. The popup builds a mailto: so it works with no backend and can
// never affect any white-label tenant.

const ACCENT = "#ff5b2e";
const TO = "jeff.cline@me.com";

type Fields = { name: string; company: string; work: string; cell: string; message: string; predictive: string };
const EMPTY: Fields = { name: "", company: "", work: "", cell: "", message: "", predictive: "" };

function buildMailto(title: string, f: Fields) {
  const subject = encodeURIComponent(title);
  const body = encodeURIComponent(
    [
      `Name: ${f.name}`,
      `Company name: ${f.company}`,
      `Work phone number: ${f.work}`,
      `Cell phone: ${f.cell}`,
      ``,
      `How can we serve you today?`,
      f.message,
      ``,
      `Business predictive data of interest:`,
      f.predictive,
      ``,
    ].join("\n")
  );
  return `mailto:${TO}?subject=${subject}&body=${body}`;
}

function RImg({ size = 14 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/rocket.png" width={size} height={size} alt="" aria-hidden className="inline-block shrink-0" style={{ objectFit: "contain" }} />;
}

export function HubContact() {
  const [open, setOpen] = useState<string | null>(null);
  const [f, setF] = useState<Fields>(EMPTY);

  const close = () => { setOpen(null); setF(EMPTY); };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!open) return;
    // Persist to the Business Leads CRM, then open the email notification.
    fetch("/api/business-lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source: open, name: f.name, company: f.company, workPhone: f.work, cellPhone: f.cell, message: f.message, predictive: f.predictive }),
    }).catch(() => {});
    window.location.href = buildMailto(open, f);
  };
  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  const popupLinks = ["Media & Press", "Join Our Team"];

  return (
    <>
      <ul className="flex flex-col gap-2.5 text-sm text-white/55">
        <li>
          <a href="/investor-portal" className="flex items-center gap-2 transition-colors hover:text-white">
            <RImg /> Investor Relations
          </a>
        </li>
        {popupLinks.map((t) => (
          <li key={t}>
            <button onClick={() => setOpen(t)} className="flex items-center gap-2 text-left transition-colors hover:text-white">
              <RImg /> {t}
            </button>
          </li>
        ))}
        <li>
          <a href="/advertise" className="flex items-center gap-2 transition-colors hover:text-white">
            <RImg /> Advertise With Us
          </a>
        </li>
      </ul>

      {open && (
        <div className="fixed inset-0 z-[60] grid place-items-center px-4" style={{ background: "rgba(4,6,10,.8)", backdropFilter: "blur(4px)" }} onClick={close}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="w-full max-w-md rounded-2xl border p-6"
            style={{ borderColor: "rgba(255,255,255,.14)", background: "linear-gradient(180deg,#11151f,#0a0e17)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-extrabold text-white"><RImg size={20} /> {open}</div>
              <button type="button" onClick={close} aria-label="Close" className="text-white/40 hover:text-white">✕</button>
            </div>
            <p className="mt-1 text-sm text-white/50">Tell us a little and we&apos;ll be in touch.</p>

            <div className="mt-4 grid gap-3">
              <input required value={f.name} onChange={set("name")} placeholder="Name" className="rounded-lg border bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30" style={{ borderColor: "rgba(255,255,255,.14)" }} />
              <input value={f.company} onChange={set("company")} placeholder="Company name" className="rounded-lg border bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30" style={{ borderColor: "rgba(255,255,255,.14)" }} />
              <div className="grid grid-cols-2 gap-3">
                <input value={f.work} onChange={set("work")} placeholder="Work phone" className="rounded-lg border bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30" style={{ borderColor: "rgba(255,255,255,.14)" }} />
                <input value={f.cell} onChange={set("cell")} placeholder="Cell phone" className="rounded-lg border bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30" style={{ borderColor: "rgba(255,255,255,.14)" }} />
              </div>
              <textarea value={f.message} onChange={set("message")} placeholder="How can we serve you today?" rows={3} className="rounded-lg border bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30" style={{ borderColor: "rgba(255,255,255,.14)" }} />
              <input value={f.predictive} onChange={set("predictive")} placeholder="Business predictive data of interest" className="rounded-lg border bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30" style={{ borderColor: "rgba(255,255,255,.14)" }} />
            </div>

            <button type="submit" className="mt-5 w-full rounded-xl py-3 font-bold text-white transition active:translate-y-px" style={{ background: ACCENT }}>
              Send →
            </button>
            <p className="mt-2 text-center text-xs text-white/35">Opens your email to {TO}</p>
          </form>
        </div>
      )}
    </>
  );
}
