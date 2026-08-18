# Daily Riddle Challenge — SPEC

## What the MVP does

Everyone gets the same riddle on the same UTC calendar day (`lib/riddles.ts`:
a fixed 30-riddle bank, index = day-of-year mod 30, mirroring the
date-seeding *pattern* used by the separate static `daily-riddle-site`
idea, but with fresh original content — that idea's `data.js` was only
read for reference, per instructions, not copied).

A player (logged in, or anonymous with a typed display name) clicks "start
the clock," which creates a `daily_riddle_challenge_attempts` row with
`started_at = now()` server-side and returns that timestamp. The client
runs a local timer purely for display; when they submit an answer, the
server independently recomputes elapsed time from the row's own
`started_at` — the client's displayed timer is never trusted as the
source of truth for the leaderboard. A correct answer (checked against a
small set of accepted-answer variants per riddle, not one exact string)
records `elapsed_ms`/`correct` and the leaderboard (`GET
/api/riddle/leaderboard`) shows the fastest correct solves for that day.

## Schema summary (`schema.sql`)

One table, `daily_riddle_challenge_attempts` — `riddle_date`, nullable
`user_id` (anonymous play is explicit in the brief), `display_name`,
`started_at`/`completed_at`/`elapsed_ms`/`correct`. RLS is enabled with
**zero policies** for the anon/authenticated roles — a deliberate
default-deny, since this table has no clean `auth.uid()`-based ownership
model for anonymous rows. All reads/writes go through
`app/api/riddle/**`, which use a service-role client
(`lib/supabase/admin.ts`) instead. The real access-control boundary is
"you can only act on an attempt id the server just gave you" (an
unguessable UUID), enforced in the route code, not in RLS. Seed data: 5
demo leaderboard entries for `current_date` (evaluated whenever the SQL
actually runs, so it's always "today" regardless of when this file is
executed against a live project).

## Anti-cheat / integrity notes (worth a human's attention)

- **Elapsed time is never client-supplied.** `POST /api/riddle/submit`
  recomputes `elapsed_ms = now() - started_at` from the database row, so
  a player editing client-side JS can't fake a faster time.
- **One attempt per day for logged-in users**, enforced server-side in
  `POST /api/riddle/start`: a repeat call resumes the existing in-progress
  attempt (same original `started_at`, so reloading can't reset the
  clock) or, if already completed, returns the existing result instead of
  allowing a second try.
- **Anonymous play cannot be deduped server-side** — there's no stable
  identity for an anonymous player, so nothing stops someone from
  reloading and starting a fresh anonymous attempt repeatedly to get
  lucky with a fast time, or opening the browser console to read
  `question` (not the answer — that's never sent to the client) faster
  than actually solving it. This is an explicit, documented honor-system
  tradeoff for supporting anonymous play at all, matching the brief's
  "logged-in or anonymous-with-name" requirement. Logged-in play is the
  integrity-guaranteed path.
- The answer-matching logic (`isCorrectAnswer` in `lib/riddles.ts`) is
  intentionally generous (multiple accepted spellings/synonyms per
  riddle) — false negatives (a right answer marked wrong) are a worse
  experience than the rare false positive in a casual daily game.

## Scope adaptations / calls made

- "Today" is defined as the UTC calendar day, not the server's or a
  player's local day — necessary for "everyone in the world gets the same
  riddle" to actually be true; otherwise the riddle would flip at a
  different wall-clock moment in every timezone.
- No riddle archive/browse-past-riddles page in this pass (the static
  `daily-riddle-site` idea already covers that use case); this idea is
  scoped to "today's riddle + live leaderboard," matching the brief's
  focus on the competitive angle.

## What's genuinely untestable until Supabase is live

- The actual magic-link auth round trip for the "logged-in" path
  (template-level, applies to every Wave 3 idea) — anonymous play needs
  no auth and can be smoke-tested with `npm run dev` once real Supabase
  env vars exist.
- The zero-policy RLS default-deny behavior — reasoned through carefully
  (this is standard, well-documented Postgres RLS semantics: RLS enabled
  + no permissive policy = deny-all for any role except one that bypasses
  RLS, i.e. service-role), but not something that can be exercised without
  a live Postgres instance to confirm the anon/authenticated Supabase
  clients really do get rejected by PostgREST if some future change
  accidentally tries to query this table directly from the browser.
- The `.is("completed_at", null)` atomic race guard in the submit route —
  logically sound (a conditional UPDATE is atomic in Postgres), but never
  exercised under real concurrent load.
