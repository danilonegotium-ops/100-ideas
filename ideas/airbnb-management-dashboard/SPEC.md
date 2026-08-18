# Airbnb Management Dashboard — SPEC

## What the MVP does

A logged-in owner adds properties (`/`, inline form) with a default
platform fee % and cleaning fee. Each property's detail page
(`/properties/[id]`) lets them log bookings — check-in/check-out dates,
gross payout, and per-booking overrides for platform fee %/cleaning
fee/other costs (defaulting to the property's own values, but editable
per stay, e.g. a discounted off-season cleaning or a one-off repair cost).
Net profit is computed as `gross_payout - (gross_payout * platform_fee_pct
/ 100) - cleaning_fee - other_costs`, both live in the add-booking form
(client-side preview via `lib/money.ts`) and authoritatively in Postgres
(a `generated always as` column — see schema note below). The property
detail page totals gross/fees/cleaning+other/net across bookings, and can
be filtered to a check-in date range; the homepage lists all properties
with their all-time gross/net.

## Data model choice

The brief describes "bookings (dates, gross payout) and expenses
(cleaning, platform fee %, other costs)" as if separate, but every cost
listed is naturally scoped to one specific stay — so this schema merges
them into one `bookings` row per stay rather than adding a second
`expenses` table with an awkward optional `booking_id`. This is a
deliberate scope call, documented in `schema.sql`, not an oversight: the
brief only asks for profit "per booking and per property," which this
model answers directly.

## Schema summary (`schema.sql`)

- `airbnb_management_dashboard_properties` — `user_id` (no FK to
  `auth.users`, see the note at the top of `schema.sql`), `name`/`address`,
  `default_platform_fee_pct`/`default_cleaning_fee` (prefill values for
  new bookings).
- `airbnb_management_dashboard_bookings` — `property_id` FK (cascades on
  property delete), denormalized `user_id` (matches the property owner,
  enforced by the API route so RLS doesn't need a subquery join per row),
  `check_in`/`check_out` (`check_out > check_in` CHECK), a generated
  `nights` column (`check_out - check_in`, valid Postgres date
  subtraction), `gross_payout`/`platform_fee_pct`/`cleaning_fee`/`other_costs`,
  and a generated `net_profit` column computing the exact same formula as
  `lib/money.ts`'s `computeNetProfit()` (kept in sync deliberately — a
  comment in each file points at the other). RLS on both tables:
  select/insert/update/delete restricted to `user_id = auth.uid()`.

Seed data: one demo property ("Vracar 2BR," Belgrade) with 8 bookings
spanning the last ~150 days plus one upcoming — mostly identical
3%/€40-cleaning stays, but one with an extra "other cost" (a repair) and
one with a discounted off-season cleaning fee, so the totals aren't all
mechanically identical and actually exercise the per-booking override
logic.

## Scope adaptations / calls made

- No separate expenses table — see "Data model choice" above.
- Manual expense/booking entry only, per `MASTER_TRACKER.md`'s existing
  note for this idea ("manual expense entry") — no live integration with
  Airbnb's actual payout API, which would need OAuth partner approval
  well beyond a weekend sprint.
- Currency is EUR throughout (`lib/money.ts`'s `formatMoney`) — a
  reasonable default for a Serbia-facing property tool without forcing a
  multi-currency model the brief never asked for.
- Property "delete" and booking "edit/delete" aren't exposed in the UI
  yet (RLS policies support them, so this is a UI gap, not a schema
  limitation) — kept out of the MVP to keep the two forms (`NewPropertyForm`,
  `NewBookingForm`) the only write paths for this pass.

## What's genuinely untestable until Supabase is live

- The actual magic-link auth round trip (template-level, applies to every
  Wave 3 idea).
- The two Postgres `generated always as` columns (`nights`, `net_profit`)
  — the arithmetic was reasoned through carefully and cross-checked
  against `lib/money.ts`'s pure-JS equivalent (same formula, verified by
  hand with a few sample bookings), and `date - date -> integer` /
  generated-column arithmetic are standard, long-stable Postgres features,
  but neither has actually been executed against a live Postgres instance
  in this environment.
- Whether `current_date - interval 'N days'` (used throughout the seed
  data to keep booking dates realistic relative to whenever the script
  actually runs, rather than hardcoded dates that would drift stale) casts
  cleanly into the `date` columns on a live Supabase Postgres — this is
  standard implicit timestamp-to-date casting, but worth a first-run
  glance at the seeded rows to confirm the dates look right.
