/**
 * Tiny JS loader for sites that can't (or don't want to) use an iframe.
 *
 *   GET /embed.js?k=<box-key>
 *
 * Returns a self-contained script that:
 *   - finds a host `<div id="r0c-obx-<key>"></div>` already on the page
 *   - fetches `${base}/embed/<key>?fmt=fragment` (body-only HTML, no <html>)
 *   - sets innerHTML so the offers render inline
 *
 * The JS is cache-stable for 60s — same TTL as the fragment endpoint so the
 * loader and the rendered HTML age together.
 *
 * The script is intentionally written for max compatibility (ES5-ish, no
 * arrow funcs, no fetch — uses XMLHttpRequest) so it works on old hosts.
 */

export const runtime = "nodejs";

function publicBase(): string {
  return process.env.PUBLIC_BASE_URL ?? "https://r0cketship.com";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawKey = url.searchParams.get("k") ?? "";
  // Only allow our key alphabet; refuse anything else with an empty script
  // (browsers will execute it silently — no console noise on the host).
  const key = /^[a-z0-9_]{1,64}$/i.test(rawKey) ? rawKey : "";

  const base = publicBase();

  const body = key
    ? `(function(){var K=${JSON.stringify(key)},B=${JSON.stringify(base)};var d=document.getElementById("r0c-obx-"+K);if(!d)return;var x=new XMLHttpRequest();x.open("GET",B+"/embed/"+encodeURIComponent(K)+"?fmt=fragment",true);x.onload=function(){if(x.status>=200&&x.status<300){d.innerHTML=x.responseText;}};x.send();})();`
    : `/* r0cketship offer-box: missing or invalid ?k= parameter */`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=60",
      "X-Robots-Tag": "noindex",
    },
  });
}
