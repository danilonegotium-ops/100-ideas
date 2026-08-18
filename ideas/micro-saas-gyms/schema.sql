-- Micro-SaaS for Gyms — schema.sql
--
-- Run in the shared Supabase project's SQL editor. Tables namespaced
-- `micro_saas_gyms_*` per docs/PLAN.md's shared-project convention.
--
-- Data model: single-tenant-per-user. One authenticated user = one gym
-- owner, who manages their own member list and check-in log, scoped via
-- Row Level Security on `user_id`.
--
-- Membership status is a hybrid: `status` stores an explicit manual
-- override (`active` / `cancelled`) set by the owner, while "expiring
-- soon" / "expired" are DERIVED at read time from `subscription_end`
-- compared to the current date (see `lib/types.ts#membershipState` in the
-- app code). Storing only the manual override — not a fully derived
-- status — avoids a cron job to flip rows as dates pass, while still
-- letting an owner explicitly cancel a membership independent of its
-- expiry date.

create table if not exists micro_saas_gyms_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  plan_name text not null default 'Standard',
  subscription_end date not null,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists micro_saas_gyms_members_user_id_idx
  on micro_saas_gyms_members (user_id);

create index if not exists micro_saas_gyms_members_full_name_idx
  on micro_saas_gyms_members (user_id, full_name);

create table if not exists micro_saas_gyms_checkins (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references micro_saas_gyms_members (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  checked_in_at timestamptz not null default now()
);

create index if not exists micro_saas_gyms_checkins_member_id_idx
  on micro_saas_gyms_checkins (member_id);

create index if not exists micro_saas_gyms_checkins_checked_in_at_idx
  on micro_saas_gyms_checkins (user_id, checked_in_at desc);

create or replace function micro_saas_gyms_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists micro_saas_gyms_members_set_updated_at on micro_saas_gyms_members;
create trigger micro_saas_gyms_members_set_updated_at
  before update on micro_saas_gyms_members
  for each row execute function micro_saas_gyms_set_updated_at();

-- Row Level Security --------------------------------------------------

alter table micro_saas_gyms_members enable row level security;
alter table micro_saas_gyms_checkins enable row level security;

create policy "members_select_own" on micro_saas_gyms_members
  for select using (auth.uid() = user_id);

create policy "members_insert_own" on micro_saas_gyms_members
  for insert with check (auth.uid() = user_id);

create policy "members_update_own" on micro_saas_gyms_members
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "members_delete_own" on micro_saas_gyms_members
  for delete using (auth.uid() = user_id);

create policy "checkins_select_own" on micro_saas_gyms_checkins
  for select using (auth.uid() = user_id);

create policy "checkins_insert_own" on micro_saas_gyms_checkins
  for insert with check (auth.uid() = user_id);

-- No update/delete policy on check-ins on purpose — it's an append-only
-- attendance log.
