-- QR Menu 2.0 — schema.sql
-- Run against the shared Supabase project. Tables are namespaced `qr_menu_2_`
-- per docs/PLAN.md's table-naming convention.
--
-- Ownership model: a restaurant has an optional `owner_id` (auth.users.id).
-- Admin CRUD (menu editing, viewing orders) is gated to the owner via RLS +
-- the app's magic-link login. The seed demo restaurant below is created with
-- owner_id = NULL (no real user exists yet) so its public ordering flow
-- works immediately, but its /admin dashboard can't be reached until a real
-- signed-in user is set as its owner — see SPEC.md.
--
-- Orders/order_items are written exclusively by the server (service-role
-- key, from app/api/checkout/route.ts) rather than through a public RLS
-- INSERT policy, so a customer's submitted cart can never forge prices —
-- the server re-prices every line item from qr_menu_2_menu_items before
-- inserting.

create extension if not exists pgcrypto;

create table if not exists qr_menu_2_restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists qr_menu_2_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references qr_menu_2_restaurants(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists qr_menu_2_menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references qr_menu_2_restaurants(id) on delete cascade,
  category_id uuid references qr_menu_2_categories(id) on delete set null,
  name text not null,
  description text,
  price_cents int not null check (price_cents >= 0),
  is_available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists qr_menu_2_tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references qr_menu_2_restaurants(id) on delete cascade,
  label text not null,
  created_at timestamptz not null default now(),
  unique (restaurant_id, label)
);

create table if not exists qr_menu_2_orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references qr_menu_2_restaurants(id) on delete cascade,
  table_id uuid references qr_menu_2_tables(id) on delete set null,
  status text not null default 'placed' check (status in ('placed', 'preparing', 'completed', 'cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'demo')),
  stripe_checkout_session_id text,
  total_cents int not null check (total_cents >= 0),
  customer_note text,
  created_at timestamptz not null default now()
);

create table if not exists qr_menu_2_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references qr_menu_2_orders(id) on delete cascade,
  menu_item_id uuid references qr_menu_2_menu_items(id) on delete set null,
  name_snapshot text not null,
  price_cents_snapshot int not null check (price_cents_snapshot >= 0),
  quantity int not null check (quantity > 0)
);

create index if not exists qr_menu_2_categories_restaurant_idx on qr_menu_2_categories(restaurant_id);
create index if not exists qr_menu_2_menu_items_restaurant_idx on qr_menu_2_menu_items(restaurant_id);
create index if not exists qr_menu_2_tables_restaurant_idx on qr_menu_2_tables(restaurant_id);
create index if not exists qr_menu_2_orders_restaurant_idx on qr_menu_2_orders(restaurant_id);
create index if not exists qr_menu_2_order_items_order_idx on qr_menu_2_order_items(order_id);

-- Row Level Security ----------------------------------------------------

alter table qr_menu_2_restaurants enable row level security;
alter table qr_menu_2_categories enable row level security;
alter table qr_menu_2_menu_items enable row level security;
alter table qr_menu_2_tables enable row level security;
alter table qr_menu_2_orders enable row level security;
alter table qr_menu_2_order_items enable row level security;

-- restaurants: menus are public to browse; only the owner can manage them.
create policy "qr_menu_2_restaurants_public_read" on qr_menu_2_restaurants
  for select using (true);
create policy "qr_menu_2_restaurants_owner_insert" on qr_menu_2_restaurants
  for insert with check (auth.uid() = owner_id);
create policy "qr_menu_2_restaurants_owner_update" on qr_menu_2_restaurants
  for update using (auth.uid() = owner_id);
create policy "qr_menu_2_restaurants_owner_delete" on qr_menu_2_restaurants
  for delete using (auth.uid() = owner_id);

-- categories/menu_items/tables: public read (customers browse without
-- login), write restricted to the parent restaurant's owner.
create policy "qr_menu_2_categories_public_read" on qr_menu_2_categories
  for select using (true);
create policy "qr_menu_2_categories_owner_write" on qr_menu_2_categories
  for all using (
    exists (select 1 from qr_menu_2_restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
  ) with check (
    exists (select 1 from qr_menu_2_restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
  );

create policy "qr_menu_2_menu_items_public_read" on qr_menu_2_menu_items
  for select using (true);
create policy "qr_menu_2_menu_items_owner_write" on qr_menu_2_menu_items
  for all using (
    exists (select 1 from qr_menu_2_restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
  ) with check (
    exists (select 1 from qr_menu_2_restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
  );

create policy "qr_menu_2_tables_public_read" on qr_menu_2_tables
  for select using (true);
create policy "qr_menu_2_tables_owner_write" on qr_menu_2_tables
  for all using (
    exists (select 1 from qr_menu_2_restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
  ) with check (
    exists (select 1 from qr_menu_2_restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
  );

-- orders/order_items: no public policies at all. The checkout flow
-- (app/api/checkout/route.ts, app/api/checkout/confirm/route.ts) writes
-- and reads these using the service-role key from the server, which
-- bypasses RLS entirely. Only the restaurant owner can read their own
-- orders from the browser/admin dashboard.
create policy "qr_menu_2_orders_owner_read" on qr_menu_2_orders
  for select using (
    exists (select 1 from qr_menu_2_restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
  );
create policy "qr_menu_2_orders_owner_update" on qr_menu_2_orders
  for update using (
    exists (select 1 from qr_menu_2_restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
  );

create policy "qr_menu_2_order_items_owner_read" on qr_menu_2_order_items
  for select using (
    exists (
      select 1 from qr_menu_2_orders o
      join qr_menu_2_restaurants r on r.id = o.restaurant_id
      where o.id = order_id and r.owner_id = auth.uid()
    )
  );
