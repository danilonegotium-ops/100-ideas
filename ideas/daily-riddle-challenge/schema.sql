-- Daily Riddle Challenge — schema.sql
--
-- Run against the shared Supabase project once it exists. Table
-- namespaced `daily_riddle_challenge_` per docs/PLAN.md.
--
-- The riddle content itself lives in code (lib/riddles.ts), not in this
-- table — "today's riddle" is derived deterministically from the date
-- (day-of-year modulo the riddle list length), so every player worldwide
-- always sees the same riddle without a DB round trip. This table only
-- records *attempts*.

create table if not exists daily_riddle_challenge_attempts (
  id uuid primary key default gen_random_uuid(),
  -- Which day's riddle this attempt is for — a plain `date`, computed
  -- from UTC (see lib/riddles.ts's utcDateString) so "today" means the
  -- same thing for every player regardless of their timezone.
  riddle_date date not null,
  -- Nullable: anonymous play is allowed by design (see the brief — "logged
  -- in or anonymous-with-name"). No FK to auth.users; see the shared note
  -- in digital-time-capsule/schema.sql for why Wave 3 tables in this batch
  -- skip that FK.
  user_id uuid,
  display_name text not null check (char_length(display_name) > 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  -- Always computed server-side as completed_at - started_at at submit
  -- time (see app/api/riddle/submit/route.ts) — never trust a
  -- client-supplied elapsed time for a leaderboard.
  elapsed_ms integer,
  correct boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists daily_riddle_challenge_attempts_leaderboard_idx
  on daily_riddle_challenge_attempts (riddle_date, elapsed_ms)
  where correct = true;

create index if not exists daily_riddle_challenge_attempts_user_day_idx
  on daily_riddle_challenge_attempts (user_id, riddle_date);

alter table daily_riddle_challenge_attempts enable row level security;

-- Deliberately NO policies for `anon`/`authenticated`. RLS enabled with
-- zero permissive policies is a default-deny: nobody can read or write
-- this table directly via the PostgREST data API (browser Supabase
-- client), only the service-role client can (it bypasses RLS entirely by
-- design). Every read and write goes through app/api/riddle/** instead —
-- see the comment in lib/supabase/admin.ts for why (anonymous rows have
-- no auth.uid() to key a normal ownership policy on; the real
-- authorization boundary is "you may only act on an attempt id the
-- server just handed you," which the API routes enforce in code).

-- Seed data --------------------------------------------------------------
-- A handful of demo leaderboard entries for *today* (whatever day this
-- script actually runs on), so the leaderboard has something to show
-- immediately. Uses `current_date` rather than a hardcoded date for
-- exactly that reason.
insert into daily_riddle_challenge_attempts
  (riddle_date, user_id, display_name, started_at, completed_at, elapsed_ms, correct)
values
  (current_date, null, 'ana', now() - interval '2 hours', now() - interval '2 hours' + interval '8.4 seconds', 8400, true),
  (current_date, null, 'marko', now() - interval '90 minutes', now() - interval '90 minutes' + interval '11.9 seconds', 11900, true),
  (current_date, null, 'jelena', now() - interval '1 hour', now() - interval '1 hour' + interval '14.2 seconds', 14200, true),
  (current_date, null, 'nikola', now() - interval '40 minutes', now() - interval '40 minutes' + interval '21.7 seconds', 21700, true),
  (current_date, null, 'guest_37f1', now() - interval '20 minutes', now() - interval '20 minutes' + interval '5.1 seconds', 5100, true);
