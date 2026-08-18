-- Local Sports Buddy — schema.sql
-- Run against the shared Supabase project. Table names namespaced
-- `local_sports_buddy_*` per docs/PLAN.md's convention.
--
-- Model: a public UGC directory. Unlike the other 4 ideas in this batch,
-- browsing is intentionally open to everyone (logged in or not) — you
-- shouldn't need an account just to see who's looking to play nearby.
-- Creating a profile/listing/expressing interest requires being logged in
-- (magic-link), so there's a real identity behind each action.

create extension if not exists pgcrypto;

create table if not exists local_sports_buddy_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  -- Curated tag list (see lib/sports/constants.ts SPORTS) rather than free
  -- text, so browse-page filtering by sport is exact-match, not a fuzzy
  -- "football" vs "Football" vs "soccer" guessing game.
  sports text[] not null default '{}',
  -- Free text on purpose — "general area/city", not precise geolocation,
  -- per the brief's own privacy-minded framing.
  city text not null,
  created_at timestamptz not null default now(),
  unique (owner_id) -- one profile per user
);

create table if not exists local_sports_buddy_listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references local_sports_buddy_profiles(id) on delete cascade,
  sport text not null,
  city text not null,
  -- Free text ("Saturday 6pm", "Tue evenings") rather than a strict
  -- timestamp — real pickup games are scheduled this loosely in practice,
  -- and it avoids forcing a single rigid recurrence model into an MVP.
  day_time text not null,
  location_description text not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

create index if not exists local_sports_buddy_listings_owner_id_idx
  on local_sports_buddy_listings (owner_id);

create index if not exists local_sports_buddy_listings_sport_city_idx
  on local_sports_buddy_listings (sport, city);

create table if not exists local_sports_buddy_interests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references local_sports_buddy_listings(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references local_sports_buddy_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (listing_id, profile_id) -- one "I'm in" per person per listing
);

create index if not exists local_sports_buddy_interests_listing_id_idx
  on local_sports_buddy_interests (listing_id);

-- Row Level Security -----------------------------------------------------

alter table local_sports_buddy_profiles enable row level security;
alter table local_sports_buddy_listings enable row level security;
alter table local_sports_buddy_interests enable row level security;

-- Profiles: publicly readable (browsing listings needs to show who
-- posted them), owner-only writes.
create policy "public can read profiles" on local_sports_buddy_profiles
  for select to anon, authenticated using (true);

create policy "owner can manage own profile" on local_sports_buddy_profiles
  for insert to authenticated with check (auth.uid() = owner_id);

create policy "owner can update own profile" on local_sports_buddy_profiles
  for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "owner can delete own profile" on local_sports_buddy_profiles
  for delete to authenticated using (auth.uid() = owner_id);

-- Listings: publicly readable ("browse open listings" needs no login),
-- owner-only writes, and a listing can only be created against a profile
-- the same user actually owns (prevents posting under someone else's
-- profile id even though `owner_id` itself is separately checked).
create policy "public can read listings" on local_sports_buddy_listings
  for select to anon, authenticated using (true);

create policy "owner can create listings" on local_sports_buddy_listings
  for insert to authenticated
  with check (
    auth.uid() = owner_id
    and exists (
      select 1 from local_sports_buddy_profiles p
      where p.id = profile_id and p.owner_id = auth.uid()
    )
  );

create policy "owner can update own listings" on local_sports_buddy_listings
  for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "owner can delete own listings" on local_sports_buddy_listings
  for delete to authenticated using (auth.uid() = owner_id);

-- Interests: publicly readable (so anyone browsing can see "3 people are
-- in" and a listing owner can see who to contact), owner-only writes, and
-- (like listings) can only be created against a profile the same user
-- owns.
create policy "public can read interests" on local_sports_buddy_interests
  for select to anon, authenticated using (true);

create policy "owner can express interest" on local_sports_buddy_interests
  for insert to authenticated
  with check (
    auth.uid() = owner_id
    and exists (
      select 1 from local_sports_buddy_profiles p
      where p.id = profile_id and p.owner_id = auth.uid()
    )
  );

create policy "owner can retract interest" on local_sports_buddy_interests
  for delete to authenticated using (auth.uid() = owner_id);

-- Seed data ---------------------------------------------------------------
-- Demo profiles/listings need real `auth.users` rows for `owner_id`. Since
-- this idea is a public directory, seed data uses several distinct demo
-- users (one per demo profile), not just one like the other 4 ideas in
-- this batch. Once the shared Supabase project is live: create these demo
-- users (e.g. sign up once each via magic-link with throwaway emails —
-- sport-demo-1@100ideas.dev, sport-demo-2@100ideas.dev, etc.), find their
-- ids under Authentication > Users, and replace the placeholder UUIDs
-- below before running this block.

do $$
declare
  u1 uuid := '00000000-0000-0000-0000-000000000001';
  u2 uuid := '00000000-0000-0000-0000-000000000002';
  u3 uuid := '00000000-0000-0000-0000-000000000003';
  u4 uuid := '00000000-0000-0000-0000-000000000004';
  u5 uuid := '00000000-0000-0000-0000-000000000005';
  u6 uuid := '00000000-0000-0000-0000-000000000006';
  p1 uuid := gen_random_uuid();
  p2 uuid := gen_random_uuid();
  p3 uuid := gen_random_uuid();
  p4 uuid := gen_random_uuid();
  p5 uuid := gen_random_uuid();
  p6 uuid := gen_random_uuid();
  l1 uuid := gen_random_uuid();
  l2 uuid := gen_random_uuid();
begin
  insert into local_sports_buddy_profiles (id, owner_id, name, sports, city) values
    (p1, u1, 'Marko', array['Basketball', 'Football'], 'Belgrade - Vracar'),
    (p2, u2, 'Ana',   array['Tennis'],                  'Belgrade - Novi Beograd'),
    (p3, u3, 'Nikola',array['Football', 'Padel'],       'Belgrade - Zemun'),
    (p4, u4, 'Jovana',array['Volleyball', 'Running'],   'Novi Sad - Liman'),
    (p5, u5, 'Stefan',array['Basketball'],               'Novi Sad - Detelinara'),
    (p6, u6, 'Milica',array['Badminton', 'Table Tennis'],'Belgrade - Vracar');

  insert into local_sports_buddy_listings
    (id, owner_id, profile_id, sport, city, day_time, location_description, status) values
    (l1, u1, p1, 'Basketball', 'Belgrade - Vracar', 'Saturday 10:00', 'Karadjordjev park outdoor court', 'open'),
    (l2, u2, p2, 'Tennis', 'Belgrade - Novi Beograd', 'Sunday 18:00', 'TC Novak Tennis Center, court 3', 'open'),
    (gen_random_uuid(), u3, p3, 'Football', 'Belgrade - Zemun', 'Tuesday 19:30', 'Zemun Park 5-a-side pitch', 'open'),
    (gen_random_uuid(), u4, p4, 'Volleyball', 'Novi Sad - Liman', 'Wednesday 20:00', 'Liman beach volleyball courts', 'open'),
    (gen_random_uuid(), u5, p5, 'Basketball', 'Novi Sad - Detelinara', 'Friday 17:00', 'Detelinara outdoor court near the school', 'open'),
    (gen_random_uuid(), u1, p1, 'Football', 'Belgrade - Vracar', 'Sunday 11:00', 'Kalemegdan lower courts', 'open'),
    (gen_random_uuid(), u6, p6, 'Badminton', 'Belgrade - Vracar', 'Thursday 19:00', 'SC Vracar sports hall', 'open'),
    (gen_random_uuid(), u3, p3, 'Padel', 'Belgrade - Zemun', 'Saturday 16:00', 'Padel Point Zemun, court 2', 'open');

  insert into local_sports_buddy_interests (listing_id, owner_id, profile_id) values
    (l1, u3, p3),
    (l1, u5, p5),
    (l2, u6, p6);
end $$;
