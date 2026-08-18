-- Roommate Matcher — schema.sql
--
-- Run against the shared Supabase project once it exists. Tables
-- namespaced `roommate_matcher_` per docs/PLAN.md.
--
-- `user_id` columns are plain `uuid`, not a foreign key to `auth.users` —
-- same reasoning as every Wave 3 idea in this batch (RLS via `auth.uid()`
-- is the real enforcement mechanism; see the fuller note in
-- digital-time-capsule/schema.sql). Here it also matters more than usual:
-- the brief explicitly wants ~10 varied demo profiles, which would be
-- impossible to seed if `user_id` required 10 already-existing real
-- accounts.

create table if not exists roommate_matcher_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  display_name text not null check (char_length(display_name) > 0),
  city text not null check (city in ('Belgrade', 'Novi Sad')),
  area text,
  university text,
  budget_min integer not null check (budget_min > 0),
  budget_max integer not null check (budget_max >= budget_min),
  sleep_schedule text not null check (sleep_schedule in ('early_bird', 'night_owl', 'flexible')),
  cleanliness text not null check (cleanliness in ('very_clean', 'average', 'messy')),
  social_style text not null check (social_style in ('quiet', 'social', 'mixed')),
  smoker boolean not null default false,
  pets_ok boolean not null default false,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists roommate_matcher_profiles_city_idx on roommate_matcher_profiles (city);

create table if not exists roommate_matcher_interests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null,
  to_user_id uuid not null,
  created_at timestamptz not null default now(),
  unique (from_user_id, to_user_id),
  check (from_user_id <> to_user_id)
);

create index if not exists roommate_matcher_interests_from_idx on roommate_matcher_interests (from_user_id);
create index if not exists roommate_matcher_interests_to_idx on roommate_matcher_interests (to_user_id);

alter table roommate_matcher_profiles enable row level security;
alter table roommate_matcher_interests enable row level security;

-- Browsing requires login (not public) — a reasonable privacy default for
-- profiles that include budget and lifestyle details, unlike e.g.
-- concert-buddy's public event board.
create policy "profiles_select_authenticated"
  on roommate_matcher_profiles for select
  using (auth.uid() is not null);

create policy "profiles_insert_own"
  on roommate_matcher_profiles for insert
  with check (user_id = auth.uid());

create policy "profiles_update_own"
  on roommate_matcher_profiles for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "profiles_delete_own"
  on roommate_matcher_profiles for delete
  using (user_id = auth.uid());

-- "Interested" is visible to both sides once expressed — either party can
-- see a given interest row, which is what makes mutual interest ("both
-- expressed interest in each other") detectable by the app: query both
-- directions and check if both rows exist.
create policy "interests_select_either_party"
  on roommate_matcher_interests for select
  using (from_user_id = auth.uid() or to_user_id = auth.uid());

create policy "interests_insert_own"
  on roommate_matcher_interests for insert
  with check (from_user_id = auth.uid());

create policy "interests_delete_own"
  on roommate_matcher_interests for delete
  using (from_user_id = auth.uid());

-- Seed data ----------------------------------------------------------
-- 10 varied demo profiles across both cities, spanning the full lifestyle
-- tag space, under synthetic user ids (see the design note above for why
-- these don't need real accounts to exist first).
insert into roommate_matcher_profiles
  (user_id, display_name, city, area, university, budget_min, budget_max, sleep_schedule, cleanliness, social_style, smoker, pets_ok, bio)
values
  ('00000000-0000-0000-0000-0000000000e1', 'Mila', 'Belgrade', 'Vracar', 'University of Belgrade', 250, 350, 'early_bird', 'very_clean', 'quiet', false, true, 'Med student, studying odd hours but tidy and quiet. Have a cat, hoping for a pet-friendly place.'),
  ('00000000-0000-0000-0000-0000000000e2', 'Stefan', 'Belgrade', 'Novi Beograd', 'Singidunum University', 200, 280, 'night_owl', 'messy', 'social', true, false, 'Design student, up late working, don''t mind a lived-in apartment. Enjoy having people over.'),
  ('00000000-0000-0000-0000-0000000000e3', 'Jovana', 'Belgrade', 'Zvezdara', 'University of Belgrade', 300, 400, 'flexible', 'average', 'mixed', false, false, 'Grad student, schedule varies with my thesis work. Easygoing about most things.'),
  ('00000000-0000-0000-0000-0000000000e4', 'Aleksa', 'Belgrade', 'Vozdovac', 'University of Belgrade', 220, 300, 'early_bird', 'very_clean', 'quiet', false, false, 'Engineering student, early classes most days. Like a clean, quiet place to actually study.'),
  ('00000000-0000-0000-0000-0000000000e5', 'Teodora', 'Belgrade', 'Stari Grad', 'Faculty of Philology', 280, 380, 'night_owl', 'average', 'social', false, true, 'Language student, love hosting friends on weekends. Have a small dog.'),
  ('00000000-0000-0000-0000-0000000000e6', 'Nikola', 'Novi Sad', 'Liman', 'University of Novi Sad', 200, 300, 'flexible', 'very_clean', 'quiet', false, false, 'CS student, mostly online classes so schedule is flexible. Keep things tidy.'),
  ('00000000-0000-0000-0000-0000000000e7', 'Ivana', 'Novi Sad', 'Grbavica', 'University of Novi Sad', 250, 350, 'early_bird', 'average', 'mixed', false, true, 'Vet student, early mornings at the clinic. Fine with pets around, have my own.'),
  ('00000000-0000-0000-0000-0000000000e8', 'Marko', 'Novi Sad', 'Detelinara', 'Faculty of Technical Sciences', 180, 260, 'night_owl', 'messy', 'social', true, false, 'Mechanical engineering, work on projects late into the night. Looking for someone laid-back.'),
  ('00000000-0000-0000-0000-0000000000e9', 'Katarina', 'Novi Sad', 'Liman', 'University of Novi Sad', 300, 400, 'flexible', 'very_clean', 'quiet', false, true, 'PhD student, need a calm place to write. Have a cat, very house-trained.'),
  ('00000000-0000-0000-0000-0000000000ea', 'Filip', 'Novi Sad', 'Centar', 'University of Novi Sad', 220, 320, 'early_bird', 'average', 'social', false, false, 'Economics student, active mornings, enjoy a social apartment on weekends.');

-- A couple of demo interests, including one mutual pair (Mila <-> Aleksa,
-- both early_bird/very_clean/quiet Belgrade students — should also score
-- highly via lib/compatibility.ts) so the "mutual match" UI state has
-- something to show.
insert into roommate_matcher_interests (from_user_id, to_user_id)
values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000e4'),
  ('00000000-0000-0000-0000-0000000000e4', '00000000-0000-0000-0000-0000000000e1'),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000e5');
