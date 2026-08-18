# Virtual Queue for Salons — SPEC

## What the MVP does

A customer visits a shop's queue page (`/shop/<slug>`), joins with a name
and optional email (+ party size), and sees their live position ("You're
#3 in line") update automatically — no refresh, no polling — via a
Supabase Realtime subscription on the queue entries table. Their spot is
remembered in `localStorage` so closing and reopening the tab keeps
showing their live status instead of re-prompting them to join.

Shop staff use `/shop/<slug>/staff` to see who's waiting (oldest first),
hit "Call next" to call the longest-waiting customer, "Mark served" once
they're helped, or "Remove" to cancel a no-show. The customer's own tab
updates the instant staff calls them — same Realtime subscription, both
directions.

## Scope adaptations

- **SMS → email/in-app**, per the assignment's scope note. There's no
  actual email-sending wired up in this pass (would need Resend, per
  `docs/PLAN.md`'s optional integration) — "notification" here means the
  in-app live position view. Adding a Resend email on "called" would be a
  small follow-up (a Vercel Cron or Postgres webhook calling an API route
  on status change), not built now.
- **No staff login.** Only one demo shop is seeded and the assignment
  doesn't call for multi-tenant shop accounts, so `/shop/<slug>/staff` is
  reachable by anyone with the URL in this MVP — not gated behind the
  shared template's magic-link auth the way `qr-menu-2`'s admin is. See
  the comment at the top of `schema.sql` for the production fix (owner_id
  + login, same pattern as `qr-menu-2`).
- **RLS is intentionally open** (`select`/`insert`/`update` all `true`) on
  both tables, rather than locked down like `qr-menu-2`'s orders. This is a
  deliberate, documented tradeoff: Supabase Realtime's `postgres_changes`
  only delivers events to a client if that client's role can `SELECT` the
  row per RLS, so making the customer's live-position view work without
  login requires a public-read policy on `virtual_queue_salons_entries`.
  Net effect: the optional `customer_email` field is technically readable
  by anyone with the (public, by design) anon key querying the table
  directly — never shown in the UI to anyone but staff, but not
  cryptographically hidden either. Documented in `schema.sql`; a real
  version handling actual customer PII should split this into a PII-free
  public view/broadcast channel instead.

## Schema summary

Two tables, prefixed `virtual_queue_salons_`: `shops` (slug, name) and
`entries` (shop_id, customer_name, customer_email, party_size, status —
`waiting`/`called`/`served`/`cancelled`, joined_at/called_at/served_at).
Position is computed client-side (not stored): count of `waiting` entries
with an earlier `joined_at`, +1.

`seed.sql` creates one demo shop ("Glow Nail Bar", slug `glow-nail-bar`)
with 7 entries spanning every status (2 served, 1 called, 3 waiting, 1
cancelled) so both the customer and staff views have realistic data on
first load.

## What still needs a live Supabase project to verify

- **Realtime specifically** — this is the one idea of the 5 whose core
  feature (live position updates) is entirely dependent on Supabase
  Realtime actually being enabled for `virtual_queue_salons_entries` on
  the shared project (it's on by default for new projects, but should be
  confirmed in the dashboard's Database → Replication settings). Nothing
  else about the app degrades if Realtime is off, but the "sees position
  update live" requirement specifically would silently stop working
  (falls back to whatever was last fetched, no polling fallback is
  implemented).
- All query/RLS behavior reasoned through against the schema and
  `@supabase/supabase-js` v2's documented API, not run against a live
  Postgres instance.
- The `localStorage`-based "remember my spot" mechanism only works within
  one browser/device — expected for a no-login MVP, but worth confirming
  it doesn't surprise a tester switching devices mid-queue.
