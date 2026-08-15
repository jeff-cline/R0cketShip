/**
 * Embed-snippet generators for an Offer Box.
 *
 * Pure functions — no DB, no auth, no fetch. Given the box key + a base URL
 * (e.g. https://r0cketship.com) and an optional pre-rendered HTML snapshot,
 * produce the four copy-pasteable payloads we surface in the admin UI.
 *
 *   - iframe       — drop-in <iframe>. Best when the host page allows JS.
 *   - js           — async <script> loader that injects HTML into a known div.
 *                    Good for sites that block iframes (or want responsive
 *                    integration with the page DOM).
 *   - html         — frozen HTML snapshot of the current top offers. No JS,
 *                    no remote calls — ideal for email templates / Klaviyo
 *                    Universal Content blocks.
 *   - popup        — script that injects an overlay modal on page load.
 *   - klaviyoHint  — short copy-paste instructions for the Klaviyo tab; the
 *                    actual HTML the user pastes comes from the `html` field.
 */
export interface SnippetSet {
  iframe: string;
  js: string;
  html: string;
  popup: string;
  klaviyoHint: string;
}

export interface SnippetBox {
  key: string;
  format: "html" | "iframe" | "js" | "popup";
}

const KLAVIYO_HINT =
  "Klaviyo Universal Content blocks accept raw HTML. Paste the HTML snippet from the 'HTML for email' tab into a Universal Content block, save it as a template, and you can drop it into any Klaviyo email or flow. Click attribution still flows through r0cketship.com/c/obx/... so we track and monetize.";

function normalizeBase(base: string): string {
  return base.replace(/\/+$/, "");
}

export function buildSnippets(
  box: SnippetBox,
  base: string,
  htmlSnapshot: string,
): SnippetSet {
  const b = normalizeBase(base);
  const key = encodeURIComponent(box.key);

  const iframe = `<iframe src="${b}/embed/${key}" width="100%" height="360" frameborder="0" loading="lazy" style="border:0;display:block;width:100%;max-width:920px;margin:0 auto;" title="r0cketship offer box"></iframe>`;

  const js = `<div id="r0c-obx-${box.key}"></div>
<script async src="${b}/embed.js?k=${key}"></script>`;

  // Popup: ship a tiny self-contained script that mounts an overlay once per
  // session. Uses sessionStorage so refreshes don't re-pop, but a fresh tab
  // does. No external deps.
  const popup = `<script>(function(){var K=${JSON.stringify(box.key)},B=${JSON.stringify(b)};try{if(sessionStorage.getItem("r0cObx-"+K))return;}catch(_){}var d=document.createElement("div");d.id="r0c-obx-modal-"+K;d.style.cssText="position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px;";var box=document.createElement("div");box.style.cssText="position:relative;max-width:960px;width:100%;max-height:90vh;overflow:auto;border-radius:16px;background:#0b1020;box-shadow:0 30px 80px rgba(0,0,0,.6);";var close=document.createElement("button");close.textContent="×";close.setAttribute("aria-label","Close");close.style.cssText="position:absolute;top:10px;right:12px;background:transparent;border:0;color:#c5cae8;font-size:24px;line-height:1;cursor:pointer;z-index:1;";var frame=document.createElement("iframe");frame.src=B+"/embed/"+encodeURIComponent(K);frame.style.cssText="border:0;width:100%;min-height:380px;display:block;border-radius:16px;";frame.setAttribute("title","r0cketship offer box");var hide=function(){try{sessionStorage.setItem("r0cObx-"+K,"1");}catch(_){}if(d.parentNode)d.parentNode.removeChild(d);};close.onclick=hide;d.addEventListener("click",function(e){if(e.target===d)hide();});box.appendChild(close);box.appendChild(frame);d.appendChild(box);function mount(){document.body.appendChild(d);}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",mount);}else{mount();}})();</script>`;

  return {
    iframe,
    js,
    html: htmlSnapshot,
    popup,
    klaviyoHint: KLAVIYO_HINT,
  };
}

/** Generate a random offer-box key like `obx_xxxxxxxx`. Used by the new-box
 *  action; lives here so tests/admin can reuse it without re-importing crypto. */
export function generateBoxKey(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < 10; i++) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `obx_${s}`;
}
