-- Zakazi Termin — schema.sql
--
-- Run against the shared Supabase project's SQL editor. Tables namespaced
-- `zakazi_termin_*` per the sprint's shared-project convention.
--
-- Assumption (standard on a stock Supabase project): `anon`/`authenticated`
-- already have table-level GRANTs on the `public` schema by default — RLS
-- (enabled on every table below) is the real access gate.
--
-- Data model / access model:
-- * A "shop owner" is an authenticated user (magic-link login) who owns a
--   `shop` via `owner_id`.
-- * `slots` are public-read (customers need to see availability without an
--   account) and denormalize a `status` column ('open'/'booked'/'cancelled')
--   directly on the row for a simple public availability check.
-- * `bookings` holds customer PII (name/email) and is owner-only read — a
--   customer books blind (no account, no way to look their own booking back
--   up by re-querying), which matches "simple booking system," not
--   "customer portal."
-- * The open -> booked transition has a real invariant a normal RLS INSERT
--   policy can't safely express for an anonymous customer: "this slot must
--   still be open, and creating the booking + flipping the slot's status
--   must happen together." Rather than trust a public RLS policy with a
--   subquery (racy, and lets anon flip slot status directly), the actual
--   booking write happens server-side using the Supabase SERVICE ROLE key
--   (see lib/supabase/serviceRoleClient.ts + lib/actions.ts's `bookSlot`),
--   which bypasses RLS entirely and is only reachable through that one
--   validated Server Action. `slots`/`bookings` RLS below still exists for
--   the shop owner's own authenticated writes (manual slot management,
--   cancelling a booking) — it's just not how the public booking flow
--   works.
-- * A partial unique index (`one_confirmed_booking_per_slot`) is the real
--   concurrency guard against double-booking (two customers submitting the
--   same slot at once) — belt-and-suspenders on top of the service-role
--   code's own "is this slot still open" check.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table if not exists zakazi_termin_shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  address text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists zakazi_termin_slots (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references zakazi_termin_shops(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  service_name text not null,
  status text not null default 'open' check (status in ('open', 'booked', 'cancelled')),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists zakazi_termin_bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references zakazi_termin_slots(id) on delete cascade,
  shop_id uuid not null references zakazi_termin_shops(id) on delete cascade,
  customer_name text not null,
  customer_email text not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- Concurrency guard: only one active (confirmed) booking per slot, even
-- under a race between two simultaneous booking attempts.
create unique index if not exists one_confirmed_booking_per_slot
  on zakazi_termin_bookings(slot_id)
  where status = 'confirmed';

create index if not exists idx_zakazi_termin_slots_shop on zakazi_termin_slots(shop_id);
create index if not exists idx_zakazi_termin_slots_starts_at on zakazi_termin_slots(starts_at);
create index if not exists idx_zakazi_termin_bookings_shop on zakazi_termin_bookings(shop_id);
create index if not exists idx_zakazi_termin_bookings_slot on zakazi_termin_bookings(slot_id);

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table zakazi_termin_shops enable row level security;
alter table zakazi_termin_slots enable row level security;
alter table zakazi_termin_bookings enable row level security;

-- shops: public read (needed for the public booking page), owner-only write.
create policy "shops public read" on zakazi_termin_shops
  for select to anon, authenticated using (true);
create policy "shops owner insert" on zakazi_termin_shops
  for insert to authenticated with check (auth.uid() = owner_id);
create policy "shops owner update" on zakazi_termin_shops
  for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "shops owner delete" on zakazi_termin_shops
  for delete to authenticated using (auth.uid() = owner_id);

-- slots: public read (availability), owner-only write via the normal
-- authenticated client. The public booking flow's status flip happens via
-- the service-role client instead (see the big comment above), which
-- bypasses these policies entirely by design.
create policy "slots public read" on zakazi_termin_slots
  for select to anon, authenticated using (true);
create policy "slots owner insert" on zakazi_termin_slots
  for insert to authenticated with check (
    exists (select 1 from zakazi_termin_shops s where s.id = shop_id and s.owner_id = auth.uid())
  );
create policy "slots owner update" on zakazi_termin_slots
  for update to authenticated using (
    exists (select 1 from zakazi_termin_shops s where s.id = shop_id and s.owner_id = auth.uid())
  ) with check (
    exists (select 1 from zakazi_termin_shops s where s.id = shop_id and s.owner_id = auth.uid())
  );
create policy "slots owner delete" on zakazi_termin_slots
  for delete to authenticated using (
    exists (select 1 from zakazi_termin_shops s where s.id = shop_id and s.owner_id = auth.uid())
  );

-- bookings: owner-only read/write via the normal authenticated client
-- (used for the owner's calendar view + owner-initiated cancellations).
-- No anon/authenticated INSERT policy at all — the only way a booking row
-- is created is the service-role `bookSlot` Server Action, which bypasses
-- RLS. This means a client-side attempt to insert directly (bypassing that
-- action) is rejected outright, not just rate-limited.
create policy "bookings owner select" on zakazi_termin_bookings
  for select to authenticated using (
    exists (select 1 from zakazi_termin_shops s where s.id = shop_id and s.owner_id = auth.uid())
  );
create policy "bookings owner update" on zakazi_termin_bookings
  for update to authenticated using (
    exists (select 1 from zakazi_termin_shops s where s.id = shop_id and s.owner_id = auth.uid())
  ) with check (
    exists (select 1 from zakazi_termin_shops s where s.id = shop_id and s.owner_id = auth.uid())
  );
create policy "bookings owner delete" on zakazi_termin_bookings
  for delete to authenticated using (
    exists (select 1 from zakazi_termin_shops s where s.id = shop_id and s.owner_id = auth.uid())
  );
