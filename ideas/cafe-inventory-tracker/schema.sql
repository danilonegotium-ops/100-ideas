-- Cafe Inventory Tracker — schema.sql
-- Table namespaced `cafe_inventory_tracker_` per docs/PLAN.md.
--
-- Scope note: single shared demo workspace, no auth — same rationale as
-- subscription-tracker-teams (internal tool, "seed ~10 demo items" scale,
-- no customer-facing side). See SPEC.md.

create extension if not exists pgcrypto;

create table if not exists cafe_inventory_tracker_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null,
  current_stock numeric not null check (current_stock >= 0),
  reorder_threshold numeric not null check (reorder_threshold >= 0),
  daily_usage_rate numeric not null default 0 check (daily_usage_rate >= 0),
  category text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cafe_inventory_tracker_items_stock_idx
  on cafe_inventory_tracker_items(current_stock);

-- Row Level Security ----------------------------------------------------

alter table cafe_inventory_tracker_items enable row level security;

-- Open/demo-scope: single shared workspace, no login (see note above).
create policy "cafe_inventory_tracker_items_public_all"
  on cafe_inventory_tracker_items
  for all using (true) with check (true);
