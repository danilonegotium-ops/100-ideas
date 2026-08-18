-- Pet Health Records — schema.sql
-- Run against the shared Supabase project. Table names namespaced
-- `pet_health_records_*` per docs/PLAN.md's convention.
--
-- Model: a personal, single-user vault. Everything is owned by the
-- logged-in user (auth.uid()) — no sharing/public browsing needed.

create extension if not exists pgcrypto;

create table if not exists pet_health_records_pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  species text not null,
  chip_number text,
  created_at timestamptz not null default now()
);

create index if not exists pet_health_records_pets_owner_id_idx
  on pet_health_records_pets (owner_id);

create table if not exists pet_health_records_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  pet_id uuid not null references pet_health_records_pets(id) on delete cascade,
  entry_type text not null check (entry_type in ('vaccination', 'vet_visit')),
  description text not null,
  entry_date date not null,
  -- Only meaningful for recurring vaccinations; null for one-off vet
  -- visits or vaccinations with no booster schedule.
  next_due_date date,
  created_at timestamptz not null default now()
);

create index if not exists pet_health_records_entries_owner_id_idx
  on pet_health_records_entries (owner_id);

create index if not exists pet_health_records_entries_pet_id_idx
  on pet_health_records_entries (pet_id);

create index if not exists pet_health_records_entries_next_due_date_idx
  on pet_health_records_entries (next_due_date);

-- Row Level Security -----------------------------------------------------

alter table pet_health_records_pets enable row level security;
alter table pet_health_records_entries enable row level security;

create policy "owner full access" on pet_health_records_pets
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "owner full access" on pet_health_records_entries
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
  pet1 uuid := gen_random_uuid();
begin
  insert into pet_health_records_pets (id, owner_id, name, species, chip_number, created_at) values
    (pet1, demo_owner_id, 'Luna', 'Dog', 'RS-985141000123456', now() - interval '400 days');

  insert into pet_health_records_entries
    (owner_id, pet_id, entry_type, description, entry_date, next_due_date) values
    (demo_owner_id, pet1, 'vaccination', 'Rabies vaccination', current_date - interval '400 days', current_date - interval '35 days'), -- overdue
    (demo_owner_id, pet1, 'vaccination', 'DHPPi (distemper/parvo) booster', current_date - interval '200 days', current_date + interval '20 days'), -- upcoming
    (demo_owner_id, pet1, 'vet_visit', 'Annual checkup — healthy, 24kg', current_date - interval '200 days', null),
    (demo_owner_id, pet1, 'vet_visit', 'Treated for mild ear infection', current_date - interval '60 days', null),
    (demo_owner_id, pet1, 'vaccination', 'Bordetella (kennel cough)', current_date - interval '30 days', current_date + interval '335 days'); -- fine, not due soon
end $$;
