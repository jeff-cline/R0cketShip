import type { OutreachOffer } from "./offers";

/** A readable brand label from a domain, e.g. "roofers.co" → "Roofers". */
export function brandFromDomain(domain: string): string {
  const base = domain.replace(/^www\./, "").split(".")[0] ?? domain;
  return base.charAt(0).toUpperCase() + base.slice(1);
}

// Spam-safe, non-salesy subjects. {brand} and {title} are interpolated.
export const SUBJECTS = [
  "A quick note from {brand}",
  "{title}",
  "Something you might find useful",
  "{brand}: worth a look",
  "Quick question for you",
];

/** Deterministic subject pick so the same recipient/token always gets the same subject. */
export function pickSubject(seed: string, vars: { brand: string; title: string }): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const tmpl = SUBJECTS[h % SUBJECTS.length];
  return tmpl.replace(/\{brand\}/g, vars.brand).replace(/\{title\}/g, vars.title);
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export interface RenderInput {
  offer: Pick<OutreachOffer, "logoUrl" | "title" | "description" | "ctaUrl">;
  brand: string;
  baseUrl: string; // tenant origin, e.g. https://roofers.co
  clickToken: string;
  address: string; // physical mailing address for CAN-SPAM footer
}

export function renderOutreach(input: RenderInput): { subject: string; html: string } {
  const base = input.baseUrl.replace(/\/$/, "");
  const cta = `${base}/c/${input.clickToken}`;
  const unsub = `${base}/u/${input.clickToken}`;
  const subject = pickSubject(input.clickToken, { brand: input.brand, title: input.offer.title });
  const logo = input.offer.logoUrl
    ? `<tr><td style="padding-bottom:16px"><img src="${esc(input.offer.logoUrl)}" alt="${esc(input.brand)}" height="40" style="max-height:40px;border:0"/></td></tr>`
    : "";

  const html = `<!doctype html><html><body style="margin:0;background:#f5f6f8;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8;padding:24px 0">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;padding:32px">
${logo}
<tr><td style="font-size:21px;font-weight:bold;line-height:1.3;padding-bottom:12px">${esc(input.offer.title)}</td></tr>
<tr><td style="font-size:15px;line-height:1.6;color:#333;padding-bottom:24px">${esc(input.offer.description)}</td></tr>
<tr><td style="padding-bottom:8px"><a href="${cta}" style="display:inline-block;background:#0e7490;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:13px 26px;border-radius:8px">Learn more →</a></td></tr>
</table>
<table role="presentation" width="560" cellpadding="0" cellspacing="0"><tr><td style="padding:18px 32px;font-size:12px;line-height:1.6;color:#888;text-align:center">
${esc(input.brand)} · ${esc(input.address)}<br/>
You received this because your information was provided to ${esc(input.brand)}.
<a href="${unsub}" style="color:#888;text-decoration:underline">Unsubscribe</a>
</td></tr></table>
</td></tr></table></body></html>`;

  return { subject, html };
}
