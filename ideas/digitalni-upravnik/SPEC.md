# Digitalni Upravnik — SPEC

## What the MVP does

A SaaS for apartment-building managers, built on `_shared/nextjs-template`:

- **Manager auth**: magic-link email login (template default, unmodified). A logged-in user is a "manager" and owns any building they create (`manager_id`).
- **Buildings dashboard** (`/dashboard`, protected): list the manager's buildings, create a new one.
- **Building management** (`/dashboard/[buildingId]`, protected, owner-only): add units (with optional owner/tenant name + contact email), log maintenance-fund transactions (signed amount, running balance shown), publish notices (with a "pinned" flag), and start a vote (question + 2-4 options + how many days it stays open). Each section shows existing records plus an inline add-form — no edit/delete UI in this pass (see Out of scope).
- **Public digital notice board** (`/b/[buildingId]`, no login required): the actual "notice board" — anyone with the link sees notices, the fund balance + recent transactions, and open votes with live tallies. Tenants don't get accounts; they vote by picking their unit from a dropdown and submitting once. A unique DB constraint (`vote_id, unit_id`) plus an RLS check ("vote still open") stop double-voting or voting after close, enforced at the database level, not just in the UI.
- **Landing page** (`/`) explains the product and links to `/login` or `/dashboard` depending on auth state.

## Scope adaptations / design calls

- **Tenants have no accounts.** The original idea says "tenant voting" — building real per-tenant login would mean either giving every tenant a Supabase account (unrealistic to seed/demo for a weekend sprint) or a token-per-unit system. Instead, voting is scoped **per unit** via a public link, which is how many real buildings already handle informal voting (one vote per apartment, not per resident). Documented here rather than silently simplified.
- **PII split into a separate table.** `digitalni_upravnik_units` (label, floor, fee) is public-read because the board needs to list units for the voting dropdown and the fee schedule is normal building-transparency info. Tenant/owner names and contact email live in `digitalni_upravnik_unit_contacts`, a separate table that is manager-only (never public), so the public board can't leak resident contact info even though the unit list itself is public.
- **Fund ledger and notices are public-read by design** — a real building notice board and maintenance-fund ledger are meant to be seen by everyone in the building, most of whom won't have an account. Only the manager (matched via `manager_id`/building ownership) can write.
- **No edit/delete UI for units, transactions, notices, or votes** in this pass — only create. A manager can still fix mistakes directly via the Supabase dashboard's table editor. Deleting a vote response is supported at the RLS level (manager-only) for correcting an accidental double-vote reported by a tenant, but there's no UI button for it yet.

## Schema summary (`schema.sql`, seed data in `seed.sql`)

Tables (prefix `digitalni_upravnik_`): `buildings`, `units`, `unit_contacts` (PII, manager-only), `fund_transactions`, `notices`, `votes`, `vote_options`, `vote_responses` (unique per `vote_id, unit_id`).

RLS: `buildings`/`units`/`fund_transactions`/`notices`/`votes`/`vote_options`/`vote_responses` are public **SELECT** (`to anon, authenticated using (true)`), matching the "publicly browsable" case from the task brief. All writes are gated to the building's `manager_id = auth.uid()` (checked via `EXISTS` joins for child tables), except `vote_responses` INSERT, which is public but gated by a `with check` requiring the vote to still be open and the option/unit to actually belong to that vote. `unit_contacts` is fully manager-only (select/insert/update/delete) — the one table with real PII.

Seed (`seed.sql`): one building "Bulevar Oslobođenja 45" (Novi Sad), 12 units with contacts, 6 fund transactions (net positive balance), 3 notices (one pinned), 2 open votes (camera install proposal, elevator-maintenance vendor choice) with several cast responses so tallies aren't empty. **Requires a real `auth.users` row first** — see the comment block at the top of `seed.sql` (sign in once via `/login`, copy the user id from the Supabase dashboard, replace the placeholder UUID). There's no supported way to create a working login purely from SQL.

## What's genuinely untestable until Supabase is live

- The entire auth flow (magic link send + `/auth/callback` exchange) — unmodified from the template, which already verified the build-safety pattern, but the actual email round-trip needs a real project.
- Every RLS policy above is reasoned through carefully but **not executed** — no live Postgres to run it against. In particular: double-check the `vote_responses` public-insert policy's three `EXISTS` subqueries actually behave as intended against real data (especially that a unit from a *different* building can't be used to vote on this building's vote — the third `EXISTS` joins `votes.building_id = units.building_id` for that reason, worth a manual test).
- `npm run build`, `npx tsc --noEmit`, and `npm run lint` all pass locally with empty env vars (see verification output in the handoff), but real Supabase calls (Server Actions, Server Components reading building/unit/vote data) are only exercised at request time, never at build time — first real test happens once `.env.local` has live credentials.
