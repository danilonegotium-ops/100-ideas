-- Link-in-Bio for Artists — schema.sql
-- Tables namespaced `link_in_bio_artists_` per docs/PLAN.md.
--
-- Ownership model: same pattern as qr-menu-2's restaurants — a profile has
-- an optional `owner_id` (auth.users.id). Building/editing your profile at
-- /studio is gated to the owner via RLS + the shared template's
-- magic-link login (this idea is inherently multi-tenant — "user signs
-- up, builds a public profile" — so unlike the two single-tenant internal
-- tools in this batch, it keeps the real auth flow). The seeded demo
-- profile below has owner_id = NULL (no real user exists yet), so its
-- public page works immediately but can't be edited via /studio until
-- claimed by a real signed-in user — see SPEC.md.

create extension if not exists pgcrypto;

create table if not exists link_in_bio_artists_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_-]{3,30}$'),
  display_name text not null,
  bio text,
  avatar_url text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One profile per owner (a NULL owner_id, like the seed row, is exempt —
-- Postgres unique constraints treat NULLs as distinct from each other).
create unique index if not exists link_in_bio_artists_profiles_owner_unique
  on link_in_bio_artists_profiles(owner_id) where owner_id is not null;

create table if not exists link_in_bio_artists_links (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references link_in_bio_artists_profiles(id) on delete cascade,
  label text not null,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists link_in_bio_artists_portfolio_items (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references link_in_bio_artists_profiles(id) on delete cascade,
  image_url text not null,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists link_in_bio_artists_links_profile_idx on link_in_bio_artists_links(profile_id);
create index if not exists link_in_bio_artists_portfolio_items_profile_idx on link_in_bio_artists_portfolio_items(profile_id);

-- Row Level Security ----------------------------------------------------

alter table link_in_bio_artists_profiles enable row level security;
alter table link_in_bio_artists_links enable row level security;
alter table link_in_bio_artists_portfolio_items enable row level security;

-- profiles: published profiles are public; an owner can always see (and
-- preview) their own, published or not.
create policy "link_in_bio_artists_profiles_read" on link_in_bio_artists_profiles
  for select using (is_published = true or auth.uid() = owner_id);
create policy "link_in_bio_artists_profiles_owner_insert" on link_in_bio_artists_profiles
  for insert with check (auth.uid() = owner_id);
create policy "link_in_bio_artists_profiles_owner_update" on link_in_bio_artists_profiles
  for update using (auth.uid() = owner_id);
create policy "link_in_bio_artists_profiles_owner_delete" on link_in_bio_artists_profiles
  for delete using (auth.uid() = owner_id);

-- links/portfolio_items: readable wherever the parent profile is readable;
-- writable only by the parent profile's owner.
create policy "link_in_bio_artists_links_read" on link_in_bio_artists_links
  for select using (
    exists (
      select 1 from link_in_bio_artists_profiles p
      where p.id = profile_id and (p.is_published = true or p.owner_id = auth.uid())
    )
  );
create policy "link_in_bio_artists_links_owner_write" on link_in_bio_artists_links
  for all using (
    exists (select 1 from link_in_bio_artists_profiles p where p.id = profile_id and p.owner_id = auth.uid())
  ) with check (
    exists (select 1 from link_in_bio_artists_profiles p where p.id = profile_id and p.owner_id = auth.uid())
  );

create policy "link_in_bio_artists_portfolio_items_read" on link_in_bio_artists_portfolio_items
  for select using (
    exists (
      select 1 from link_in_bio_artists_profiles p
      where p.id = profile_id and (p.is_published = true or p.owner_id = auth.uid())
    )
  );
create policy "link_in_bio_artists_portfolio_items_owner_write" on link_in_bio_artists_portfolio_items
  for all using (
    exists (select 1 from link_in_bio_artists_profiles p where p.id = profile_id and p.owner_id = auth.uid())
  ) with check (
    exists (select 1 from link_in_bio_artists_profiles p where p.id = profile_id and p.owner_id = auth.uid())
  );
