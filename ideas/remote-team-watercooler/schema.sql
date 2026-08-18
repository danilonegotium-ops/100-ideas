-- Remote Team Watercooler — schema.sql
-- Run against the shared Supabase project. Table names are namespaced
-- `remote_team_watercooler_*` per docs/PLAN.md's convention.
--
-- Model: the logged-in user ("admin") owns a roster of team members and
-- runs weekly pairings. Members themselves never log in — each member gets
-- a random `share_token` that resolves to a public, read-only "your
-- pairing this week" page (see app/m/[token]/page.tsx), served through a
-- service-role Route Handler that authorizes purely by matching the token
-- (see lib/supabase/admin.ts for why RLS alone can't cover that route).

create extension if not exists pgcrypto; -- gen_random_uuid() — Supabase projects normally already have this enabled, `if not exists` makes this idempotent either way.

create table if not exists remote_team_watercooler_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  share_token uuid not null default gen_random_uuid(),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists remote_team_watercooler_members_share_token_key
  on remote_team_watercooler_members (share_token);

create index if not exists remote_team_watercooler_members_owner_id_idx
  on remote_team_watercooler_members (owner_id);

create table if not exists remote_team_watercooler_pairing_weeks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  created_at timestamptz not null default now()
);

create index if not exists remote_team_watercooler_pairing_weeks_owner_id_idx
  on remote_team_watercooler_pairing_weeks (owner_id);

create table if not exists remote_team_watercooler_pairings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  week_id uuid not null references remote_team_watercooler_pairing_weeks(id) on delete cascade,
  -- 2 members normally, 3 when the roster is odd for that week.
  member_ids uuid[] not null,
  meeting_link text not null default '',
  created_at timestamptz not null default now(),
  constraint remote_team_watercooler_pairings_member_count check (array_length(member_ids, 1) between 2 and 3)
);

create index if not exists remote_team_watercooler_pairings_week_id_idx
  on remote_team_watercooler_pairings (week_id);

create index if not exists remote_team_watercooler_pairings_owner_id_idx
  on remote_team_watercooler_pairings (owner_id);

-- Row Level Security -----------------------------------------------------
-- Every table is owner-only via RLS. The `/m/[token]` public member view
-- deliberately does NOT get a public RLS policy — it goes through the
-- service-role client instead (see lib/supabase/admin.ts), because RLS has
-- no way to express "this anonymous visitor may see exactly one member's
-- row, looked up by a token they hold" without a security-definer
-- function; a service-role route with a hand-checked token match is the
-- simpler, equally-safe option for an MVP.

alter table remote_team_watercooler_members enable row level security;
alter table remote_team_watercooler_pairing_weeks enable row level security;
alter table remote_team_watercooler_pairings enable row level security;

create policy "owner full access" on remote_team_watercooler_members
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "owner full access" on remote_team_watercooler_pairing_weeks
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "owner full access" on remote_team_watercooler_pairings
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Seed data ---------------------------------------------------------------
-- `owner_id` is a real foreign key into `auth.users`, so seeding requires
-- an actual demo user to exist first. Once the shared Supabase project is
-- live: sign up once via this app's magic-link login with a demo email
-- (e.g. demo@100ideas.dev), find that user's id under
-- Authentication > Users in the Supabase dashboard, and replace every
-- '00000000-0000-0000-0000-000000000001' placeholder below with it before
-- running this block.

do $$
declare
  demo_owner_id uuid := '00000000-0000-0000-0000-000000000001';
  m1 uuid := gen_random_uuid();
  m2 uuid := gen_random_uuid();
  m3 uuid := gen_random_uuid();
  m4 uuid := gen_random_uuid();
  m5 uuid := gen_random_uuid();
  m6 uuid := gen_random_uuid();
  m7 uuid := gen_random_uuid();
  m8 uuid := gen_random_uuid();
  m9 uuid := gen_random_uuid();
  m10 uuid := gen_random_uuid();
  week1 uuid := gen_random_uuid();
begin
  insert into remote_team_watercooler_members (id, owner_id, name, email, active) values
    (m1, demo_owner_id, 'Ana Jovanovic', 'ana.jovanovic@example.com', true),
    (m2, demo_owner_id, 'Marko Petrovic', 'marko.petrovic@example.com', true),
    (m3, demo_owner_id, 'Jelena Nikolic', 'jelena.nikolic@example.com', true),
    (m4, demo_owner_id, 'Stefan Ilic', 'stefan.ilic@example.com', true),
    (m5, demo_owner_id, 'Milica Stankovic', 'milica.stankovic@example.com', true),
    (m6, demo_owner_id, 'Nikola Djordjevic', 'nikola.djordjevic@example.com', true),
    (m7, demo_owner_id, 'Tamara Radovic', 'tamara.radovic@example.com', true),
    (m8, demo_owner_id, 'Uros Simic', 'uros.simic@example.com', true),
    (m9, demo_owner_id, 'Ivana Kovacevic', 'ivana.kovacevic@example.com', true),
    (m10, demo_owner_id, 'Filip Maric', 'filip.maric@example.com', true);

  -- One past week's pairing history, so "avoid repeating last week's pairs"
  -- has something real to avoid on the next "run pairing" click.
  insert into remote_team_watercooler_pairing_weeks (id, owner_id, week_start) values
    (week1, demo_owner_id, date_trunc('week', now())::date - interval '7 days');

  -- 10 members (even), so last week was five clean pairs, no group of 3.
  insert into remote_team_watercooler_pairings (owner_id, week_id, member_ids, meeting_link) values
    (demo_owner_id, week1, array[m1, m2], 'https://meet.google.com/demo-ana-marko'),
    (demo_owner_id, week1, array[m3, m4], 'https://meet.google.com/demo-jelena-stefan'),
    (demo_owner_id, week1, array[m5, m6], ''),
    (demo_owner_id, week1, array[m7, m8], 'https://meet.google.com/demo-tamara-uros'),
    (demo_owner_id, week1, array[m9, m10], 'https://meet.google.com/demo-ivana-filip');
end $$;
