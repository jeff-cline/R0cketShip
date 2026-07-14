/**
 * Phase 2: render an advertiser ad into a deliverable email.
 *
 * Mirrors `src/outreach/render.ts` (Phase 1) so advertiser ads ride the same
 * deliverability footprint (CAN-SPAM footer, unsubscribe link via the global
 * `email_suppression` table, plain-HTML compatibility).
 */

const CAN_SPAM_FOOTER_HEIGHT_PX = 0;

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Strip any constructs that could leak past DOMPurify's net or that would
 * break in mail clients. Defense in depth: the campaign module sanitizes at
 * write time, but we re-run a minimal pass at render time.
 */
function sanitizeForEmail(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/\s*on[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\s*on[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

export interface RenderAdInput {
  campaign: {
    emailSubject: string;
    emailBodyHtml: string;
    ctaLabel: string;
  };
  baseUrl: string; // origin for the tracked CTA + unsubscribe link
  trackingToken: string;
  mailingAddress: string; // physical address for CAN-SPAM footer
}

/** Build the email for an advertiser ad. Subject is verbatim from the campaign;
 *  body has the CTA link auto-injected at the bottom in a button block, and a
 *  CAN-SPAM footer with unsubscribe is auto-appended. */
export function renderAdvertiserAd(input: RenderAdInput): { subject: string; html: string } {
  const base = input.baseUrl.replace(/\/$/, "");
  const cta = `${base}/c/${input.trackingToken}`;
  const unsub = `${base}/u/${input.trackingToken}`;
  const subject = input.campaign.emailSubject.trim() || "r0cketship";
  const ctaLabel = esc(input.campaign.ctaLabel || "Learn more");
  const body = sanitizeForEmail(input.campaign.emailBodyHtml);

  const html = `<!doctype html><html><body style="margin:0;background:#f5f6f8;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8;padding:24px 0;height:${CAN_SPAM_FOOTER_HEIGHT_PX}px">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;padding:32px">
<tr><td>${body}</td></tr>
<tr><td style="padding:24px 0 8px 0">
  <a href="${esc(cta)}" style="background:#FF6B35;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:8px;font-weight:700;display:inline-block">${ctaLabel}</a>
</td></tr>
<tr><td style="padding-top:32px;border-top:1px solid #eaeaea;font-size:11px;color:#777;line-height:1.5">
${esc(input.mailingAddress)}<br/>
Unsubscribe: <a href="${esc(unsub)}" style="color:#777;text-decoration:underline">${esc(unsub)}</a>
</td></tr>
</table>
</td></tr></table>
</body></html>`;

  return { subject, html };
}
