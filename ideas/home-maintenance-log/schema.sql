-- Home Maintenance Log — schema + RLS + seed data
-- Run against the shared Supabase project. Table names are namespaced
-- `home_maintenance_log_*` per docs/PLAN.md's shared-project convention.
--
-- Ownership model: each home belongs to exactly one authenticated user
-- (auth.users, via Supabase's built-in magic-link auth already wired up in
-- this template). Systems belong to a home, service events belong to a
-- system. RLS enforces ownership transitively through both joins so a
-- user can only ever see/modify their own data.

create extension if not exists pgcrypto; -- provides gen_random_uuid()

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table if not exists home_maintenance_log_homes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  address text check (address is null or char_length(address) <= 200),
  created_at timestamptz not null default now()
);

create index if not exists home_maintenance_log_homes_user_id_idx
  on home_maintenance_log_homes (user_id);

create table if not exists home_maintenance_log_systems (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references home_maintenance_log_homes (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  category text not null,
  install_date date,
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now()
);

create index if not exists home_maintenance_log_systems_home_id_idx
  on home_maintenance_log_systems (home_id);

create table if not exists home_maintenance_log_service_events (
  id uuid primary key default gen_random_uuid(),
  system_id uuid not null references home_maintenance_log_systems (id) on delete cascade,
  service_date date not null,
  description text not null check (char_length(description) between 1 and 1000),
  cost numeric(10, 2) check (cost is null or (cost >= 0 and cost <= 1000000)),
  next_service_due date check (next_service_due is null or next_service_due >= service_date),
  created_at timestamptz not null default now()
);

create index if not exists home_maintenance_log_service_events_system_id_idx
  on home_maintenance_log_service_events (system_id);

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table home_maintenance_log_homes enable row level security;
alter table home_maintenance_log_systems enable row level security;
alter table home_maintenance_log_service_events enable row level security;

-- Homes: directly owned by user_id.
create policy "homes_select_own" on home_maintenance_log_homes
  for select using (auth.uid() = user_id);

create policy "homes_insert_own" on home_maintenance_log_homes
  for insert with check (auth.uid() = user_id);

create policy "homes_update_own" on home_maintenance_log_homes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "homes_delete_own" on home_maintenance_log_homes
  for delete using (auth.uid() = user_id);

-- Systems: owned transitively through their home.
create policy "systems_select_own" on home_maintenance_log_systems
  for select using (
    exists (
      select 1 from home_maintenance_log_homes h
      where h.id = home_id and h.user_id = auth.uid()
    )
  );

create policy "systems_insert_own" on home_maintenance_log_systems
  for insert with check (
    exists (
      select 1 from home_maintenance_log_homes h
      where h.id = home_id and h.user_id = auth.uid()
    )
  );

create policy "systems_update_own" on home_maintenance_log_systems
  for update using (
    exists (
      select 1 from home_maintenance_log_homes h
      where h.id = home_id and h.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from home_maintenance_log_homes h
      where h.id = home_id and h.user_id = auth.uid()
    )
  );

create policy "systems_delete_own" on home_maintenance_log_systems
  for delete using (
    exists (
      select 1 from home_maintenance_log_homes h
      where h.id = home_id and h.user_id = auth.uid()
    )
  );

-- Service events: owned transitively through system -> home.
create policy "service_events_select_own" on home_maintenance_log_service_events
  for select using (
    exists (
      select 1
      from home_maintenance_log_systems s
      join home_maintenance_log_homes h on h.id = s.home_id
      where s.id = system_id and h.user_id = auth.uid()
    )
  );

create policy "service_events_insert_own" on home_maintenance_log_service_events
  for insert with check (
    exists (
      select 1
      from home_maintenance_log_systems s
      join home_maintenance_log_homes h on h.id = s.home_id
      where s.id = system_id and h.user_id = auth.uid()
    )
  );

create policy "service_events_update_own" on home_maintenance_log_service_events
  for update using (
    exists (
      select 1
      from home_maintenance_log_systems s
      join home_maintenance_log_homes h on h.id = s.home_id
      where s.id = system_id and h.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from home_maintenance_log_systems s
      join home_maintenance_log_homes h on h.id = s.home_id
      where s.id = system_id and h.user_id = auth.uid()
    )
  );

create policy "service_events_delete_own" on home_maintenance_log_service_events
  for delete using (
    exists (
      select 1
      from home_maintenance_log_systems s
      join home_maintenance_log_homes h on h.id = s.home_id
      where s.id = system_id and h.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- Seed / demo data
-- ---------------------------------------------------------------------
--
-- Because every row is owned by a real `auth.users.id` via a foreign key,
-- this seed data can't be inserted until at least one real user exists
-- (Supabase manages `auth.users` itself — rows aren't meant to be created
-- by hand). Steps to actually load this demo data once Supabase is live:
--
--   1. Sign up once via the app's magic-link flow (any email you control).
--   2. Find that user's id: `select id, email from auth.users;`
--   3. Replace the placeholder UUID below with that real id, then run the
--      INSERTs in this section.
--
-- The placeholder below is NOT a real auth.users row — running this block
-- as-is against a live database will fail its foreign key constraint by
-- design, so it can't silently create orphaned/unowned demo data.

do $$
declare
  demo_user_id uuid := '00000000-0000-0000-0000-000000000001'; -- replace with a real auth.users.id
  demo_home_id uuid;
  boiler_id uuid;
  ac_id uuid;
  water_heater_id uuid;
  roof_id uuid;
  fridge_id uuid;
begin
  insert into home_maintenance_log_homes (id, user_id, name, address)
  values (gen_random_uuid(), demo_user_id, 'Main House', '14 Kralja Petra St, Belgrade')
  returning id into demo_home_id;

  insert into home_maintenance_log_systems (id, home_id, name, category, install_date, notes)
  values (gen_random_uuid(), demo_home_id, 'Basement Boiler', 'Boiler', '2018-03-10', 'Vaillant, gas-fired, in the basement utility room.')
  returning id into boiler_id;

  insert into home_maintenance_log_systems (id, home_id, name, category, install_date, notes)
  values (gen_random_uuid(), demo_home_id, 'Living Room AC', 'Air Conditioning', '2020-06-01', 'Split unit, filter is behind the front panel.')
  returning id into ac_id;

  insert into home_maintenance_log_systems (id, home_id, name, category, install_date, notes)
  values (gen_random_uuid(), demo_home_id, 'Water Heater', 'Water Heater', '2019-11-20', null)
  returning id into water_heater_id;

  insert into home_maintenance_log_systems (id, home_id, name, category, install_date, notes)
  values (gen_random_uuid(), demo_home_id, 'Roof', 'Roof', '2015-01-01', 'Re-shingled 2015, check gutters every autumn.')
  returning id into roof_id;

  insert into home_maintenance_log_systems (id, home_id, name, category, install_date, notes)
  values (gen_random_uuid(), demo_home_id, 'Kitchen Fridge', 'Refrigerator', '2021-02-14', null)
  returning id into fridge_id;

  -- Boiler: serviced annually, next due date intentionally in the past to
  -- demonstrate the "overdue" state on the dashboard.
  insert into home_maintenance_log_service_events (system_id, service_date, description, cost, next_service_due)
  values
    (boiler_id, '2024-09-15', 'Annual inspection and cleaning by certified technician.', 85.00, '2025-09-15'),
    (boiler_id, '2023-09-10', 'Annual inspection, replaced pressure valve.', 110.00, '2024-09-15');

  -- AC: next due date intentionally within the next 30 days to demonstrate
  -- the "due soon" state.
  insert into home_maintenance_log_service_events (system_id, service_date, description, cost, next_service_due)
  values
    (ac_id, '2025-05-20', 'Pre-summer filter clean and refrigerant check.', 60.00, (current_date + interval '10 days')::date);

  -- Water heater: serviced, comfortably not due for a while ("on track").
  insert into home_maintenance_log_service_events (system_id, service_date, description, cost, next_service_due)
  values
    (water_heater_id, '2025-01-05', 'Flushed tank, checked anode rod.', 45.00, (current_date + interval '200 days')::date);

  -- Roof: one-off gutter clearing, no next-service date scheduled
  -- ("not scheduled" state).
  insert into home_maintenance_log_service_events (system_id, service_date, description, cost, next_service_due)
  values
    (roof_id, '2025-10-01', 'Cleared gutters and checked for loose shingles after storm.', 40.00, null);

  -- Fridge: never serviced yet — no rows inserted, so it shows
  -- "Never serviced yet" on the system page.
end $$;
