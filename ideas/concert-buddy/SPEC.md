# Concert Buddy — SPEC

## What the MVP does

Public browse page (`/`) lists open "looking for a buddy" listings —
event name, date, city, note — filterable by city (partial match) and a
date range, via a plain GET form (works without JavaScript). A logged-in
user posts a listing on `/new` (event name, date, city, optional note,
optional contact hint). Anyone logged in can open a listing (`/listings/[id]`)
and click "I'm interested," which creates a row visible to the poster (with
the interested user's email and optional message) — the "visible
connection" the brief asked for. No in-app messaging; contact happens
via the poster's email or their optional `contact_hint`, both shown on the
listing page. A poster can mark their own listing "filled" once they've
found someone (`MarkFilledButton`).

## Schema summary (`schema.sql`)

- `concert_buddy_listings` — one row per posted listing, `user_id` +
  denormalized `user_email` (poster), `event_name`/`event_date`/`city`,
  optional `note`/`contact_hint`, `is_filled`. RLS: select is public
  (`using (true)`) so browsing needs no login; insert/update/delete
  restricted to the poster.
- `concert_buddy_interests` — one row per (listing, interested user) pair,
  `unique (listing_id, user_id)` so "I'm interested" is idempotent (a
  duplicate click hits the unique constraint, which the API route treats
  as a success rather than an error — see
  `app/api/listings/[id]/interest/route.ts`). RLS select: visible to the
  interested user themselves, or to the listing's poster (via a subquery
  against `concert_buddy_listings`) — other interested users on the same
  listing can't see each other, a reasonable default privacy scope not
  explicitly required either way by the brief.
- Neither table's `user_id` has a foreign key to `auth.users` — see the
  note at the top of `schema.sql` (same reasoning as every Wave 3 idea in
  this batch: RLS via `auth.uid()` is the real enforcement mechanism and
  doesn't need the FK, and skipping it lets the seed data below insert
  without a live project already having matching accounts).

Seed data: 8 listings across Belgrade, Novi Sad, Niš, Guča, and Budva
under two synthetic poster IDs, varied dates 10–120 days out, one already
marked filled, plus one seeded interest row on the EXIT Festival listing
so the poster-view interest list has something to show.

## Scope adaptations / calls made

- Browsing is public (no login) — the brief's "browses other listings"
  didn't specify a login gate, and a public board browsing bar is lower
  friction and matches how most "looking for a buddy" boards work.
  Posting and expressing interest do require login (identity is the whole
  point of those two actions).
- Contact info (poster's email, or their optional `contact_hint`) is shown
  directly on the listing page to anyone viewing it, not gated behind
  expressing interest first — closer to how a classified ad works, and
  simpler than a two-step reveal.
- No listing edit form beyond the filled/open toggle — a poster who wants
  to change details can delete and repost; kept this out to avoid
  duplicating the create-listing validation logic in an edit path for the
  MVP.
- No messaging — explicitly out of scope per the brief ("contact happens
  outside the app").

## What's genuinely untestable until Supabase is live

- The actual magic-link auth round trip (template-level, applies to every
  Wave 3 idea).
- Whether the `interests_select_own_or_posters` RLS policy's subquery
  (`listing_id in (select id from concert_buddy_listings where user_id =
  auth.uid())`) performs and evaluates as expected against real data —
  reasoned through carefully (subqueries against other RLS-protected
  tables are standard, well-supported Postgres/Supabase behavior, and the
  referenced table's own `using (true)` select policy means the subquery
  sees all listings regardless of caller), but never executed against a
  live database.
- The unique-constraint-as-idempotent-interest behavior (Postgres error
  code `23505` handling in the interest route) — the code path is
  straightforward, but the exact error code has not been observed from a
  live Supabase Postgres instance in this environment.
