# Cafe Inventory Tracker — SPEC

## What the MVP does

A single dashboard (`/`) lists inventory items — name, unit, current
stock, reorder threshold, typical daily usage rate. "Days left" is
computed exactly as specified: current stock ÷ daily usage rate
(`lib/inventory.ts`). Items are sorted soonest-to-run-out first, and
flagged (red border + a badge) if either (a) stock has already dropped to
or below the reorder threshold, or (b) fewer than 7 days of runway remain
at the current usage rate — two related but distinct signals, both shown:
the threshold badge answers "have we hit the par level," the days-left
figure answers "how urgent is it." A "Needs reorder only" checkbox filters
to just flagged items. Quick +1/−1 stock buttons let an owner update
counts without opening a form; "Add an item" is a full form for onboarding
a new ingredient.

Division-by-zero (a brand new item with no usage history yet,
`daily_usage_rate = 0`) is handled explicitly — shown as "no usage data"
rather than an infinite or `NaN` days-left figure.

## Scope adaptations

- **No login / single shared workspace** — same rationale as
  `subscription-tracker-teams`: this is an internal single-cafe tool for
  the MVP, matching the assignment's "seed ~10 demo inventory items" scale
  rather than a multi-tenant product. A real production version would add
  a `cafe_id`/`owner_id` column and the shared template's magic-link login
  (unused here) before handling a real cafe's data. See `schema.sql`.

## Schema summary

One table, `cafe_inventory_tracker_items`: `name`, `unit`,
`current_stock`, `reorder_threshold`, `daily_usage_rate` (all `numeric`,
so fractional units like "2.5 kg" work), `category` (optional), `notes`
(optional). RLS is open (`for all using (true) with check (true))`.

`seed.sql` inserts 12 items spanning every state the dashboard needs to
demonstrate: comfortably stocked (Oat Milk, Espresso — Light Roast, White
Sugar, Paper Cups), right at/below the reorder threshold (Whole Milk,
Espresso — Dark Roast, Brown Sugar, Caramel Syrup, Napkins), completely
out of stock (Almond Milk, `current_stock = 0`), and one item with no
usage history yet (Chai Concentrate, `daily_usage_rate = 0`) to exercise
the "no usage data" case instead of a division-by-zero bug.

## What still needs a live Supabase project to verify

- All query/insert/update/delete behavior against the open RLS policy —
  reasoned through, not run live. Same low-risk shape as
  `subscription-tracker-teams` (one table, no foreign keys).
- Postgres `numeric` columns come back from `@supabase/supabase-js` as
  JS numbers for values in normal ranges (confirmed this is
  supabase-js/PostgREST's standard behavior, not a guess), so
  `lib/inventory.ts`'s arithmetic operates on plain numbers as written —
  worth a quick live sanity check with a fractional stock value (e.g. "2.5
  kg") once Supabase exists, since that's the one area PostgREST's JSON
  encoding of `numeric` could in principle surprise (very large/precise
  values sometimes serialize as strings — not a concern at cafe-inventory
  scale, but worth knowing about).
