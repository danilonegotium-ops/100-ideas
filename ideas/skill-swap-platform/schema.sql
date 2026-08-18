-- Skill Swap Platform — schema.sql
--
-- Run against the shared Supabase project. Tables namespaced
-- `skill_swap_platform_*` per the shared nextjs-template convention.
--
-- Seeding note: `profiles.user_id` is a NULLABLE, UNIQUE foreign key into
-- `auth.users`. Demo profiles below use `user_id = NULL` so we don't have
-- to hand-write rows into Supabase's internal `auth.users` table (its exact
-- required columns aren't something to guess at without a live project).
-- Real profiles created through the app always have
-- `user_id = auth.uid()` (enforced by the INSERT/UPDATE policies), so
-- there's at most one real profile per real user.

create table if not exists skill_swap_platform_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  display_name text not null,
  bio text,
  skills_teach text[] not null default '{}',
  skills_learn text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists skill_swap_platform_swaps (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid not null references auth.users(id) on delete cascade,
  target_profile_id uuid not null references skill_swap_platform_profiles(id) on delete cascade,
  offered_skill text not null,
  requested_skill text not null,
  message text,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists skill_swap_platform_swaps_requester_idx
  on skill_swap_platform_swaps (requester_user_id);
create index if not exists skill_swap_platform_swaps_target_idx
  on skill_swap_platform_swaps (target_profile_id);
create index if not exists skill_swap_platform_profiles_skills_teach_idx
  on skill_swap_platform_profiles using gin (skills_teach);
create index if not exists skill_swap_platform_profiles_skills_learn_idx
  on skill_swap_platform_profiles using gin (skills_learn);

-- Row Level Security -----------------------------------------------------

alter table skill_swap_platform_profiles enable row level security;
alter table skill_swap_platform_swaps enable row level security;

-- Profiles: browsable by anyone. Only the owning user can create/edit/
-- delete their own profile.
create policy skill_swap_platform_profiles_select_all
  on skill_swap_platform_profiles for select
  using (true);

create policy skill_swap_platform_profiles_insert_own
  on skill_swap_platform_profiles for insert
  to authenticated
  with check (user_id = auth.uid());

create policy skill_swap_platform_profiles_update_own
  on skill_swap_platform_profiles for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy skill_swap_platform_profiles_delete_own
  on skill_swap_platform_profiles for delete
  to authenticated
  using (user_id = auth.uid());

-- Swaps: visible to the requester and to the target profile's owner only
-- (a proposed swap is private between the two parties, not public).
create policy skill_swap_platform_swaps_select_involved
  on skill_swap_platform_swaps for select
  to authenticated
  using (
    requester_user_id = auth.uid()
    or target_profile_id in (
      select id from skill_swap_platform_profiles where user_id = auth.uid()
    )
  );

create policy skill_swap_platform_swaps_insert_own
  on skill_swap_platform_swaps for insert
  to authenticated
  with check (requester_user_id = auth.uid());

-- Either party can update status (requester cancels, target accepts/declines).
create policy skill_swap_platform_swaps_update_involved
  on skill_swap_platform_swaps for update
  to authenticated
  using (
    requester_user_id = auth.uid()
    or target_profile_id in (
      select id from skill_swap_platform_profiles where user_id = auth.uid()
    )
  )
  with check (
    requester_user_id = auth.uid()
    or target_profile_id in (
      select id from skill_swap_platform_profiles where user_id = auth.uid()
    )
  );

grant select on skill_swap_platform_profiles to anon, authenticated;
grant insert, update, delete on skill_swap_platform_profiles to authenticated;
grant select, insert, update on skill_swap_platform_swaps to authenticated;

-- Seed data: ~8 demo profiles with varied skills ---------------------------

insert into skill_swap_platform_profiles (id, user_id, display_name, bio, skills_teach, skills_learn) values
  ('22222222-2222-2222-2222-222222222201', null, 'Maya R.', 'Front-end dev by day, always got a synth patch cooking by night.', array['Photoshop', 'UI Design'], array['Piano', 'Music Theory']),
  ('22222222-2222-2222-2222-222222222202', null, 'Jonas K.', 'Native German speaker, learning to actually cook something besides pasta.', array['German', 'Excel'], array['Cooking', 'Knife Skills']),
  ('22222222-2222-2222-2222-222222222203', null, 'Aiko T.', 'Yoga instructor for 6 years, curious about coding for the first time.', array['Yoga', 'Meditation'], array['Python', 'Web Development']),
  ('22222222-2222-2222-2222-222222222204', null, 'Sam O.', 'Guitarist in a cover band, terrible at anything involving spreadsheets.', array['Guitar', 'Music Production'], array['Excel', 'Personal Finance']),
  ('22222222-2222-2222-2222-222222222205', null, 'Priya N.', 'Data analyst who wants to finally learn to paint.', array['Excel', 'SQL', 'Data Visualization'], array['Watercolor Painting']),
  ('22222222-2222-2222-2222-222222222206', null, 'Luca B.', 'Chef at a small trattoria, wants to pick up basic web design for a personal site.', array['Cooking', 'Italian'], array['Web Design', 'Photoshop']),
  ('22222222-2222-2222-2222-222222222207', null, 'Hannah W.', 'English teacher, would love to finally learn Spanish properly.', array['English', 'Public Speaking'], array['Spanish']),
  ('22222222-2222-2222-2222-222222222208', null, 'Devon P.', 'Photographer, chasing a decent golf swing this year.', array['Photography', 'Lightroom'], array['Golf'])
on conflict (id) do nothing;
