# Cataño deck — deployment notes

The deck is one route in the main app (`app/catano/`). It auto-picks the
**corporate** variant for any `puertoricomasterminds.com` host and the
**operator-partner** variant for `r0cketship.com`. A `?v=corporate|partner`
query param overrides the host for previews. Password: `JeffCline`.

## Live now
- `https://r0cketship.com/catano?v=corporate` — corporate deck (use this today)
- `https://r0cketship.com/catano?v=partner` — operator-partner deck

## Option A — Subdomain (recommended, leaves the existing PR site untouched)
The existing `puertoricomasterminds.com` website is NOT moved. We add a sibling
subdomain that points at the app box.

1. **You:** at the registrar/DNS for `puertoricomasterminds.com`, add one record:
   - Type `A`, Host/Name `catano`, Value `137.220.56.129`
   - (Result: `catano.puertoricomasterminds.com` → app box. Existing `@` and `www` are unchanged.)
2. **Me, once it propagates:** issue SSL —
   `certbot --nginx -d catano.puertoricomasterminds.com`
3. **Result:** `https://catano.puertoricomasterminds.com` → redirects to the corporate deck.
   The nginx vhost (`/etc/nginx/sites-available/catano`) is already in place and enabled.

## Option B — Exact `/Catano` path on the existing site (after Option A has SSL)
A DNS record can't route one path to a different server, so the path must be
reverse-proxied by whatever hosts `puertoricomasterminds.com` today. Point it at
the subdomain from Option A (reuses that cert — no fragile cross-server TLS):

**nginx:**
```nginx
location /Catano {
    proxy_pass https://catano.puertoricomasterminds.com/catano;
    proxy_set_header Host catano.puertoricomasterminds.com;
    proxy_ssl_server_name on;
}
```

**Apache** (needs `mod_proxy` + `mod_proxy_http` + `mod_ssl`):
```apache
SSLProxyEngine on
ProxyPass        /Catano https://catano.puertoricomasterminds.com/catano
ProxyPassReverse /Catano https://catano.puertoricomasterminds.com/catano
```

If the existing site is on a hosted builder (Squarespace/Wix/etc.) that can't
reverse-proxy, Option B isn't available — use the subdomain, or a simple
redirect/link from a page on the existing site to the subdomain.

## Editing content
- Copy lives in `app/catano/content-corporate.ts` and `content-partner.ts`.
- One-pagers mirror them: `docs/catano/catano-onepage-corporate.md`, `…-partner.md`.
- Redeploy: sync `app/catano/*` to `/var/www/r0cketship/app/catano/`, then on the box
  `cd /var/www/r0cketship && npm run build && pm2 restart r0cketship`. (Route is
  self-contained — no DB migrations.)
