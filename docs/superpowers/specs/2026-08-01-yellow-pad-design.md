# r0cketship.com/yellow — Digital Yellow Pad (design spec)

**Date:** 2026-08-01
**Route:** `r0cketship.com/yellow` — a personal task organizer styled as a yellow legal pad.
**Isolation:** Brand-new route + brand-new DB tables (all `yellow_*`). Touches nothing else on the platform; its auth is fully separate from the tenant/role platform accounts.

## Auth (standalone)
- Own login system + own session cookie (`yellow_session`), **long-lived (365d)** so the user stays signed in ("leave it open"). Reuses the platform's scrypt `hashPassword`/`verifyPassword`.
- **First-run setup:** if no `yellow_users` exist, `/yellow` shows a "create your account" form → creates the first **admin** (Jeff). No password is ever set by the developer.
- Logged-in **admin** gets a "+ New account" panel (name, username, email, temp password). New accounts have `must_reset = true` → forced password reset on first login.
- Admin sees a **user list** and can **impersonate** any user (session carries `impersonator_user_id`; a banner + "exit" returns to the admin).

## Data model (Drizzle / Postgres)
- `yellow_users`: id, name, username (unique), email, password_hash, must_reset (bool), is_admin (bool), status, created_at.
- `yellow_sessions`: id, user_id → yellow_users, token_hash, impersonator_user_id (nullable), expires_at, created_at.
- `yellow_pages`: id, user_id → yellow_users, title, position, created_at.
- `yellow_notes`: id, page_id → yellow_pages, text, priority ('high'|'medium'|'low'), done (bool), position, created_at, completed_at (nullable).
- `yellow_subnotes`: id, note_id → yellow_notes, text, created_at.

## Visual
- **Bright canary-yellow** page, sized like an 8.5×11 sheet, centered.
- **Thin blue horizontal rule lines** across (repeating gradient) that notes sit on.
- **Double red vertical margin line** down the left (classic legal pad).
- **Black band across the top:** "R0cketShip" (wordmark, orange 0) on the left, the current user's **name on the right**. When impersonating, the band/banner shows it.

## Notes & interactions
- Each note = **checkbox + text + tiny timestamp** (right) + **priority color dot** (High = red, Medium = amber, Low = slate).
- **Add note:** text + priority picker → saved with timestamp.
- **Check** → line-through + `done=true` → moves to the **Completed** view (the "page behind"). A per-page toggle flips Active ⇄ Completed with a **roll-up animation**.
- **Drag-and-drop** reorder (native HTML5 DnD, no new dependency) → persists `position`.
- **Sort by priority** toggle.
- **Click a note** → modal with **timestamped sub-notes** (add underneath).
- **Priorities** filter/sort; colors as above.

## Pages
- Multiple pages per user; **"+ Add page"**. Switch pages with a **roll-up animation**. Active page on top; Completed items live behind the active page (per page).

## Seed
- On first-admin creation, auto-create a first page seeded with the tasks transcribed from Jeff's photo (MEDIGAP, Amazon/Mortgage.Plus, CHUBB, UGS calls, PredictiveData.org, NAV/loans/equity, Jeff server relaunch, John Kaland, Chaz/Ebert, Mike Cee demo, broker calls, SunKaps, etc.). Handwriting is rough in spots — Jeff edits after.

## Architecture / files
- `src/db/schema.ts` — add the `yellow_*` tables (+ generated drizzle migration).
- `src/yellow/` — session helpers, DB queries, seed data.
- `app/yellow/page.tsx` — server component: resolve session → setup / login / app.
- `app/yellow/YellowApp.tsx` — client component: the interactive pad.
- `app/yellow/actions.ts` — server actions (login, setup, logout, CRUD notes/pages/subnotes, reorder, createUser, impersonate/exit).
- `export const dynamic = "force-dynamic"` so build never hits the DB.

## Deploy & verification
- Deploy via the standard r0cketship tar → Vultr flow; the deploy's `drizzle-kit migrate` creates the new tables (adding tables is safe — no existing table touched).
- Local dev has no DB, so verify on the deployed box: first-run setup → create admin (seeded page appears) → add/check/reorder/prioritize notes → sub-note modal → add page + roll-up → create a second user → impersonate → exit.
- Confirm the rest of r0cketship.com is unaffected after deploy.
