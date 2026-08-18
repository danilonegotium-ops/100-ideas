-- Shared Wishlist — schema.sql
-- Run against the shared Supabase project's SQL editor. Table names are
-- namespaced `shared_wishlist_*` per docs/PLAN.md's shared-project
-- convention.
--
-- ============================================================================
-- Demo user note
-- ----------------------------------------------------------------------------
-- The seed wishlist below is owned by a placeholder demo user, UUID
-- '00000000-0000-0000-0000-000000000001'. auth.users is managed by Supabase
-- Auth, not by this file. Before running the INSERTs at the bottom, either:
--   (a) sign up as a real user via the app's magic-link flow (/login), then
--       run `update shared_wishlist_wishlists set owner_id = '<real-uuid>'
--       where owner_id = '00000000-0000-0000-0000-000000000001';`, or
--   (b) create a user with that exact UUID via Supabase Dashboard ->
--       Authentication -> Users -> Add user, then run the seed INSERTs
--       as-is.
-- Until one of those exists, the seed INSERTs will fail with a foreign key
-- violation — expected, not a bug.
-- ============================================================================

create extension if not exists pgcrypto;

create table if not exists shared_wishlist_wishlists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now()
);

create table if not exists shared_wishlist_items (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references shared_wishlist_wishlists(id) on delete cascade,
  name text not null,
  url text,
  price numeric(10, 2),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists shared_wishlist_items_wishlist_id_idx
  on shared_wishlist_items (wishlist_id);

-- `unique` on item_id means at most one claim per item — a second claim
-- attempt fails with a unique-violation, which the app treats as "someone
-- just beat you to it" rather than a generic error.
create table if not exists shared_wishlist_claims (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null unique references shared_wishlist_items(id) on delete cascade,
  claimant_name text not null,
  claimant_note text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table shared_wishlist_wishlists enable row level security;
alter table shared_wishlist_items enable row level security;
alter table shared_wishlist_claims enable row level security;

-- Wishlists & items are readable by anyone who has the link (the id itself
-- is the unguessable share link — see app/w/[id]/page.tsx), including
-- fully anonymous visitors, per "friends can view without needing an
-- account". Only the owner can create/rename/delete.
create policy shared_wishlist_wishlists_select_public
  on shared_wishlist_wishlists
  for select
  using (true);

create policy shared_wishlist_wishlists_insert_own
  on shared_wishlist_wishlists
  for insert
  with check (auth.uid() = owner_id);

create policy shared_wishlist_wishlists_update_own
  on shared_wishlist_wishlists
  for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy shared_wishlist_wishlists_delete_own
  on shared_wishlist_wishlists
  for delete
  using (auth.uid() = owner_id);

create policy shared_wishlist_items_select_public
  on shared_wishlist_items
  for select
  using (true);

create policy shared_wishlist_items_insert_own
  on shared_wishlist_items
  for insert
  with check (
    exists (
      select 1 from shared_wishlist_wishlists w
      where w.id = wishlist_id and w.owner_id = auth.uid()
    )
  );

create policy shared_wishlist_items_update_own
  on shared_wishlist_items
  for update
  using (
    exists (
      select 1 from shared_wishlist_wishlists w
      where w.id = wishlist_id and w.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from shared_wishlist_wishlists w
      where w.id = wishlist_id and w.owner_id = auth.uid()
    )
  );

create policy shared_wishlist_items_delete_own
  on shared_wishlist_items
  for delete
  using (
    exists (
      select 1 from shared_wishlist_wishlists w
      where w.id = wishlist_id and w.owner_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- Claims — this is the privacy-critical table. Claiming only requires a
-- name (no account needed), open to anon + authenticated:
create policy shared_wishlist_claims_insert_open
  on shared_wishlist_claims
  for insert
  with check (length(trim(claimant_name)) > 0);

-- THE CORE PRIVACY RULE: a claim row is visible to everyone EXCEPT the
-- owner of the wishlist the claimed item belongs to. `auth.uid()` is null
-- for anonymous visitors, and `owner_id = null` is never true in SQL, so
-- anonymous visitors always pass this check (see friends can view without
-- an account). A logged-in non-owner also passes (owner_id <> auth.uid()).
-- Only a logged-in owner viewing their OWN wishlist's items is blocked —
-- this is the opposite of the usual "owners can see everything" pattern,
-- deliberately, to preserve the gift surprise. This is the hard backend
-- enforcement; the app code additionally never queries this table at all
-- from the owner-facing dashboard (see components/ManageWishlist.tsx),
-- using the boolean-only RPC below instead — belt and suspenders.
create policy shared_wishlist_claims_select_not_owner
  on shared_wishlist_claims
  for select
  using (
    not exists (
      select 1
      from shared_wishlist_items i
      join shared_wishlist_wishlists w on w.id = i.wishlist_id
      where i.id = shared_wishlist_claims.item_id
        and w.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- Boolean-only claim status for the owner's dashboard.
-- ----------------------------------------------------------------------------
-- The owner needs to know an item IS claimed without ever learning WHO
-- claimed it. A plain view over shared_wishlist_claims would still be
-- filtered by the RLS policy above (views enforce the underlying table's
-- RLS based on the querying user, they don't bypass it), so the owner would
-- see zero rows either way — useless for a true/false signal. Instead, a
-- SECURITY DEFINER function runs as the function owner (the table-owning
-- role, e.g. `postgres`), which — as the table owner — is exempt from its
-- own RLS policies (Postgres RLS never applies to a table's owner unless
-- `FORCE ROW LEVEL SECURITY` is set, which it deliberately is NOT here).
-- The function returns ONLY a boolean, never claimant_name/claimant_note,
-- so there is no identity leak regardless of who calls it — this is safe
-- to grant to anon + authenticated broadly.
create or replace function shared_wishlist_claim_statuses(p_wishlist_id uuid)
returns table(item_id uuid, is_claimed boolean)
language sql
security definer
set search_path = public
as $$
  select i.id as item_id,
    exists(select 1 from shared_wishlist_claims c where c.item_id = i.id) as is_claimed
  from shared_wishlist_items i
  where i.wishlist_id = p_wishlist_id;
$$;

grant execute on function shared_wishlist_claim_statuses(uuid) to anon, authenticated;

-- ============================================================================
-- Seed data — one demo wishlist with a few items, one claimed. Run only
-- after the demo user exists (see note above).
-- ============================================================================

insert into shared_wishlist_wishlists (id, owner_id, title)
values (
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'My Birthday 2026'
);

insert into shared_wishlist_items (id, wishlist_id, name, url, price, notes)
values
  (
    '20000000-0000-0000-0000-000000000011',
    '20000000-0000-0000-0000-000000000001',
    'Wireless headphones',
    'https://example.com/headphones',
    89.99,
    'Any color except pink'
  ),
  (
    '20000000-0000-0000-0000-000000000012',
    '20000000-0000-0000-0000-000000000001',
    'Board game: Wingspan',
    'https://example.com/wingspan',
    45.00,
    null
  ),
  (
    '20000000-0000-0000-0000-000000000013',
    '20000000-0000-0000-0000-000000000001',
    'Nice coffee beans',
    null,
    20.00,
    'A local roaster, surprise me'
  ),
  (
    '20000000-0000-0000-0000-000000000014',
    '20000000-0000-0000-0000-000000000001',
    'Hiking socks (size 42)',
    null,
    15.00,
    null
  );

-- One of the four items is already claimed by a friend.
insert into shared_wishlist_claims (item_id, claimant_name, claimant_note)
values (
  '20000000-0000-0000-0000-000000000012',
  'Ana',
  'Getting this one, do not also buy it!'
);
