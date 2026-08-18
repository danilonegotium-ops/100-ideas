-- Concert Buddy — schema.sql
--
-- Run against the shared Supabase project once it exists. Tables
-- namespaced `concert_buddy_` per docs/PLAN.md.
--
-- `user_id` columns are plain `uuid`, not a foreign key to `auth.users`.
-- Ownership is enforced by RLS (`auth.uid() = user_id`), which needs no FK
-- to work correctly, and this lets the seed data below insert without a
-- live project's `auth.users` already containing matching accounts. See
-- the longer version of this note in digital-time-capsule/schema.sql.

create table if not exists concert_buddy_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  -- Snapshot of the poster's email at post time. PostgREST doesn't expose
  -- the `auth` schema, so this can't be looked up later via a join — it
  -- has to be denormalized here to show interested users how to reach the
  -- poster.
  user_email text not null,
  event_name text not null check (char_length(event_name) > 0),
  event_date date not null,
  city text not null check (char_length(city) > 0),
  note text,
  -- Optional extra contact info the poster wants to share beyond their
  -- account email (e.g. "DM my insta @handle instead").
  contact_hint text,
  is_filled boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists concert_buddy_listings_city_idx on concert_buddy_listings (city);
create index if not exists concert_buddy_listings_date_idx on concert_buddy_listings (event_date);
create index if not exists concert_buddy_listings_user_idx on concert_buddy_listings (user_id);

create table if not exists concert_buddy_interests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references concert_buddy_listings (id) on delete cascade,
  user_id uuid not null,
  user_email text not null,
  message text,
  created_at timestamptz not null default now(),
  -- Expressing interest is idempotent from the client's point of view —
  -- see app/api/listings/[id]/interest/route.ts, which treats a duplicate
  -- insert (this constraint firing) as a no-op success rather than an
  -- error.
  unique (listing_id, user_id)
);

create index if not exists concert_buddy_interests_listing_idx on concert_buddy_interests (listing_id);
create index if not exists concert_buddy_interests_user_idx on concert_buddy_interests (user_id);

alter table concert_buddy_listings enable row level security;
alter table concert_buddy_interests enable row level security;

-- Listings are a public, browsable board — no login needed to look.
create policy "listings_select_public"
  on concert_buddy_listings for select
  using (true);

create policy "listings_insert_own"
  on concert_buddy_listings for insert
  with check (user_id = auth.uid());

-- Lets a poster edit their note/contact info or toggle `is_filled`.
create policy "listings_update_own"
  on concert_buddy_listings for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "listings_delete_own"
  on concert_buddy_listings for delete
  using (user_id = auth.uid());

-- The "visible connection between poster and interested users": the
-- interested user can see their own row, and the poster can see every
-- interest row on their own listings (via the subquery). Other interested
-- users on the same listing can't see each other's interest — a
-- reasonable default privacy scope, not something the brief required
-- either way.
create policy "interests_select_own_or_posters"
  on concert_buddy_interests for select
  using (
    user_id = auth.uid()
    or listing_id in (
      select id from concert_buddy_listings where user_id = auth.uid()
    )
  );

create policy "interests_insert_own"
  on concert_buddy_interests for insert
  with check (user_id = auth.uid());

-- Lets someone withdraw interest.
create policy "interests_delete_own"
  on concert_buddy_interests for delete
  using (user_id = auth.uid());

-- Seed data --------------------------------------------------------------
-- Two synthetic posters and one synthetic "interested" demo user so the
-- owner-view interest list (app/listings/[id]/page.tsx) has something to
-- show without a real second account.
insert into concert_buddy_listings
  (id, user_id, user_email, event_name, event_date, city, note, contact_hint, is_filled)
values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c1', 'demo.poster1@example.com', 'EXIT Festival', current_date + interval '45 days', 'Novi Sad', 'Going all 4 nights, would love company for at least the main stage nights.', 'Insta @demo.poster1', false),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000c1', 'demo.poster1@example.com', 'Thirty Seconds to Mars', current_date + interval '20 days', 'Belgrade', 'Have an extra ticket-adjacent GA spot, looking for someone chill to go with.', null, false),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000c2', 'demo.poster2@example.com', 'Nisville Jazz Festival', current_date + interval '90 days', 'Nis', 'First time going, don''t know anyone else who''s into jazz.', null, false),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-0000000000c2', 'demo.poster2@example.com', 'Arctic Monkeys', current_date + interval '10 days', 'Belgrade', null, 'Email is easiest, I check it daily', false),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-0000000000c1', 'demo.poster1@example.com', 'Sea Dance Festival', current_date + interval '60 days', 'Budva', 'Road tripping down from Novi Sad, happy to split a car if you''re near me too.', null, false),
  ('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-0000000000c2', 'demo.poster2@example.com', 'Foals', current_date + interval '15 days', 'Belgrade', 'Small venue show, general vibe should be great.', null, true),
  ('20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-0000000000c1', 'demo.poster1@example.com', 'Guca Trumpet Festival', current_date + interval '120 days', 'Guca', 'Chaotic and loud in the best way, first-timers welcome.', null, false),
  ('20000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-0000000000c2', 'demo.poster2@example.com', 'Tame Impala', current_date + interval '30 days', 'Novi Sad', null, null, false);

insert into concert_buddy_interests (listing_id, user_id, user_email, message)
values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c3', 'demo.interested@example.com', 'I''m going all 4 nights too, would love to link up for at least a couple of sets!');
