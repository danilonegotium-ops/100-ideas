-- Simple Client Portal — schema.sql
--
-- Run against the shared Supabase project's SQL editor. Tables namespaced
-- `simple_client_portal_*` per the sprint's shared-project convention.
-- Storage bucket + object policies are in storage.sql (not plain table
-- DDL, see that file for why it's separate).
--
-- Data model / access model:
-- * A "freelancer" is an authenticated user who owns a `project` via
--   `freelancer_id`.
-- * A "client" is invited by email (`project_clients.client_email`, no
--   separate signup flow) and gets access the moment they log in via the
--   template's existing magic-link `/login` with that same email — the
--   same "email is the identity" pattern as Vrtic Management Tool's parent
--   access, just for one project instead of a whole group's kids.
-- * Freelancer and client visibility is unified behind three SECURITY
--   DEFINER helper functions (`scp_is_freelancer`, `scp_is_invited_client`,
--   `scp_is_project_member`) for the same reason as Vrtic's helpers:
--   `projects` and `project_clients` policies would otherwise need to
--   query each other directly, which is a real RLS circular-dependency
--   risk (project_clients' policy checking "am I the freelancer of this
--   project" would subquery `projects`, whose own policy subqueries
--   `project_clients` right back). SECURITY DEFINER functions bypass RLS
--   internally, breaking that cycle.
-- * Per the brief ("freelancers share files and project updates WITH
--   clients" — one-directional), only the freelancer can POST updates or
--   upload files. Clients have read-only access to both. This is a
--   deliberate scope call, not an oversight — see SPEC.md.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table if not exists simple_client_portal_projects (
  id uuid primary key default gen_random_uuid(),
  freelancer_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists simple_client_portal_project_clients (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references simple_client_portal_projects(id) on delete cascade,
  client_email text not null,
  invited_at timestamptz not null default now(),
  unique (project_id, client_email)
);

create table if not exists simple_client_portal_project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references simple_client_portal_projects(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists simple_client_portal_project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references simple_client_portal_projects(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  -- object path inside the `simple_client_portal_files` Storage bucket,
  -- always "<project_id>/<generated-filename>" — see storage.sql, whose
  -- object-level RLS policies parse this same prefix.
  storage_path text not null,
  file_name text not null,
  size_bytes bigint,
  content_type text,
  created_at timestamptz not null default now()
);

create index if not exists idx_scp_project_clients_project on simple_client_portal_project_clients(project_id);
create index if not exists idx_scp_project_updates_project on simple_client_portal_project_updates(project_id);
create index if not exists idx_scp_project_files_project on simple_client_portal_project_files(project_id);

-- ---------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER — see the comment block at the top
-- of this file for why they're needed to avoid RLS circularity).
-- ---------------------------------------------------------------------

create or replace function scp_is_freelancer(p_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from simple_client_portal_projects p
    where p.id = p_project_id and p.freelancer_id = auth.uid()
  );
$$;

create or replace function scp_is_invited_client(p_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from simple_client_portal_project_clients pc
    where pc.project_id = p_project_id
      and lower(pc.client_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function scp_is_project_member(p_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select scp_is_freelancer(p_project_id) or scp_is_invited_client(p_project_id);
$$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table simple_client_portal_projects enable row level security;
alter table simple_client_portal_project_clients enable row level security;
alter table simple_client_portal_project_updates enable row level security;
alter table simple_client_portal_project_files enable row level security;

-- projects: any member (freelancer or invited client) can read; only the
-- freelancer can write.
create policy "projects select" on simple_client_portal_projects
  for select to authenticated using (scp_is_project_member(id));
create policy "projects freelancer insert" on simple_client_portal_projects
  for insert to authenticated with check (auth.uid() = freelancer_id);
create policy "projects freelancer update" on simple_client_portal_projects
  for update to authenticated using (scp_is_freelancer(id)) with check (scp_is_freelancer(id));
create policy "projects freelancer delete" on simple_client_portal_projects
  for delete to authenticated using (scp_is_freelancer(id));

-- project_clients: the freelancer manages invites; an invited client can
-- see their own invite row (so the UI can show "you were invited to X").
create policy "project_clients select" on simple_client_portal_project_clients
  for select to authenticated using (
    scp_is_freelancer(project_id)
    or lower(client_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
create policy "project_clients freelancer insert" on simple_client_portal_project_clients
  for insert to authenticated with check (scp_is_freelancer(project_id));
create policy "project_clients freelancer delete" on simple_client_portal_project_clients
  for delete to authenticated using (scp_is_freelancer(project_id));

-- project_updates: any member reads; only the freelancer posts (see the
-- "one-directional by design" note at the top of this file).
create policy "project_updates select" on simple_client_portal_project_updates
  for select to authenticated using (scp_is_project_member(project_id));
create policy "project_updates freelancer insert" on simple_client_portal_project_updates
  for insert to authenticated with check (
    scp_is_freelancer(project_id) and auth.uid() = author_id
  );
create policy "project_updates freelancer delete" on simple_client_portal_project_updates
  for delete to authenticated using (scp_is_freelancer(project_id));

-- project_files: any member reads (incl. generating a signed download URL,
-- which itself checks this same SELECT policy); only the freelancer
-- uploads/deletes.
create policy "project_files select" on simple_client_portal_project_files
  for select to authenticated using (scp_is_project_member(project_id));
create policy "project_files freelancer insert" on simple_client_portal_project_files
  for insert to authenticated with check (
    scp_is_freelancer(project_id) and auth.uid() = uploaded_by
  );
create policy "project_files freelancer delete" on simple_client_portal_project_files
  for delete to authenticated using (scp_is_freelancer(project_id));
