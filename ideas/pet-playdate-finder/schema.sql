-- Pet Playdate Finder — schema.sql
-- Run against the shared Supabase project's SQL editor. Table names are
-- namespaced `pet_playdate_finder_*` per docs/PLAN.md's shared-project
-- convention.
--
-- ============================================================================
-- Demo user note
-- ----------------------------------------------------------------------------
-- Seed dogs below are split across TWO placeholder demo users:
--   '00000000-0000-0000-0000-000000000001' (owns 4 dogs)
--   '00000000-0000-0000-0000-000000000002' (owns 4 dogs)
-- Two demo owners, not one, so the match flow ("interested" from both
-- sides) is actually demonstrable — logging in as either demo user shows
-- one pre-seeded mutual match plus several browsable candidates. auth.users
-- is managed by Supabase Auth, not by this file. Before running the
-- INSERTs at the bottom, either:
--   (a) sign up as two real users via the app's magic-link flow (/login),
--       then run `update pet_playdate_finder_dogs set owner_id = '<real-uuid>'
--       where owner_id = '00000000-0000-0000-0000-00000000000X';` for each, or
--   (b) create users with those exact UUIDs via Supabase Dashboard ->
--       Authentication -> Users -> Add user, then run the seed INSERTs
--       as-is.
-- Until at least one of those exists, the seed INSERTs will fail with a
-- foreign key violation — expected, not a bug.
-- ============================================================================

create extension if not exists pgcrypto;

create table if not exists pet_playdate_finder_dogs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  breed text,
  size text check (size in ('small', 'medium', 'large')),
  energy_level text check (energy_level in ('low', 'medium', 'high')),
  neighborhood text not null,
  bio text,
  photo_url text,
  created_at timestamptz not null default now()
);

create index if not exists pet_playdate_finder_dogs_owner_id_idx
  on pet_playdate_finder_dogs (owner_id);

-- A "swipe" records one dog's owner saying yes/no to another dog. A match
-- exists when two reciprocal 'yes' rows exist (A→B and B→A) — computed at
-- query time (see components/Swiper.tsx), no separate matches table.
create table if not exists pet_playdate_finder_swipes (
  id uuid primary key default gen_random_uuid(),
  from_dog_id uuid not null references pet_playdate_finder_dogs(id) on delete cascade,
  to_dog_id uuid not null references pet_playdate_finder_dogs(id) on delete cascade,
  direction text not null check (direction in ('yes', 'no')),
  created_at timestamptz not null default now(),
  unique (from_dog_id, to_dog_id),
  check (from_dog_id <> to_dog_id)
);

create index if not exists pet_playdate_finder_swipes_from_dog_id_idx
  on pet_playdate_finder_swipes (from_dog_id);
create index if not exists pet_playdate_finder_swipes_to_dog_id_idx
  on pet_playdate_finder_swipes (to_dog_id);

-- Row Level Security.
alter table pet_playdate_finder_dogs enable row level security;
alter table pet_playdate_finder_swipes enable row level security;

-- Dogs: browsing requires being logged in (this is a Tinder-style app —
-- you need your own profile to participate), but any logged-in user can
-- see any dog, not just ones in their own neighborhood (neighborhood
-- filtering is a client-side convenience filter over free-text, not an
-- access control boundary — see components/Swiper.tsx). Only the owner can
-- create/edit/delete their own dog's profile.
create policy pet_playdate_finder_dogs_select_authenticated
  on pet_playdate_finder_dogs
  for select
  using (auth.uid() is not null);

create policy pet_playdate_finder_dogs_insert_own
  on pet_playdate_finder_dogs
  for insert
  with check (auth.uid() = owner_id);

create policy pet_playdate_finder_dogs_update_own
  on pet_playdate_finder_dogs
  for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy pet_playdate_finder_dogs_delete_own
  on pet_playdate_finder_dogs
  for delete
  using (auth.uid() = owner_id);

-- Swipes: a user can see swipes where they own either side (their own
-- outgoing swipes, so the UI doesn't re-show a dog they already swiped on;
-- and incoming swipes on their own dog(s), so matches can be computed).
-- This MVP does NOT hide incoming "likes" before you reciprocate (unlike
-- real Tinder's blind-swipe mechanic) — simplification, not a stated
-- requirement; see SPEC.md.
create policy pet_playdate_finder_swipes_select_involving_own_dog
  on pet_playdate_finder_swipes
  for select
  using (
    exists (
      select 1 from pet_playdate_finder_dogs d
      where d.id = pet_playdate_finder_swipes.from_dog_id
        and d.owner_id = auth.uid()
    )
    or exists (
      select 1 from pet_playdate_finder_dogs d
      where d.id = pet_playdate_finder_swipes.to_dog_id
        and d.owner_id = auth.uid()
    )
  );

create policy pet_playdate_finder_swipes_insert_own_dog
  on pet_playdate_finder_swipes
  for insert
  with check (
    exists (
      select 1 from pet_playdate_finder_dogs d
      where d.id = pet_playdate_finder_swipes.from_dog_id
        and d.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- Seed data — 8 demo dog profiles split across two demo owners, plus one
-- pre-seeded mutual match. Run only after both demo users exist (see note
-- above).
-- ============================================================================

insert into pet_playdate_finder_dogs (id, owner_id, name, breed, size, energy_level, neighborhood, bio)
values
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Buddy', 'Labrador Retriever', 'large', 'high', 'Vracar', 'Loves fetch, loves everyone, has zero chill.'),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Luna', 'Border Collie', 'medium', 'high', 'Vracar', 'Needs a job or she will find one (usually your shoes).'),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Max', 'French Bulldog', 'small', 'low', 'Novi Beograd', 'Short walks, long naps.'),
  ('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Bella', 'Beagle', 'medium', 'medium', 'Zemun', 'Follows her nose, occasionally comes back.'),
  ('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'Rex', 'German Shepherd', 'large', 'medium', 'Vracar', 'Well trained, good with other dogs, suspicious of scooters.'),
  ('30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 'Mia', 'Poodle', 'small', 'medium', 'Vracar', 'Smarter than most humans she has met.'),
  ('30000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', 'Zeus', 'Siberian Husky', 'large', 'high', 'Novi Beograd', 'Will out-walk you every single time.'),
  ('30000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000002', 'Coco', 'Dachshund', 'small', 'low', 'Zemun', 'Big personality, small legs.');

-- Buddy (demo user 1) and Rex (demo user 2) are already a mutual match.
insert into pet_playdate_finder_swipes (from_dog_id, to_dog_id, direction)
values
  ('30000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', 'yes'),
  ('30000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000001', 'yes');
