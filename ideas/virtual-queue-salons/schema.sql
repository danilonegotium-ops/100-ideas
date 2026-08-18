-- Virtual Queue for Salons — schema.sql
-- Tables namespaced `virtual_queue_salons_` per docs/PLAN.md.
--
-- Scope note: this MVP is single-tenant per shop and has NO auth gating on
-- the staff dashboard (see SPEC.md "Scope adaptations"). Given only one
-- demo shop is seeded and the assignment doesn't ask for multi-tenant
-- staff accounts, the staff dashboard at /shop/<slug>/staff is reachable by
-- anyone with the URL — acceptable for a demo, not for a real deployment
-- with paying shops. A production version would add an `owner_id` column
-- (like qr-menu-2's restaurants table) plus the shared template's
-- magic-link login before handling a real shop's queue.

create extension if not exists pgcrypto;

create table if not exists virtual_queue_salons_shops (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists virtual_queue_salons_entries (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references virtual_queue_salons_shops(id) on delete cascade,
  customer_name text not null,
  customer_email text,
  party_size int not null default 1 check (party_size > 0),
  status text not null default 'waiting' check (status in ('waiting', 'called', 'served', 'cancelled')),
  joined_at timestamptz not null default now(),
  called_at timestamptz,
  served_at timestamptz
);

create index if not exists virtual_queue_salons_entries_shop_idx
  on virtual_queue_salons_entries(shop_id, status, joined_at);

-- Row Level Security ----------------------------------------------------

alter table virtual_queue_salons_shops enable row level security;
alter table virtual_queue_salons_entries enable row level security;

-- Open/demo-scope policies (see the note above): anyone can read shops,
-- join a queue, and manage entries. Realtime "postgres_changes" delivery
-- for the customer's own live-position view requires an anon-readable
-- SELECT policy on the table it subscribes to, which is the main reason
-- this is public-read rather than locked to a security-definer RPC.
--
-- Known tradeoff: customer_email (optional, never shown in the UI to
-- anyone but staff) is technically readable by any anon-key holder who
-- queries the table directly, not just through this app's UI. Fine for
-- seed/demo data; a production version handling real customer emails
-- should split this into a PII-free public view/broadcast channel plus a
-- security-definer function, and lock the base table down like
-- qr-menu-2's orders table.
create policy "virtual_queue_salons_shops_public_read" on virtual_queue_salons_shops
  for select using (true);

create policy "virtual_queue_salons_entries_public_read" on virtual_queue_salons_entries
  for select using (true);
create policy "virtual_queue_salons_entries_public_insert" on virtual_queue_salons_entries
  for insert with check (true);
create policy "virtual_queue_salons_entries_public_update" on virtual_queue_salons_entries
  for update using (true);
