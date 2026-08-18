-- Simple Uptime Monitor — schema.sql
-- Run against the shared Supabase project's SQL editor. Table names are
-- namespaced `simple_uptime_monitor_*` per docs/PLAN.md's shared-project
-- convention.
--
-- ============================================================================
-- Demo user note
-- ----------------------------------------------------------------------------
-- Seed rows below are owned by a placeholder demo user, UUID
-- '00000000-0000-0000-0000-000000000001'. auth.users is managed by Supabase
-- Auth, not by this file. Before running the INSERTs at the bottom, either:
--   (a) sign up as a real user via the app's magic-link flow (/login), then
--       run `update simple_uptime_monitor_monitors set user_id = '<real-uuid>'
--       where user_id = '00000000-0000-0000-0000-000000000001';`, or
--   (b) create a user with that exact UUID via Supabase Dashboard ->
--       Authentication -> Users -> Add user (Supabase lets you set the UID
--       explicitly), then run the seed INSERTs as-is.
-- Until one of those exists, the seed INSERTs will fail with a foreign key
-- violation — that's expected, not a bug.
-- ============================================================================

create extension if not exists pgcrypto;

create table if not exists simple_uptime_monitor_monitors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  label text,
  last_status text not null default 'unknown'
    check (last_status in ('unknown', 'up', 'down')),
  last_checked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists simple_uptime_monitor_monitors_user_id_idx
  on simple_uptime_monitor_monitors (user_id);

create table if not exists simple_uptime_monitor_checks (
  id uuid primary key default gen_random_uuid(),
  monitor_id uuid not null references simple_uptime_monitor_monitors(id) on delete cascade,
  status text not null check (status in ('up', 'down')),
  status_code integer,
  response_ms integer,
  checked_at timestamptz not null default now()
);

create index if not exists simple_uptime_monitor_checks_monitor_id_idx
  on simple_uptime_monitor_checks (monitor_id, checked_at desc);

-- Row Level Security.
alter table simple_uptime_monitor_monitors enable row level security;
alter table simple_uptime_monitor_checks enable row level security;

-- Monitors: fully owner-scoped. The cron sweep (app/api/cron/check/route.ts)
-- uses the Supabase service_role key, which bypasses RLS entirely, so it
-- can read/update every user's monitors regardless of these policies. These
-- policies only govern what a logged-in user's own browser/session can do
-- (the dashboard UI, and the authenticated "check now" route).
create policy simple_uptime_monitor_monitors_select_own
  on simple_uptime_monitor_monitors
  for select
  using (auth.uid() = user_id);

create policy simple_uptime_monitor_monitors_insert_own
  on simple_uptime_monitor_monitors
  for insert
  with check (auth.uid() = user_id);

create policy simple_uptime_monitor_monitors_update_own
  on simple_uptime_monitor_monitors
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy simple_uptime_monitor_monitors_delete_own
  on simple_uptime_monitor_monitors
  for delete
  using (auth.uid() = user_id);

-- Checks: readable/insertable only for monitors the requester owns. Insert
-- is needed by the authenticated "check now" route (app/api/check-now),
-- which uses the user's own session rather than the service role.
create policy simple_uptime_monitor_checks_select_own
  on simple_uptime_monitor_checks
  for select
  using (
    exists (
      select 1 from simple_uptime_monitor_monitors m
      where m.id = simple_uptime_monitor_checks.monitor_id
        and m.user_id = auth.uid()
    )
  );

create policy simple_uptime_monitor_checks_insert_own
  on simple_uptime_monitor_checks
  for insert
  with check (
    exists (
      select 1 from simple_uptime_monitor_monitors m
      where m.id = simple_uptime_monitor_checks.monitor_id
        and m.user_id = auth.uid()
    )
  );

-- ============================================================================
-- Seed data — a couple of demo monitors with some check history, owned by
-- the demo user (see note above). Run only after the demo user exists.
-- ============================================================================

insert into simple_uptime_monitor_monitors (id, user_id, url, label, last_status, last_checked_at)
values
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'https://example.com',
    'Example site',
    'up',
    now() - interval '3 minutes'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'https://status.example.org',
    'Status page (demo, currently down)',
    'down',
    now() - interval '3 minutes'
  );

insert into simple_uptime_monitor_checks (monitor_id, status, status_code, response_ms, checked_at)
values
  ('10000000-0000-0000-0000-000000000001', 'up', 200, 118, now() - interval '3 hours'),
  ('10000000-0000-0000-0000-000000000001', 'up', 200, 142, now() - interval '2 hours'),
  ('10000000-0000-0000-0000-000000000001', 'up', 200, 121, now() - interval '1 hours'),
  ('10000000-0000-0000-0000-000000000001', 'up', 200, 109, now() - interval '3 minutes'),
  ('10000000-0000-0000-0000-000000000002', 'up', 200, 340, now() - interval '3 hours'),
  ('10000000-0000-0000-0000-000000000002', 'up', 200, 355, now() - interval '2 hours'),
  ('10000000-0000-0000-0000-000000000002', 'down', 503, null, now() - interval '1 hours'),
  ('10000000-0000-0000-0000-000000000002', 'down', null, null, now() - interval '3 minutes');
