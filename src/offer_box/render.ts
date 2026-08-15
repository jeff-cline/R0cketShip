/**
 * Server-side HTML renderer for an offer box.
 *
 * The output is a single self-contained HTML string:
 *   - `variant: "default"` and `"minimal"` — modern flex/grid layout, dark
 *     r0cketship theme, suitable for iframe / JS-loader embedding on the open
 *     web. Inline styles only (no external CSS, no JS).
 *   - `variant: "email"` — table-based markup, no flex/grid, conservative
 *     CSS that survives Outlook + Gmail + Klaviyo's HTML scrubbers.
 *
 * Every CTA points at `${base}/c/obx/${boxKey}/${offer.offerId}` so click
 * attribution always flows through the platform; we never bake the raw
 * `offer.ctaUrl` into the embed.
 *
 * The renderer is pure — no DB access, no auth, safe to call anywhere.
 */
import type { BoxOffer } from "./select";

export type RenderVariant = "default" | "minimal" | "email";

export interface RenderOpts {
  variant?: RenderVariant;
  /** When true the renderer returns a body-only fragment (no <html>/<body>
   *  wrapper) — used by the JS-loader endpoint that injects into a host div. */
  fragment?: boolean;
}

const ACCENT = "#ff6b35";
const BG = "#0b1020";
const SURFACE = "#141a30";
const SURFACE_2 = "#1c2440";
const LINE = "#2a335a";
const INK = "#f5f7ff";
const INK_2 = "#c5cae8";
const MUTED = "#8089b3";

/** Minimal HTML-escape so user-supplied offer copy can't break the markup. */
function esc(s: string | null | undefined): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function clickUrl(base: string, boxKey: string, offerId: string): string {
  // base may already end with /; normalize.
  const b = base.replace(/\/+$/, "");
  return `${b}/c/obx/${encodeURIComponent(boxKey)}/${encodeURIComponent(offerId)}`;
}

function renderCard(offer: BoxOffer, href: string): string {
  const logo = offer.logoUrl
    ? `<img src="${esc(offer.logoUrl)}" alt="${esc(offer.brand)}" style="width:36px;height:36px;border-radius:8px;object-fit:cover;background:${SURFACE_2};" />`
    : `<div style="width:36px;height:36px;border-radius:8px;background:${SURFACE_2};display:flex;align-items:center;justify-content:center;color:${ACCENT};font-weight:800;font-size:14px;font-family:Inter,Helvetica,Arial,sans-serif;">${esc(offer.brand.slice(0, 1).toUpperCase())}</div>`;
  return `
<div style="display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:14px;background:${SURFACE};border:1px solid ${LINE};font-family:Inter,Helvetica,Arial,sans-serif;color:${INK};">
  <div style="display:flex;align-items:center;gap:10px;">
    ${logo}
    <div style="display:flex;flex-direction:column;line-height:1.1;">
      <span style="font-size:13px;font-weight:700;color:${INK};">${esc(offer.brand)}</span>
      <span style="font-size:11px;color:${MUTED};text-transform:uppercase;letter-spacing:.04em;">${esc(offer.tenantNiche)}</span>
    </div>
  </div>
  <div style="font-size:14px;font-weight:600;color:${INK};line-height:1.3;">${esc(offer.title)}</div>
  <div style="font-size:13px;color:${INK_2};line-height:1.45;">${esc(offer.description)}</div>
  <a href="${esc(href)}" target="_blank" rel="noopener noreferrer sponsored" style="margin-top:auto;display:inline-block;text-align:center;padding:9px 14px;border-radius:10px;background:${ACCENT};color:#fff;font-size:13px;font-weight:700;text-decoration:none;">See offer →</a>
</div>`.trim();
}

function renderEmailRow(offer: BoxOffer, href: string): string {
  // Table layout, Outlook-safe. We avoid background-image, flex, and CSS grid.
  const logoCell = offer.logoUrl
    ? `<img src="${esc(offer.logoUrl)}" alt="${esc(offer.brand)}" width="48" height="48" style="display:block;border-radius:8px;border:0;outline:none;text-decoration:none;" />`
    : `<div style="width:48px;height:48px;line-height:48px;text-align:center;border-radius:8px;background:#eef0fb;color:${ACCENT};font-weight:700;font-family:Arial,sans-serif;font-size:18px;">${esc(offer.brand.slice(0, 1).toUpperCase())}</div>`;
  return `
<tr>
  <td style="padding:12px 0;">
    <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%" style="border-collapse:collapse;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;">
      <tr>
        <td style="padding:16px;vertical-align:top;width:64px;">${logoCell}</td>
        <td style="padding:16px 16px 16px 0;vertical-align:top;font-family:Arial,Helvetica,sans-serif;color:#0b1020;">
          <div style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;">${esc(offer.brand)} · ${esc(offer.tenantNiche)}</div>
          <div style="font-size:16px;font-weight:700;color:#0b1020;margin:4px 0 6px;">${esc(offer.title)}</div>
          <div style="font-size:14px;color:#374151;line-height:1.45;">${esc(offer.description)}</div>
          <div style="margin-top:12px;">
            <a href="${esc(href)}" target="_blank" rel="noopener noreferrer sponsored" style="display:inline-block;padding:10px 16px;border-radius:8px;background:${ACCENT};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;font-family:Arial,Helvetica,sans-serif;">See offer →</a>
          </div>
        </td>
      </tr>
    </table>
  </td>
</tr>`.trim();
}

function wrap(inner: string, fragment: boolean): string {
  if (fragment) return inner;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><meta name="robots" content="noindex" /><title>Offer box</title></head><body style="margin:0;padding:0;background:${BG};">${inner}</body></html>`;
}

export function renderBoxHtml(
  offers: BoxOffer[],
  base: string,
  boxKey: string,
  opts: RenderOpts = {},
): string {
  const variant: RenderVariant = opts.variant ?? "default";
  const fragment = opts.fragment ?? false;

  if (offers.length === 0) {
    const empty = `<div style="padding:20px;font-family:Inter,Helvetica,Arial,sans-serif;color:${MUTED};font-size:13px;text-align:center;">No offers available right now.</div>`;
    return wrap(`<div style="padding:16px;background:${BG};">${empty}</div>`, fragment);
  }

  if (variant === "email") {
    const rows = offers
      .map((o) => renderEmailRow(o, clickUrl(base, boxKey, o.offerId)))
      .join("");
    const inner = `
<table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%" style="border-collapse:collapse;max-width:600px;margin:0 auto;">
  ${rows}
  <tr>
    <td style="padding:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#9ca3af;text-align:center;">Powered by r0cketship</td>
  </tr>
</table>`.trim();
    // Email "wrapper" stays light-themed; never wrap in a dark body.
    if (fragment) return inner;
    return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Offer box</title></head><body style="margin:0;padding:0;background:#f9fafb;">${inner}</body></html>`;
  }

  // default / minimal
  const cols = Math.min(offers.length, 3);
  const gridStyle =
    variant === "minimal"
      ? `display:flex;flex-direction:column;gap:10px;`
      : `display:grid;grid-template-columns:repeat(${cols}, minmax(0, 1fr));gap:12px;`;
  const cards = offers
    .map((o) => renderCard(o, clickUrl(base, boxKey, o.offerId)))
    .join("");
  const inner = `
<div style="padding:16px;background:${BG};">
  <div style="${gridStyle}max-width:920px;margin:0 auto;">
    ${cards}
  </div>
  <div style="margin-top:10px;text-align:center;font-family:Inter,Helvetica,Arial,sans-serif;font-size:10px;color:${MUTED};">Powered by r0cketship</div>
</div>`.trim();
  return wrap(inner, fragment);
}
