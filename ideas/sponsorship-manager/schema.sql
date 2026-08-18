-- Sponsorship Manager — schema.sql
--
-- Run in the shared Supabase project's SQL editor. Tables namespaced
-- `sponsorship_manager_*` per docs/PLAN.md's shared-project convention.
--
-- Data model: single-tenant-per-user. One authenticated user (a
-- YouTuber/podcaster) manages their own pipeline of sponsor deals, scoped
-- via Row Level Security on `user_id`. No separate "contacts" table for
-- this MVP — contact name/email live directly on the deal row, since a
-- sponsor contact in this context is 1:1 with a deal, not a shared
-- address book entry reused across many deals.

create table if not exists sponsorship_manager_deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  sponsor_name text not null,
  contact_name text,
  contact_email text,
  -- Pipeline stage, in the order a deal is expected to move through.
  -- 'declined' is a terminal state reachable from any earlier stage.
  stage text not null default 'prospecting'
    check (stage in ('prospecting', 'negotiating', 'signed', 'paid', 'declined')),
  deal_value numeric(10, 2),
  currency text not null default 'USD',
  notes text,
  next_action text,
  next_action_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sponsorship_manager_deals_user_id_idx
  on sponsorship_manager_deals (user_id);

create index if not exists sponsorship_manager_deals_stage_idx
  on sponsorship_manager_deals (user_id, stage);

create or replace function sponsorship_manager_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists sponsorship_manager_deals_set_updated_at on sponsorship_manager_deals;
create trigger sponsorship_manager_deals_set_updated_at
  before update on sponsorship_manager_deals
  for each row execute function sponsorship_manager_set_updated_at();

-- Row Level Security --------------------------------------------------

alter table sponsorship_manager_deals enable row level security;

create policy "deals_select_own" on sponsorship_manager_deals
  for select using (auth.uid() = user_id);

create policy "deals_insert_own" on sponsorship_manager_deals
  for insert with check (auth.uid() = user_id);

create policy "deals_update_own" on sponsorship_manager_deals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "deals_delete_own" on sponsorship_manager_deals
  for delete using (auth.uid() = user_id);
