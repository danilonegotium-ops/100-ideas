-- Airbnb Management Dashboard — schema.sql
--
-- Run against the shared Supabase project once it exists. Tables
-- namespaced `airbnb_management_dashboard_` per docs/PLAN.md.
--
-- `user_id` columns are plain `uuid`, not a foreign key to `auth.users` —
-- same reasoning as every Wave 3 idea in this batch (RLS via `auth.uid()`
-- is the real enforcement mechanism; see the fuller note in
-- digital-time-capsule/schema.sql). Here it's also what lets the seed
-- data below insert without a live account existing first.
--
-- Data model note: the brief describes "bookings (dates, gross payout)
-- and expenses (cleaning, platform fee %, other costs)" — this schema
-- merges those into one `bookings` row per stay rather than a separate
-- expenses table, since every cost the brief lists (cleaning, platform
-- fee, other costs) is naturally scoped to one specific booking, and the
-- brief only asks for profit "per booking and per property," not for
-- expenses independent of any booking. Simpler, and avoids an awkward
-- optional booking_id on a separate expenses table.

create table if not exists airbnb_management_dashboard_properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null check (char_length(name) > 0),
  address text,
  -- Used to prefill new bookings for this property; each booking can
  -- still override its own fee/cleaning cost (e.g. a one-off deep clean).
  default_platform_fee_pct numeric(5, 2) not null default 3.00
    check (default_platform_fee_pct >= 0 and default_platform_fee_pct <= 100),
  default_cleaning_fee numeric(10, 2) not null default 0
    check (default_cleaning_fee >= 0),
  created_at timestamptz not null default now()
);

create table if not exists airbnb_management_dashboard_bookings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references airbnb_management_dashboard_properties (id) on delete cascade,
  -- Denormalized owner (matches the property's user_id, enforced by the
  -- API route rather than a cross-table constraint) so RLS on this table
  -- doesn't need a subquery join against properties for every row check.
  user_id uuid not null,
  guest_name text,
  check_in date not null,
  check_out date not null check (check_out > check_in),
  -- `date - date` in Postgres returns an integer day count.
  nights integer generated always as (check_out - check_in) stored,
  gross_payout numeric(10, 2) not null check (gross_payout >= 0),
  platform_fee_pct numeric(5, 2) not null default 3.00
    check (platform_fee_pct >= 0 and platform_fee_pct <= 100),
  cleaning_fee numeric(10, 2) not null default 0 check (cleaning_fee >= 0),
  other_costs numeric(10, 2) not null default 0 check (other_costs >= 0),
  notes text,
  -- Mirrors lib/money.ts's computeNetProfit() exactly — keep the two in
  -- sync if this formula ever changes.
  net_profit numeric(10, 2) generated always as (
    gross_payout - (gross_payout * platform_fee_pct / 100) - cleaning_fee - other_costs
  ) stored,
  created_at timestamptz not null default now()
);

create index if not exists airbnb_management_dashboard_bookings_property_idx
  on airbnb_management_dashboard_bookings (property_id);
create index if not exists airbnb_management_dashboard_bookings_user_idx
  on airbnb_management_dashboard_bookings (user_id);
create index if not exists airbnb_management_dashboard_bookings_checkin_idx
  on airbnb_management_dashboard_bookings (check_in);

alter table airbnb_management_dashboard_properties enable row level security;
alter table airbnb_management_dashboard_bookings enable row level security;

create policy "properties_select_own"
  on airbnb_management_dashboard_properties for select
  using (user_id = auth.uid());

create policy "properties_insert_own"
  on airbnb_management_dashboard_properties for insert
  with check (user_id = auth.uid());

create policy "properties_update_own"
  on airbnb_management_dashboard_properties for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "properties_delete_own"
  on airbnb_management_dashboard_properties for delete
  using (user_id = auth.uid());

create policy "bookings_select_own"
  on airbnb_management_dashboard_bookings for select
  using (user_id = auth.uid());

create policy "bookings_insert_own"
  on airbnb_management_dashboard_bookings for insert
  with check (user_id = auth.uid());

create policy "bookings_update_own"
  on airbnb_management_dashboard_bookings for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "bookings_delete_own"
  on airbnb_management_dashboard_bookings for delete
  using (user_id = auth.uid());

-- Seed data ------------------------------------------------------------
-- One demo property, 8 bookings with realistic fee/expense breakdowns —
-- mostly clean stays, one with an extra "other cost" (a repair) and one
-- with a discounted cleaning fee, so the totals aren't all identical.
insert into airbnb_management_dashboard_properties
  (id, user_id, name, address, default_platform_fee_pct, default_cleaning_fee)
values
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'Vracar 2BR', 'Njegoseva 22, Belgrade', 3.00, 40.00);

insert into airbnb_management_dashboard_bookings
  (property_id, user_id, guest_name, check_in, check_out, gross_payout, platform_fee_pct, cleaning_fee, other_costs, notes)
values
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'Hannah K.', current_date - interval '150 days', current_date - interval '146 days', 320.00, 3.00, 40.00, 0, null),
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'Marco B.', current_date - interval '130 days', current_date - interval '125 days', 410.00, 3.00, 40.00, 0, null),
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'Yuki T.', current_date - interval '100 days', current_date - interval '97 days', 260.00, 3.00, 40.00, 25.00, 'Replaced a broken lamp'),
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'The Dubois Family', current_date - interval '80 days', current_date - interval '73 days', 690.00, 3.00, 40.00, 0, 'Week-long stay'),
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'Priya S.', current_date - interval '55 days', current_date - interval '52 days', 300.00, 3.50, 30.00, 0, 'Off-season, discounted cleaning'),
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'Tom H.', current_date - interval '30 days', current_date - interval '27 days', 345.00, 3.00, 40.00, 0, null),
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'Lena M.', current_date - interval '15 days', current_date - interval '11 days', 480.00, 3.00, 40.00, 0, null),
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'Chen W.', current_date + interval '5 days', current_date + interval '9 days', 420.00, 3.00, 40.00, 0, 'Upcoming booking');
