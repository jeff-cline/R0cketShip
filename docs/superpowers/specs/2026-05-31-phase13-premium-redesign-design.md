# Phase 13 — Premium Redesign: Selectable Style Templates + Color Pickers

**Date:** 2026-05-31
**Status:** Approved (visual companion), ready for build
**Builds on:** Phase 1 theming, Phase 4 marketing, Phase 8 provisioning

## Goal
Replace the flat marketing layer with a premium, conversion-focused design system offered as **three
selectable style templates** (`trust`, `bold`, `dark`), all fully theme-driven so every white-label
inherits the upgrade in its own colors. Each white-label picks a template + palette in the
launch/edit UI. **Default = `bold`.**

## Decisions
- Three templates, one structure, different visual treatment; all read the tenant's theme colors.
- Per-tenant **`style`** setting (enum) + **color pickers** for the 5 theme colors in `/admin/launch`
  and `/admin/tenants/[id]`. Presets kept as one-click quick-fills.
- Premium typography via `next/font` (a display + a body face; trust template adds a serif headline).
- Applies across all marketing pages (home/about/how-it-works/contact + a new `/pricing`), not just home.

## Data model
- `tenants.style` — enum `site_style` (`trust`,`bold`,`dark`), notNull default `bold`. Backfill
  existing tenants to `bold`. Add `style` to the `Tenant` type and `manage.ts`.

## Design system (`app/_marketing/`)
- **`tokens` / globals.css**: existing `--color-*` vars + new `--radius`, shadow scale; fonts wired
  via `next/font` CSS variables (`--font-display`, `--font-body`).
- **Shared content builder** `marketingContent(tenant)` → `{ moneyWord, niche, offers, features[],
  stats[], testimonials[], footerHtml }` — features/stats/testimonials are strong defaults
  parameterized by `niche`/`moneyWord` (no per-tenant data entry required; offers come from config).
- **Primitives**: `MarketingNav`, `MarketingFooter` (themed, shared).
- **Templates** (each a server component rendering the full home page from `marketingContent` in its
  style): `BoldTemplate`, `TrustTemplate`, `DarkTemplate`. Sections: nav, hero (badge + dual CTA +
  reassurance), trust/stat bar, feature grid, how-it-works, pricing/offers (with "Most Popular"),
  testimonials, e-partnership band, closing CTA, footer.
- **`renderTemplate(style, tenant)`** picks the template; `app/page.tsx` calls it.

## UI — provisioning
- A **`ThemeEditor`** client component: 5 `<input type="color">` (primary/secondary/accent/background/
  foreground), a `style` select (trust/bold/dark), and preset quick-fill buttons that populate the
  color inputs live. Submits theme + style.
- Wire it into `/admin/launch` (new white-label) and `/admin/tenants/[id]` (edit). `createTenant`
  /`updateTenantConfig` accept `style` + a full `theme`.

## Other marketing pages
About / how-it-works / contact restyled with the shared primitives + a new `/pricing` page (the 3
offers in premium cards). They use theme colors but a single neutral treatment (not per-template) to
keep scope contained — the 3 templates differ on the **home** page.

## Testing (TDD where logic exists)
- `manage.ts`: `createTenant` defaults `style="bold"`; `updateTenantConfig` updates `style` + theme.
- `renderTemplate`: returns the right template component name for each style (pure mapping fn tested).
- `marketingContent`: produces niche-parameterized copy + passes offers through.
- Visual/build: `npm run build` green; the 3 styles render (verified live after deploy by toggling a
  tenant's style).

## Out of scope
Per-tenant custom hero imagery/upload; a full WYSIWYG page builder; template differences on the
secondary pages; dark-mode auto-switching.
