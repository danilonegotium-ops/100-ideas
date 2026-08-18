-- Supplement Reminder — schema.sql
-- Run against the shared Supabase project. Table names namespaced
-- `supplement_reminder_*` per docs/PLAN.md's convention.
--
-- Model: a personal, single-user tool. Everything is owned by the
-- logged-in user (auth.uid()) — no sharing/public browsing needed.

create extension if not exists pgcrypto;

create table if not exists supplement_reminder_supplements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  -- Free text on purpose — units vary (mg, IU, mL, drops, capsules...).
  dose text not null,
  -- One time-of-day per row. A twice-daily supplement is modeled as two
  -- rows (e.g. "Vitamin D — morning" and "Vitamin D — evening") — simpler
  -- than a schedule sub-table for an MVP, documented in SPEC.md.
  schedule_time time not null,
  pills_per_dose integer not null default 1 check (pills_per_dose > 0),
  pills_remaining integer not null default 0 check (pills_remaining >= 0),
  -- Warn when remaining DOSES (pills_remaining / pills_per_dose) drops
  -- below this many.
  low_stock_threshold_doses integer not null default 5 check (low_stock_threshold_doses >= 0),
  created_at timestamptz not null default now()
);

create index if not exists supplement_reminder_supplements_owner_id_idx
  on supplement_reminder_supplements (owner_id);

create table if not exists supplement_reminder_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  supplement_id uuid not null references supplement_reminder_supplements(id) on delete cascade,
  taken_at timestamptz not null default now(),
  -- Denormalized from taken_at for a cheap "already taken today?" check
  -- without a timezone-aware date_trunc on every dashboard load.
  taken_date date not null default current_date
);

create index if not exists supplement_reminder_logs_owner_id_idx
  on supplement_reminder_logs (owner_id);

create index if not exists supplement_reminder_logs_supplement_taken_date_idx
  on supplement_reminder_logs (supplement_id, taken_date);

-- Row Level Security -----------------------------------------------------

alter table supplement_reminder_supplements enable row level security;
alter table supplement_reminder_logs enable row level security;

create policy "owner full access" on supplement_reminder_supplements
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "owner full access" on supplement_reminder_logs
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Seed data ---------------------------------------------------------------
-- `owner_id` is a real foreign key into `auth.users`. Once the shared
-- Supabase project is live: sign up once via this app's magic-link login
-- with a demo email, find that user's id under Authentication > Users in
-- the Supabase dashboard, and replace the placeholder UUID below with it
-- before running this block.

do $$
declare
  demo_owner_id uuid := '00000000-0000-0000-0000-000000000001';
  s_vitd uuid := gen_random_uuid();
  s_omega uuid := gen_random_uuid();
  s_magnesium uuid := gen_random_uuid();
  s_multivitamin uuid := gen_random_uuid();
begin
  insert into supplement_reminder_supplements
    (id, owner_id, name, dose, schedule_time, pills_per_dose, pills_remaining, low_stock_threshold_doses) values
    (s_vitd, demo_owner_id, 'Vitamin D3', '2000 IU', '08:00', 1, 40, 7),
    (s_omega, demo_owner_id, 'Omega-3 Fish Oil', '1000mg', '08:00', 2, 6, 5), -- low stock: 3 doses left, threshold 5
    (s_magnesium, demo_owner_id, 'Magnesium Glycinate', '400mg', '21:00', 1, 2, 5), -- critically low: 2 doses left
    (s_multivitamin, demo_owner_id, 'Multivitamin', '1 tablet', '08:00', 1, 25, 5);

  -- A couple of "already taken today" log entries so the dashboard shows
  -- a realistic mix of taken/due-today on first load.
  insert into supplement_reminder_logs (owner_id, supplement_id, taken_at, taken_date) values
    (demo_owner_id, s_vitd, now() - interval '1 hour', current_date),
    (demo_owner_id, s_multivitamin, now() - interval '1 hour', current_date);
end $$;
