-- Digital Time Capsule — schema.sql
--
-- Run this against the shared Supabase project's SQL editor once it
-- exists. Table is namespaced `digital_time_capsule_` per docs/PLAN.md.
--
-- Design note (applies to every table this sprint's Wave 3 ideas add):
-- `user_id` is a plain `uuid`, NOT a foreign key to `auth.users(id)`.
-- This is deliberate, not an oversight:
--   1. Row-level ownership is enforced by RLS comparing `user_id` to
--      `auth.uid()` (the verified JWT claim), which works identically
--      whether or not a FK constraint exists — the FK buys referential
--      integrity, not security.
--   2. It lets this file's seed data below insert immediately, without a
--      live Supabase project's `auth.users` already containing a matching
--      account (which is impossible before the project exists) and
--      without fabricating an `insert into auth.users (...)` — that
--      table's exact required columns are internal to Supabase Auth and
--      not something to guess at.
--   3. Once real accounts exist, real `auth.uid()` values naturally take
--      over for anything inserted through the app's own API routes (which
--      always set `user_id = auth.uid()`) — the seed rows below are just
--      demo/display data and are not addressable by any real account
--      unless you manually swap their `user_id`.

create table if not exists digital_time_capsule_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  -- Snapshot of the writer's email at write time. Necessary, not just
  -- convenient: PostgREST (and therefore supabase-js, including with the
  -- service-role key) only exposes the `public` schema by default, so the
  -- delivery cron cannot join against `auth.users` to look up an email
  -- later — it has to already be on this row.
  user_email text not null,
  title text,
  body text not null check (char_length(body) > 0),
  delivery_option text not null check (delivery_option in ('5y', '10y', 'custom')),
  deliver_at timestamptz not null,
  delivered boolean not null default false,
  delivered_at timestamptz,
  -- Best-effort record of a send failure for an already-claimed letter —
  -- see the idempotency comment in app/api/cron/deliver/route.ts for why
  -- this exists instead of retrying automatically.
  delivery_error text,
  created_at timestamptz not null default now()
);

-- Speeds up the cron's `WHERE delivered = false AND deliver_at <= now()`
-- scan; partial index since the vast majority of rows will eventually be
-- `delivered = true` and irrelevant to that query.
create index if not exists digital_time_capsule_letters_pending_idx
  on digital_time_capsule_letters (deliver_at)
  where delivered = false;

create index if not exists digital_time_capsule_letters_user_idx
  on digital_time_capsule_letters (user_id);

alter table digital_time_capsule_letters enable row level security;

-- Writers can see their own letters (delivered or not).
create policy "letters_select_own"
  on digital_time_capsule_letters for select
  using (user_id = auth.uid());

-- Writers can only create letters attributed to themselves. The API route
-- (app/api/letters/route.ts) always sets user_id/user_email from the
-- verified session server-side — this policy is the DB-level backstop.
create policy "letters_insert_own"
  on digital_time_capsule_letters for insert
  with check (user_id = auth.uid());

-- Lets a writer cancel a letter before it's delivered. No policy allows
-- updating `delivered`/`delivered_at`/`delivery_error` from the client at
-- all — those only ever change via the cron route's service-role client,
-- which bypasses RLS by design.
create policy "letters_delete_own_undelivered"
  on digital_time_capsule_letters for delete
  using (user_id = auth.uid() and delivered = false);

-- Seed data ------------------------------------------------------------
-- Demo user id — see the design note above for why this doesn't need a
-- real auth.users row to insert successfully. One letter is deliberately
-- already past its deliver_at ("due today") so a manual hit of
-- /api/cron/deliver right after Supabase goes live has something to pick
-- up immediately.
insert into digital_time_capsule_letters
  (user_id, user_email, title, body, delivery_option, deliver_at, delivered)
values
  (
    '00000000-0000-0000-0000-0000000000d1',
    'demo@example.com',
    'Due today (cron test)',
    'If you can read this, the daily delivery job worked. This letter was seeded with a deliver_at a few minutes in the past specifically so it is picked up on the first cron run.',
    'custom',
    now() - interval '10 minutes',
    false
  ),
  (
    '00000000-0000-0000-0000-0000000000d1',
    'demo@example.com',
    'Five years from now',
    'Dear future me — I hope the thing you were worried about in 2026 worked out. Remember to call your parents more.',
    '5y',
    now() + interval '5 years',
    false
  ),
  (
    '00000000-0000-0000-0000-0000000000d1',
    'demo@example.com',
    'A decade from now',
    'Ten years is a long time. I wonder if you still have the same handwriting, the same friends, the same city. Whatever changed, I hope you are proud of how you got there.',
    '10y',
    now() + interval '10 years',
    false
  ),
  (
    '00000000-0000-0000-0000-0000000000d1',
    'demo@example.com',
    'Already delivered (example)',
    'This one already went out, just to show what a delivered letter looks like in the UI.',
    'custom',
    now() - interval '30 days',
    true
  );

-- The "already delivered" row above needs delivered_at set separately
-- since it's not part of the insert's column list defaults.
update digital_time_capsule_letters
set delivered_at = now() - interval '30 days'
where title = 'Already delivered (example)' and user_id = '00000000-0000-0000-0000-0000000000d1';
