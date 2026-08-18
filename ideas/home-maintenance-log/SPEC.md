# Home Maintenance Log — SPEC

## What the MVP does

A digital "service book" for one or more houses. Real, end-to-end flow:

1. Sign in with a passwordless magic-link email (`/login`, reusing the shared
   template's auth exactly as documented — no changes to the auth mechanism
   itself, only the post-login redirect target).
2. Add a home (`/dashboard`) — name + optional address.
3. Inside a home (`/dashboard/[homeId]`), add systems/appliances: name, a
   category from a curated list (`lib/categories.ts`), optional install
   date, optional notes.
4. Inside a system (`/dashboard/[homeId]/systems/[systemId]`), log service
   events: date, description, optional cost (EUR), optional "next service
   due" date. Full service history is listed newest-first, each entry
   deletable.
5. `/dashboard` surfaces a "Needs attention" panel that aggregates every
   system across every home whose most recent service event's
   `next_service_due` is overdue or due within 30 days
   (`DUE_SOON_WINDOW_DAYS` in `lib/status.ts`), sorted overdue-first. Each
   home card also shows its own worst-case status badge. Status logic is
   pure/unit-tested (`getSystemStatus`, `latestEventBySystem`,
   `worstStatus` in `lib/status.ts` — verified with a standalone Node script
   during development, not shipped as a test file since this template has
   no test runner configured).

Multiple homes per account are supported (e.g. a primary residence + a
vacation cabin), since that's a realistic real-world case and added
negligible complexity over a single-home model.

## Scope adaptations / deliberate simplifications

- **Currency fixed to EUR**, no multi-currency support — the idea didn't
  specify one; EUR keeps it simple and matches the regional convention used
  elsewhere in this sprint (see `rent-price-map`).
- **System category is a closed list**, not free text (`lib/categories.ts`),
  so the dashboard/status logic and seed data stay consistent. "Other" is
  the escape hatch.
- **No edit forms** for homes/systems/service events — only add + delete.
  Correcting a typo means delete-and-re-add. Acceptable for an MVP; a
  follow-up pass would add `update` forms (the RLS policies already support
  `UPDATE`, so this is additive, not a schema change).
- **No confirmation dialog** on delete buttons (plain form submit). A
  follow-up pass could add a client-side confirm step.
- **"Due soon" threshold is 30 days**, a product judgment call, not from any
  external source — easy to change in one place (`lib/status.ts`).
- Status is derived from the **most recent service event's**
  `next_service_due` only (not a separate "next due" field stored directly
  on the system) — avoids two sources of truth for the same fact.

## Schema summary (`schema.sql`)

Three tables, prefixed `home_maintenance_log_` per the shared-Supabase
convention in `docs/PLAN.md`:

- `home_maintenance_log_homes` — one row per home, `user_id` FK to
  `auth.users`.
- `home_maintenance_log_systems` — FK to `homes`.
- `home_maintenance_log_service_events` — FK to `systems`.

RLS: every table restricts `SELECT`/`INSERT`/`UPDATE`/`DELETE` to rows owned
(directly or transitively, via `EXISTS` subqueries joining up to `homes`) by
`auth.uid()`. This is a standard per-user multi-tenant pattern — nobody can
read or write another user's home data through the public API, regardless
of table.

CHECK constraints add defense-in-depth beyond the app-level validation in
`app/dashboard/actions.ts` (string length caps, `cost >= 0`,
`next_service_due >= service_date`), so a bug in the app layer can't corrupt
data even if it bypassed the UI.

## Seed / demo data

One demo home ("Main House") with 5 systems (boiler, AC, water heater,
roof, fridge) and a handful of service events deliberately chosen to
exercise all four dashboard states: **overdue** (boiler), **due soon**
(AC, via a rolling `current_date + interval` so it stays "due soon"
whenever the seed is actually run), **on track** (water heater), **not
scheduled** (roof, event logged but no next-due date set), and **never
serviced** (fridge, zero events).

Because every row is owned by a real `auth.users.id` via a foreign key, and
Supabase manages `auth.users` itself, the seed block **cannot run
successfully as-is** — it uses an obviously-placeholder UUID
(`00000000-0000-0000-0000-000000000001`) and documents in a comment exactly
how to swap in a real user id after signing up once via the live app. This
was a deliberate choice over inserting directly into `auth.users` by hand,
which is unsupported/fragile.

## What still needs a live Supabase project to verify end-to-end

Everything here was written and reasoned through against the documented
`@supabase/ssr` API and the template's established patterns, but nothing
below has been exercised against a real database:

- The magic-link login round trip (`signInWithOtp` → email → `/auth/callback`
  → session cookie) — the mechanism is unchanged from the template, which
  is itself unverified live, only reasoned through.
- That the RLS policies actually behave as written once real rows/users
  exist — in particular the three-table transitive ownership check on
  `service_events` (join through `systems` to `homes`) has only been
  reasoned through, not executed against Postgres.
- Running the seed data after swapping in a real user id.
- That `next build` succeeding with placeholder env vars (verified locally)
  also means the dynamic routes (`/dashboard/**`, all marked
  `export const dynamic = "force-dynamic"` since they call `getUser()`)
  render correctly at real request time with real cookies/session state.
