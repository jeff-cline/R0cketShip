"use server";
/**
 * AEOS access requests.
 *
 * The deck sits behind a password for people who already have one. Everyone
 * else asks for access here, and Jeff gets an email the moment they do — that
 * notification is the whole point of the form, so it runs before anything
 * optional and never throws into the page.
 */
import { headers } from "next/headers";
import { coreEmail, coreLead, coreConfigured } from "@/src/core-api/client";

const NOTIFY = "jeff.cline@me.com";

export type AccessState = { ok: boolean; error: string | null };

const FREE_MAIL = new Set([
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com",
  "icloud.com", "me.com", "proton.me", "protonmail.com", "live.com", "msn.com",
]);

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

export async function requestAccess(_prev: AccessState, form: FormData): Promise<AccessState> {
  const name = String(form.get("name") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const company = String(form.get("company") ?? "").trim();
  const industry = String(form.get("industry") ?? "").trim();
  const aws = String(form.get("aws") ?? "").trim();
  const awsDetail = String(form.get("awsDetail") ?? "").trim();
  const note = String(form.get("note") ?? "").trim();
  // Bots fill everything; a hidden field they cannot see stops most of them.
  const trap = String(form.get("website") ?? "").trim();

  if (trap) return { ok: true, error: null }; // silently accept and drop
  if (!name) return { ok: false, error: "Please give us your name." };
  if (!phone) return { ok: false, error: "Please give us a number we can reach you on." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) return { ok: false, error: "That email address does not look right." };

  const domain = email.split("@")[1] ?? "";
  if (FREE_MAIL.has(domain)) {
    return { ok: false, error: "Please use your business email address — this deck goes out to companies, not inboxes." };
  }

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown";
  const ua = (h.get("user-agent") ?? "").slice(0, 180);
  const when = new Date().toISOString().replace("T", " ").slice(0, 19);

  const rows: [string, string][] = [
    ["Name", name],
    ["Company", company || "—"],
    ["Business email", email],
    ["Phone", phone],
    ["Industry", industry || "—"],
    ["Runs on AWS", aws || "—"],
    ["AWS detail", awsDetail || "—"],
    ["Note", note || "—"],
    ["Requested", `${when} UTC`],
    ["IP", ip],
  ];

  const html = `<div style="background:#0a0e17;padding:26px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif">
<div style="max-width:620px;margin:0 auto;background:#111726;border:1px solid #232c42;border-radius:14px;overflow:hidden">
  <div style="background:linear-gradient(120deg,#ff5b2e,#ff8a4b);padding:18px 24px">
    <div style="color:#fff;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:800">AEOS · Access requested</div>
    <div style="color:#fff;font-size:21px;font-weight:800;margin-top:4px">${esc(name)}${company ? ` — ${esc(company)}` : ""}</div>
  </div>
  <div style="padding:22px 24px">
    <table style="width:100%;border-collapse:collapse">
      ${rows.map(([k, v]) => `<tr>
        <td style="padding:7px 16px 7px 0;color:#7d8aa3;font-size:13px;vertical-align:top;white-space:nowrap">${esc(k)}</td>
        <td style="padding:7px 0;color:#e8edf7;font-size:14.5px"><b>${esc(v)}</b></td></tr>`).join("")}
    </table>
    <div style="margin-top:18px;padding-top:14px;border-top:1px solid #232c42;color:#5d6b85;font-size:11.5px">
      ${esc(ua)}
    </div>
  </div>
</div></div>`;

  const subject = `[AEOS] Access requested — ${name}${company ? ` · ${company}` : ""}`;

  if (coreConfigured()) {
    // The notification is the product here. Send it first, and do not let a
    // CRM hiccup stop the visitor getting their confirmation.
    await coreEmail({ to: NOTIFY, subject, html }).catch(() => null);
    void coreLead({
      name,
      email,
      phone,
      creatorRef: "aeos",
      notes: `AEOS access request. Company: ${company || "—"}. Industry: ${industry || "—"}. AWS: ${aws || "—"} ${awsDetail}. ${note}`.slice(0, 900),
    }).catch(() => null);
  } else {
    // Nothing configured — still make the request visible in the server log
    // rather than swallowing it.
    console.warn("[AEOS] access request (core not configured):", JSON.stringify(Object.fromEntries(rows)));
  }

  return { ok: true, error: null };
}
