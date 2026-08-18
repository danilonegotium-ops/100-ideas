-- Vrtic Management Tool — schema.sql
--
-- Run against the shared Supabase project's SQL editor. Tables namespaced
-- `vrtic_management_tool_*` per the sprint's shared-project convention.
--
-- Assumption (standard on a stock Supabase project): `anon`/`authenticated`
-- already have table-level GRANTs on the `public` schema by default — RLS
-- (enabled on every table below) is the real access gate.
--
-- Data model / access model:
-- * A "teacher" is an authenticated user (magic-link login) who owns a
--   `group` (one kindergarten class) via `teacher_id`.
-- * Unlike Digitalni Upravnik's public notice board, this data is about
--   children and is NOT meant to be world-readable — "share photos with
--   parents securely" in the brief means scoped to that group's actual
--   parents, not a public link. So instead of `using (true)`, parent read
--   access is granted via two SECURITY DEFINER helper functions that match
--   the logged-in user's JWT email against `child_contacts.parent_email`.
--   Parents authenticate the same way teachers do (magic link) — no
--   separate "parent account" concept, just an email match.
-- * `child_contacts` (parent name/email) is split out from `children`
--   (name/birth date) so it can stay strictly teacher-only, same PII
--   pattern as Digitalni Upravnik's `unit_contacts`.
-- * A parent can see: their OWN child's row in `children`/`attendance_records`
--   (not other children's), and the GROUP-level `daily_menus`/`photo_posts`
--   (shared content, not per-child, so any parent in the group can see it).
-- * `photo_posts` stores a `placeholder_key` (a fixed enum, not free text or
--   an uploaded image), rendered by the frontend as an illustrated
--   placeholder card — deliberately not real photos, and not raw
--   user-supplied SVG/HTML (which would be an XSS vector if ever rendered
--   unsanitized).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table if not exists vrtic_management_tool_groups (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists vrtic_management_tool_children (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references vrtic_management_tool_groups(id) on delete cascade,
  full_name text not null,
  birth_date date,
  created_at timestamptz not null default now()
);

create table if not exists vrtic_management_tool_child_contacts (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null unique references vrtic_management_tool_children(id) on delete cascade,
  parent_name text,
  parent_email text,
  created_at timestamptz not null default now()
);

create table if not exists vrtic_management_tool_attendance_records (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references vrtic_management_tool_children(id) on delete cascade,
  group_id uuid not null references vrtic_management_tool_groups(id) on delete cascade,
  attendance_date date not null default current_date,
  status text not null check (status in ('present', 'absent', 'sick', 'excused')),
  note text,
  created_at timestamptz not null default now(),
  unique (child_id, attendance_date)
);

create table if not exists vrtic_management_tool_daily_menus (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references vrtic_management_tool_groups(id) on delete cascade,
  menu_date date not null default current_date,
  breakfast text,
  lunch text,
  snack text,
  created_at timestamptz not null default now(),
  unique (group_id, menu_date)
);

create table if not exists vrtic_management_tool_photo_posts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references vrtic_management_tool_groups(id) on delete cascade,
  caption text not null,
  -- fixed set rendered by the frontend as an illustrated placeholder card —
  -- see components/PlaceholderIllustration.tsx for the key -> icon/color map.
  placeholder_key text not null check (
    placeholder_key in ('sun', 'balloons', 'painting', 'blocks', 'garden', 'nap', 'music', 'story')
  ),
  created_at timestamptz not null default now()
);

create index if not exists idx_vrtic_children_group on vrtic_management_tool_children(group_id);
create index if not exists idx_vrtic_attendance_group on vrtic_management_tool_attendance_records(group_id);
create index if not exists idx_vrtic_attendance_child on vrtic_management_tool_attendance_records(child_id);
create index if not exists idx_vrtic_daily_menus_group on vrtic_management_tool_daily_menus(group_id);
create index if not exists idx_vrtic_photo_posts_group on vrtic_management_tool_photo_posts(group_id);

-- ---------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so they can check parent<->child
-- linkage without granting parents direct SELECT on child_contacts, which
-- stays teacher-only). Each is a plain SQL function, cheap enough to use
-- directly inside RLS policies.
-- ---------------------------------------------------------------------

create or replace function vrtic_is_teacher(p_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from vrtic_management_tool_groups g
    where g.id = p_group_id and g.teacher_id = auth.uid()
  );
$$;

create or replace function vrtic_is_parent_of_child(p_child_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from vrtic_management_tool_child_contacts cc
    where cc.child_id = p_child_id
      and lower(cc.parent_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function vrtic_is_group_member(p_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    vrtic_is_teacher(p_group_id)
    or exists (
      select 1 from vrtic_management_tool_children c
      where c.group_id = p_group_id and vrtic_is_parent_of_child(c.id)
    );
$$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table vrtic_management_tool_groups enable row level security;
alter table vrtic_management_tool_children enable row level security;
alter table vrtic_management_tool_child_contacts enable row level security;
alter table vrtic_management_tool_attendance_records enable row level security;
alter table vrtic_management_tool_daily_menus enable row level security;
alter table vrtic_management_tool_photo_posts enable row level security;

-- groups: teacher sees/manages their own groups. Parents can see the group
-- row (name) for any group they're a member of (via vrtic_is_group_member),
-- so their view can show "Group: Sunčeva grupa" instead of a bare UUID.
create policy "groups select" on vrtic_management_tool_groups
  for select to authenticated using (
    teacher_id = auth.uid() or vrtic_is_group_member(id)
  );
create policy "groups teacher insert" on vrtic_management_tool_groups
  for insert to authenticated with check (auth.uid() = teacher_id);
create policy "groups teacher update" on vrtic_management_tool_groups
  for update to authenticated using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
create policy "groups teacher delete" on vrtic_management_tool_groups
  for delete to authenticated using (auth.uid() = teacher_id);

-- children: teacher sees all in their group; a parent sees only their own child.
create policy "children select" on vrtic_management_tool_children
  for select to authenticated using (
    vrtic_is_teacher(group_id) or vrtic_is_parent_of_child(id)
  );
create policy "children teacher insert" on vrtic_management_tool_children
  for insert to authenticated with check (vrtic_is_teacher(group_id));
create policy "children teacher update" on vrtic_management_tool_children
  for update to authenticated using (vrtic_is_teacher(group_id)) with check (vrtic_is_teacher(group_id));
create policy "children teacher delete" on vrtic_management_tool_children
  for delete to authenticated using (vrtic_is_teacher(group_id));

-- child_contacts: teacher-only, in and out (this is the PII table).
create policy "child_contacts teacher select" on vrtic_management_tool_child_contacts
  for select to authenticated using (
    exists (
      select 1 from vrtic_management_tool_children c
      where c.id = child_id and vrtic_is_teacher(c.group_id)
    )
  );
create policy "child_contacts teacher insert" on vrtic_management_tool_child_contacts
  for insert to authenticated with check (
    exists (
      select 1 from vrtic_management_tool_children c
      where c.id = child_id and vrtic_is_teacher(c.group_id)
    )
  );
create policy "child_contacts teacher update" on vrtic_management_tool_child_contacts
  for update to authenticated using (
    exists (
      select 1 from vrtic_management_tool_children c
      where c.id = child_id and vrtic_is_teacher(c.group_id)
    )
  ) with check (
    exists (
      select 1 from vrtic_management_tool_children c
      where c.id = child_id and vrtic_is_teacher(c.group_id)
    )
  );
create policy "child_contacts teacher delete" on vrtic_management_tool_child_contacts
  for delete to authenticated using (
    exists (
      select 1 from vrtic_management_tool_children c
      where c.id = child_id and vrtic_is_teacher(c.group_id)
    )
  );

-- attendance_records: teacher sees/manages all in their group; a parent
-- sees only records for their own child (read-only).
create policy "attendance select" on vrtic_management_tool_attendance_records
  for select to authenticated using (
    vrtic_is_teacher(group_id) or vrtic_is_parent_of_child(child_id)
  );
create policy "attendance teacher insert" on vrtic_management_tool_attendance_records
  for insert to authenticated with check (vrtic_is_teacher(group_id));
create policy "attendance teacher update" on vrtic_management_tool_attendance_records
  for update to authenticated using (vrtic_is_teacher(group_id)) with check (vrtic_is_teacher(group_id));
create policy "attendance teacher delete" on vrtic_management_tool_attendance_records
  for delete to authenticated using (vrtic_is_teacher(group_id));

-- daily_menus: group-wide shared content — any group member (teacher or
-- any parent in the group) can read; only the teacher writes.
create policy "daily_menus select" on vrtic_management_tool_daily_menus
  for select to authenticated using (vrtic_is_group_member(group_id));
create policy "daily_menus teacher insert" on vrtic_management_tool_daily_menus
  for insert to authenticated with check (vrtic_is_teacher(group_id));
create policy "daily_menus teacher update" on vrtic_management_tool_daily_menus
  for update to authenticated using (vrtic_is_teacher(group_id)) with check (vrtic_is_teacher(group_id));
create policy "daily_menus teacher delete" on vrtic_management_tool_daily_menus
  for delete to authenticated using (vrtic_is_teacher(group_id));

-- photo_posts: same group-wide sharing model as daily_menus.
create policy "photo_posts select" on vrtic_management_tool_photo_posts
  for select to authenticated using (vrtic_is_group_member(group_id));
create policy "photo_posts teacher insert" on vrtic_management_tool_photo_posts
  for insert to authenticated with check (vrtic_is_teacher(group_id));
create policy "photo_posts teacher delete" on vrtic_management_tool_photo_posts
  for delete to authenticated using (vrtic_is_teacher(group_id));
