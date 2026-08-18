# Rent Price Map — SPEC

## What the MVP does

A crowdsourced, genuinely anonymous map of rent prices. Real, end-to-end
flow, no account of any kind:

1. `/` — a Leaflet + OpenStreetMap map (no API key) shows every submitted
   report as a pin. Clicking a pin opens a popup with neighborhood, city,
   rent, rooms, size, and note. A "filter by city" dropdown (populated from
   whatever cities actually exist in the data, not a hardcoded list) filters
   both the map and a card list below it. Reports are fetched server-side on
   every request (`export const dynamic = "force-dynamic"`), so a fresh
   submission shows up immediately on the next page load.
2. `/submit` — a form (city, neighborhood, monthly rent in EUR, rooms,
   optional size in m², optional note) plus a click-to-place Leaflet map
   picker (`components/LocationPicker.tsx`) for the location. Submits via
   `fetch` to `POST /api/reports`.
3. `app/api/reports/route.ts` — validates + sanity-checks the submission
   (`lib/validation.ts`), rounds the coordinates to 2 decimal places
   (~1.1km grid, enforced server-side so it can't be bypassed by calling the
   API directly), and inserts it. No IP address, cookie, session, or any
   other identifying value is read or stored anywhere in this flow.

## RLS / abuse-resistance design (read this before deploying)

`rent_price_map_reports` has **no policy at all for `UPDATE` or `DELETE`**,
for any role. Postgres RLS defaults to deny for any operation with no
matching policy once RLS is enabled — so once a row is inserted, it is
**permanently immutable through the public API** (the `anon` key, which is
the only key this app's client or server code ever uses). This isn't a
gap to fill in later; it's the actual design, because:

- There's no `user_id`/email/session column to scope an "own this row"
  check to, by deliberate choice — adding one would break the anonymity
  the idea explicitly asks for.
- Read access is fully public (`for select using (true)`) — the map only
  works if everyone can see everyone's pins.
- Insert access is fully public (`for insert with check (true)`) — anyone
  can add a report, which is the whole point.
- The only thing that can bypass this is the Supabase `service_role` key
  (used from the Supabase dashboard directly, e.g. to delete an obviously
  spam/abusive row) — that key is never used anywhere in this app's code.

**What the RLS policy does *not* defend against** (and what does, instead):
a malicious client could still POST a garbage/abusive *new* row (it can't
touch existing ones). That's what `lib/validation.ts`'s bounds checks
(rent between €30–€5000, coordinates within a Serbia bounding box, string
length caps) plus the table's own `CHECK` constraints (a second,
independent backstop with slightly looser bounds, in case the API layer's
logic is ever bypassed or changed) are for. **True spam/rate-limiting
(CAPTCHA, per-IP throttling) is explicitly out of scope for this MVP** — a
real implementation would need either a third-party CAPTCHA key we don't
have yet, or storing something IP-shaped that would undermine the
anonymity guarantee above. Documented here as a known, deliberate
limitation rather than silently skipped.

## Leaflet + OpenStreetMap integration

Confirmed working end-to-end via a real `next build` (not just reasoned
about): `leaflet` + `@types/leaflet` are real npm dependencies (not a CDN
`<script>` tag — more robust/versioned for an app that already has a build
step), imported only inside two "use client" files
(`components/RentMap.tsx`, `components/LocationPicker.tsx`), each of which
is loaded exclusively through a small wrapper
(`RentMapLoader.tsx`/`LocationPickerLoader.tsx`) using
`next/dynamic(() => import(...), { ssr: false })` — the documented
Next.js pattern for browser-only libraries. This lets `app/page.tsx` stay a
Server Component (so it can fetch reports server-side) while the map itself
never executes during SSR/SSG. `leaflet/dist/leaflet.css` is imported
directly inside those component files (supported in the App Router). Map
tiles come from the free, keyless
`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` endpoint with the
required OSM attribution string. The well-known "broken default marker
icon under a bundler" issue is fixed in `lib/leaflet-icon.ts` by pointing
the three marker PNGs at the unpkg CDN (sidesteps needing to guess how
Next's bundler represents imported image assets).

## Scope adaptations / deliberate simplifications

- **Currency fixed to EUR** — the near-universal convention for quoted
  rent in Serbia even though the official currency is RSD.
- **Serbia-only bounding box** for submitted coordinates (`SERBIA_BOUNDS`
  in `lib/validation.ts`) — matches this sprint's existing Serbia focus
  (e.g. `solar-panel-roi-calculator`) and the seed data. Loosening this to
  other countries later is a one-line change.
- **Rooms is a closed set** (studio/1/2/3/4/5+), not free text, so
  filtering/validation stay reliable.
- **Client-side city filtering** — the whole dataset is fetched once and
  filtered in the browser; fine at MVP/seed scale, would move to a
  server-side query + pagination if the dataset grew large.
- **No moderation UI** — removing a spam/abusive report requires going
  into the Supabase dashboard directly with the `service_role` key (by
  design, see above), not a page in this app.

## Schema summary (`schema.sql`)

One table, `rent_price_map_reports`, no foreign keys, no `user_id` column.
`CHECK` constraints on every bounded field (rent, size, rooms enum,
lat/lng range, string lengths). Indexes on `city` (filter) and
`created_at desc` (default sort).

## Seed data

~15 illustrative reports across real Belgrade and Novi Sad neighborhoods
(Vračar, Dorćol, Novi Beograd, Zemun, Liman, Petrovaradin, etc.), with
plausible but **hand-picked, not scraped or verified against a live rent
index** rent figures — no live/authoritative Serbian rental-price data
source was available while building this offline. Coordinates are
approximate neighborhood centers already at ~2-decimal precision to match
what the real submission flow stores. Timestamps are staggered over the
past ~4 weeks (relative `now() - interval`) so the feed looks organically
crowdsourced rather than bulk-inserted at once. Unlike
`home-maintenance-log`, this seed data has no FK to `auth.users` and can be
run immediately as-is once the schema exists on the live Supabase project
— no placeholder-swapping needed.

## What still needs a live Supabase project to verify end-to-end

- That the RLS policy actually behaves as designed once real anonymous
  traffic hits it — in particular, confirming a raw `PATCH`/`DELETE`
  request against the table via the anon key genuinely gets rejected (not
  just reasoned through from Postgres RLS's documented default-deny
  behavior).
- Running `schema.sql` for real and confirming the seed rows insert
  cleanly against the actual `CHECK` constraints.
- That `POST /api/reports` correctly persists through to what `/` then
  reads back (the insert and select code paths were written and reasoned
  through separately, never executed against a real database in the same
  process).
- Real-world Leaflet/OSM tile loading behavior (rate limits, CORS) under
  actual production traffic — the *build* is verified; a live network
  request to `tile.openstreetmap.org` was not made from this environment.
