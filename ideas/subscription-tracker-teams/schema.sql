-- Subscription Tracker for Teams — schema.sql
-- Table namespaced `subscription_tracker_teams_` per docs/PLAN.md.
--
-- Scope note: single shared demo workspace, no auth (see SPEC.md). This is
-- an internal tool with no customer-facing side, so — unlike qr-menu-2 or
-- link-in-bio-artists, which are inherently multi-tenant products — this
-- MVP skips per-team login entirely and just has one open list, matching
-- the "seed ~12 demo subscriptions" scale in the assignment. A production
-- version would add a `team_id`/`owner_id` column plus the shared
-- template's magic-link login before handling a real company's billing
-- data.

create extension if not exists pgcrypto;

create table if not exists subscription_tracker_teams_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tool_name text not null,
  cost_cents int not null check (cost_cents >= 0),
  billing_cycle text not null check (billing_cycle in ('monthly', 'annual')),
  owner_name text not null,
  category text,
  url text,
  last_used_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscription_tracker_teams_subscriptions_last_used_idx
  on subscription_tracker_teams_subscriptions(last_used_date);

-- Row Level Security ----------------------------------------------------

alter table subscription_tracker_teams_subscriptions enable row level security;

-- Open/demo-scope: single shared workspace, no login (see note above).
create policy "subscription_tracker_teams_subscriptions_public_all"
  on subscription_tracker_teams_subscriptions
  for all using (true) with check (true);
