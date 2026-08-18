-- Digitalni Upravnik — schema.sql
--
-- Run this against the shared Supabase project's SQL editor (once it
-- exists). Tables are namespaced `digitalni_upravnik_*` per the sprint's
-- shared-project convention (see docs/PLAN.md).
--
-- Assumption (standard on a stock Supabase project): the `anon` and
-- `authenticated` roles already have table-level GRANTs on the `public`
-- schema by default. Row Level Security (enabled below on every table) is
-- what actually restricts row access — without it, any row would be
-- readable/writable by anyone holding the anon key.
--
-- Data model notes:
-- * A "manager" is just an authenticated Supabase user (magic-link login)
--   who owns a building via `manager_id`. No separate roles table for MVP.
-- * The notice board, fund ledger, and votes are intentionally PUBLIC READ
--   (a real building notice board is meant to be seen by every tenant, most
--   of whom won't have an account) — this is the "publicly browsable" case
--   from the task brief. Only the manager can write.
-- * Tenant PII (owner/tenant name, contact email) is split into a separate
--   `unit_contacts` table that is NOT public-read, so the public board can
--   show unit labels (for the voting dropdown) without leaking contact
--   info. `units` itself only holds non-sensitive fields (label, floor,
--   fee).
-- * Voting is done by unit, not by individual user account, since tenants
--   are not expected to have Supabase accounts for MVP — a tenant picks
--   their unit and casts one vote per unit, enforced by a unique
--   constraint + an RLS check that the vote is still open.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table if not exists digitalni_upravnik_buildings (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  address text not null,
  created_at timestamptz not null default now()
);

create table if not exists digitalni_upravnik_units (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references digitalni_upravnik_buildings(id) on delete cascade,
  label text not null,
  floor int,
  monthly_fee numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (building_id, label)
);

create table if not exists digitalni_upravnik_unit_contacts (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null unique references digitalni_upravnik_units(id) on delete cascade,
  owner_name text,
  tenant_name text,
  contact_email text,
  created_at timestamptz not null default now()
);

create table if not exists digitalni_upravnik_fund_transactions (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references digitalni_upravnik_buildings(id) on delete cascade,
  occurred_on date not null default current_date,
  description text not null,
  -- positive = income/deposit, negative = expense. Balance is sum(amount).
  amount numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists digitalni_upravnik_notices (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references digitalni_upravnik_buildings(id) on delete cascade,
  title text not null,
  body text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists digitalni_upravnik_votes (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references digitalni_upravnik_buildings(id) on delete cascade,
  question text not null,
  description text,
  closes_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists digitalni_upravnik_vote_options (
  id uuid primary key default gen_random_uuid(),
  vote_id uuid not null references digitalni_upravnik_votes(id) on delete cascade,
  label text not null,
  position int not null default 0
);

create table if not exists digitalni_upravnik_vote_responses (
  id uuid primary key default gen_random_uuid(),
  vote_id uuid not null references digitalni_upravnik_votes(id) on delete cascade,
  option_id uuid not null references digitalni_upravnik_vote_options(id) on delete cascade,
  unit_id uuid not null references digitalni_upravnik_units(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (vote_id, unit_id) -- one vote per unit
);

create index if not exists idx_digitalni_upravnik_units_building on digitalni_upravnik_units(building_id);
create index if not exists idx_digitalni_upravnik_fund_tx_building on digitalni_upravnik_fund_transactions(building_id);
create index if not exists idx_digitalni_upravnik_notices_building on digitalni_upravnik_notices(building_id);
create index if not exists idx_digitalni_upravnik_votes_building on digitalni_upravnik_votes(building_id);
create index if not exists idx_digitalni_upravnik_vote_options_vote on digitalni_upravnik_vote_options(vote_id);
create index if not exists idx_digitalni_upravnik_vote_responses_vote on digitalni_upravnik_vote_responses(vote_id);

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table digitalni_upravnik_buildings enable row level security;
alter table digitalni_upravnik_units enable row level security;
alter table digitalni_upravnik_unit_contacts enable row level security;
alter table digitalni_upravnik_fund_transactions enable row level security;
alter table digitalni_upravnik_notices enable row level security;
alter table digitalni_upravnik_votes enable row level security;
alter table digitalni_upravnik_vote_options enable row level security;
alter table digitalni_upravnik_vote_responses enable row level security;

-- buildings: public read (the board is meant to be shared by link), manager-only write
create policy "buildings public read" on digitalni_upravnik_buildings
  for select to anon, authenticated using (true);
create policy "buildings manager insert" on digitalni_upravnik_buildings
  for insert to authenticated with check (auth.uid() = manager_id);
create policy "buildings manager update" on digitalni_upravnik_buildings
  for update to authenticated using (auth.uid() = manager_id) with check (auth.uid() = manager_id);
create policy "buildings manager delete" on digitalni_upravnik_buildings
  for delete to authenticated using (auth.uid() = manager_id);

-- units: public read (non-sensitive fields only — label/floor/fee), manager-only write
create policy "units public read" on digitalni_upravnik_units
  for select to anon, authenticated using (true);
create policy "units manager insert" on digitalni_upravnik_units
  for insert to authenticated with check (
    exists (select 1 from digitalni_upravnik_buildings b where b.id = building_id and b.manager_id = auth.uid())
  );
create policy "units manager update" on digitalni_upravnik_units
  for update to authenticated using (
    exists (select 1 from digitalni_upravnik_buildings b where b.id = building_id and b.manager_id = auth.uid())
  ) with check (
    exists (select 1 from digitalni_upravnik_buildings b where b.id = building_id and b.manager_id = auth.uid())
  );
create policy "units manager delete" on digitalni_upravnik_units
  for delete to authenticated using (
    exists (select 1 from digitalni_upravnik_buildings b where b.id = building_id and b.manager_id = auth.uid())
  );

-- unit_contacts: manager-only, in and out (this is the PII table)
create policy "unit_contacts manager select" on digitalni_upravnik_unit_contacts
  for select to authenticated using (
    exists (
      select 1 from digitalni_upravnik_units u
      join digitalni_upravnik_buildings b on b.id = u.building_id
      where u.id = unit_id and b.manager_id = auth.uid()
    )
  );
create policy "unit_contacts manager insert" on digitalni_upravnik_unit_contacts
  for insert to authenticated with check (
    exists (
      select 1 from digitalni_upravnik_units u
      join digitalni_upravnik_buildings b on b.id = u.building_id
      where u.id = unit_id and b.manager_id = auth.uid()
    )
  );
create policy "unit_contacts manager update" on digitalni_upravnik_unit_contacts
  for update to authenticated using (
    exists (
      select 1 from digitalni_upravnik_units u
      join digitalni_upravnik_buildings b on b.id = u.building_id
      where u.id = unit_id and b.manager_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from digitalni_upravnik_units u
      join digitalni_upravnik_buildings b on b.id = u.building_id
      where u.id = unit_id and b.manager_id = auth.uid()
    )
  );
create policy "unit_contacts manager delete" on digitalni_upravnik_unit_contacts
  for delete to authenticated using (
    exists (
      select 1 from digitalni_upravnik_units u
      join digitalni_upravnik_buildings b on b.id = u.building_id
      where u.id = unit_id and b.manager_id = auth.uid()
    )
  );

-- fund_transactions: public read (fund transparency), manager-only write
create policy "fund_tx public read" on digitalni_upravnik_fund_transactions
  for select to anon, authenticated using (true);
create policy "fund_tx manager insert" on digitalni_upravnik_fund_transactions
  for insert to authenticated with check (
    exists (select 1 from digitalni_upravnik_buildings b where b.id = building_id and b.manager_id = auth.uid())
  );
create policy "fund_tx manager delete" on digitalni_upravnik_fund_transactions
  for delete to authenticated using (
    exists (select 1 from digitalni_upravnik_buildings b where b.id = building_id and b.manager_id = auth.uid())
  );

-- notices: public read, manager-only write
create policy "notices public read" on digitalni_upravnik_notices
  for select to anon, authenticated using (true);
create policy "notices manager insert" on digitalni_upravnik_notices
  for insert to authenticated with check (
    exists (select 1 from digitalni_upravnik_buildings b where b.id = building_id and b.manager_id = auth.uid())
  );
create policy "notices manager update" on digitalni_upravnik_notices
  for update to authenticated using (
    exists (select 1 from digitalni_upravnik_buildings b where b.id = building_id and b.manager_id = auth.uid())
  ) with check (
    exists (select 1 from digitalni_upravnik_buildings b where b.id = building_id and b.manager_id = auth.uid())
  );
create policy "notices manager delete" on digitalni_upravnik_notices
  for delete to authenticated using (
    exists (select 1 from digitalni_upravnik_buildings b where b.id = building_id and b.manager_id = auth.uid())
  );

-- votes: public read, manager-only write
create policy "votes public read" on digitalni_upravnik_votes
  for select to anon, authenticated using (true);
create policy "votes manager insert" on digitalni_upravnik_votes
  for insert to authenticated with check (
    exists (select 1 from digitalni_upravnik_buildings b where b.id = building_id and b.manager_id = auth.uid())
  );
create policy "votes manager update" on digitalni_upravnik_votes
  for update to authenticated using (
    exists (select 1 from digitalni_upravnik_buildings b where b.id = building_id and b.manager_id = auth.uid())
  ) with check (
    exists (select 1 from digitalni_upravnik_buildings b where b.id = building_id and b.manager_id = auth.uid())
  );
create policy "votes manager delete" on digitalni_upravnik_votes
  for delete to authenticated using (
    exists (select 1 from digitalni_upravnik_buildings b where b.id = building_id and b.manager_id = auth.uid())
  );

-- vote_options: public read, manager-only write
create policy "vote_options public read" on digitalni_upravnik_vote_options
  for select to anon, authenticated using (true);
create policy "vote_options manager insert" on digitalni_upravnik_vote_options
  for insert to authenticated with check (
    exists (
      select 1 from digitalni_upravnik_votes v
      join digitalni_upravnik_buildings b on b.id = v.building_id
      where v.id = vote_id and b.manager_id = auth.uid()
    )
  );
create policy "vote_options manager delete" on digitalni_upravnik_vote_options
  for delete to authenticated using (
    exists (
      select 1 from digitalni_upravnik_votes v
      join digitalni_upravnik_buildings b on b.id = v.building_id
      where v.id = vote_id and b.manager_id = auth.uid()
    )
  );

-- vote_responses: public read (tally is transparent), public insert (tenants
-- have no accounts) gated by "vote still open" + option/unit belong to this
-- vote's building, manager-only delete (to correct mistakes), no update
-- (a response is immutable — recast by asking the manager to delete it).
create policy "vote_responses public read" on digitalni_upravnik_vote_responses
  for select to anon, authenticated using (true);
create policy "vote_responses public insert while open" on digitalni_upravnik_vote_responses
  for insert to anon, authenticated with check (
    exists (
      select 1 from digitalni_upravnik_votes v
      where v.id = vote_id and v.closes_at > now()
    )
    and exists (
      select 1 from digitalni_upravnik_vote_options o
      where o.id = option_id and o.vote_id = vote_id
    )
    and exists (
      select 1 from digitalni_upravnik_units u
      join digitalni_upravnik_votes v on v.building_id = u.building_id
      where u.id = unit_id and v.id = vote_id
    )
  );
create policy "vote_responses manager delete" on digitalni_upravnik_vote_responses
  for delete to authenticated using (
    exists (
      select 1 from digitalni_upravnik_votes v
      join digitalni_upravnik_buildings b on b.id = v.building_id
      where v.id = vote_id and b.manager_id = auth.uid()
    )
  );
