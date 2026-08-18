# Local Sports Buddy — SPEC

## What the MVP does

A public UGC directory (magic-link auth for creating things, but browsing
needs no account at all):

- **`/`** — public landing page.
- **`/login`** — magic-link email login (template default).
- **`/browse`** — public, no login required. Lists all open "looking to
  play" listings, filterable by sport (curated list) and city (derived
  live from whatever cities currently have listings). Each card shows the
  sport, day/time, location description, who posted it, and who's already
  said they're in. Logged-in users with a profile get an **"I'm in"**
  toggle right there (click again to retract); logged-in users without a
  profile see a prompt to create one; logged-out visitors see a prompt to
  log in. Listing owners can remove their own listing from this same page.
- **`/profile`** (auth required) — create or edit your own profile: name,
  city/area (free text — "general area/city", not precise geolocation, per
  the brief), and a checkbox set of sports you play (curated list, see
  below). One profile per account (enforced by a `unique(owner_id)`
  constraint).
- **`/post`** (auth required, profile required) — post a new "looking to
  play" listing: sport, city/area (prefilled from your profile, editable —
  you might organize a game somewhere else), day/time (free text, e.g.
  "Saturday 10:00"), and where exactly (free text location description).

## Scope adaptations

- **Sports are a curated fixed tag list** (`lib/sports/constants.ts`:
  Basketball, Football, Tennis, Volleyball, Table Tennis, Badminton,
  Running, Padel), not free text. This is a UI/data-modeling choice, not a
  factual claim about anything external — it exists purely so the
  sport filter on `/browse` does exact matching instead of guessing
  whether "football" and "Football" and "soccer" are the same thing.
  Covers the three sports named in the brief plus common pickup sports in
  a Serbian city context.
- **Day/time is free text, not a structured schedule** ("Saturday 10:00",
  "Tue evenings") — matches how pickup games are actually organized in
  practice, and avoids forcing a rigid single-recurrence data model into
  a weekend MVP.
- **No in-app messaging** — per the brief explicitly ("contact happens
  outside the app for MVP"). "I'm in" just records interest and shows the
  interested person's name on the listing; the poster reaches out however
  they naturally would (they can see who to look for at the game).
- **No listing edit** — post, remove, done. Same tradeoff as the other 4
  ideas in this batch.

## Schema summary (`schema.sql`)

Tables (prefix `local_sports_buddy_`):

- **`profiles`** — `owner_id` (→ `auth.users`, unique — one profile per
  account), `name`, `sports` (`text[]`), `city`.
- **`listings`** — `owner_id`, `profile_id` (→ `profiles`), `sport`,
  `city`, `day_time`, `location_description`, `status`
  (`open`/`closed`, default `open`).
- **`interests`** — `listing_id` (→ `listings`), `owner_id`, `profile_id`
  (→ `profiles`), unique on `(listing_id, profile_id)` so the same person
  can't stack duplicate "I'm in" rows.

RLS is different in shape from the other 4 ideas in this batch, since this
one is a genuinely public directory:

- All three tables are **publicly readable** (`select` to `anon,
  authenticated using (true)`) — browsing needs no login, and seeing
  who's interested in a listing needs no login either.
- **Writes require login and self-consistency**: inserting a listing or
  an interest checks not just `auth.uid() = owner_id` but also that the
  referenced `profile_id` actually belongs to that same `auth.uid()` (an
  `exists (...)` subquery against `profiles`) — this stops a logged-in
  user from posting a listing or interest under someone else's profile
  id even if they somehow got hold of it.
- Updates/deletes on all three tables are owner-only.

Seed data: 6 demo profiles (one real `auth.users` placeholder id each —
this idea needs multiple distinct demo users, not just one, since it's a
multi-user directory; see the comment at the top of the seed block in
`schema.sql` for the one-time replace-with-real-demo-users step), 8
listings spread across Belgrade (5) and Novi Sad (3) covering 6 of the 8
curated sports, and 3 seeded "I'm in" interests so the browse page shows
realistic interest counts on first load.

## What's genuinely untestable until Supabase is live

- RLS policies against a real Postgres instance — this idea's policies
  are the most complex of the 5 (public read + self-consistency-checked
  writes via `exists` subqueries), reasoned through carefully but not
  executed.
- The magic-link login round trip (template-provided, not re-verified
  per-idea).
- Whether the seed data's 6 distinct placeholder `auth.users` ids need to
  correspond to 6 real signups before the seed block will run cleanly
  (the FK constraint requires it) — documented in `schema.sql`, but the
  actual multi-user seed process hasn't been exercised against a live
  project.
