-- Rent Price Map — schema + RLS + seed data
-- Run against the shared Supabase project. Table name namespaced
-- `rent_price_map_*` per docs/PLAN.md's shared-project convention.
--
-- No auth, no accounts, genuinely anonymous by design: the table has no
-- user_id / email / IP / session column of any kind, so there is nothing
-- in the schema that could ever link a row back to whoever submitted it —
-- not even for us as the app operators.

create extension if not exists pgcrypto; -- provides gen_random_uuid()

-- ---------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------

create table if not exists rent_price_map_reports (
  id uuid primary key default gen_random_uuid(),
  city text not null check (char_length(city) between 1 and 100),
  neighborhood text not null check (char_length(neighborhood) between 1 and 100),
  rent_eur numeric(8, 2) not null check (rent_eur > 0 and rent_eur <= 10000),
  rooms text not null check (rooms in ('studio', '1', '2', '3', '4', '5+')),
  size_m2 numeric(6, 1) check (size_m2 is null or (size_m2 > 0 and size_m2 <= 1000)),
  note text check (note is null or char_length(note) <= 500),
  -- Coordinates are rounded to 2 decimal places (~1.1km grid) by the API
  -- route (app/api/reports/route.ts) before insert — a technical
  -- enforcement of "neighborhood-level pin, not an exact address", not
  -- just a UI convention. The range check below is a generous bounding
  -- box around Serbia (with margin), matching this MVP's Serbia scope.
  lat double precision not null check (lat between 40 and 47),
  lng double precision not null check (lng between 18 and 24),
  created_at timestamptz not null default now()
);

create index if not exists rent_price_map_reports_city_idx
  on rent_price_map_reports (city);

create index if not exists rent_price_map_reports_created_at_idx
  on rent_price_map_reports (created_at desc);

-- ---------------------------------------------------------------------
-- Row Level Security — the abuse-resistance design for anonymous writes
-- ---------------------------------------------------------------------
--
-- Threat model: anyone (no login) can and should be able to add a report.
-- Nobody — not the original submitter, not another visitor, not an
-- authenticated user of some *other* idea sharing this Supabase project —
-- should ever be able to modify or remove an existing report through the
-- public API. There's also no column to scope an "own this row" check to
-- even if we wanted one, by design (see the note above).

alter table rent_price_map_reports enable row level security;

-- Anyone can read every report — that's the entire point of the map.
create policy "reports_select_all" on rent_price_map_reports
  for select using (true);

-- Anyone can insert a new report. `with check (true)` looks permissive,
-- but "permissive to insert" is intentional and correctly scoped — see the
-- next paragraph for why it can't be abused to affect *existing* rows.
create policy "reports_insert_all" on rent_price_map_reports
  for insert with check (true);

-- Deliberately NO update or delete policy is defined for any role, on
-- this table, anywhere. Postgres RLS defaults to deny for any operation
-- that has no matching policy once RLS is enabled on a table — so
-- UPDATE/DELETE are impossible through the public `anon`/`authenticated`
-- API keys no matter what request is sent, full stop. Only the
-- `service_role` key (server-side only, never present in this app's
-- client or server code, no route ever uses it) bypasses RLS entirely and
-- could be used for manual spam moderation from the Supabase dashboard —
-- that's the one intended escape hatch, and it requires direct DB/dashboard
-- access, not anything reachable from the deployed app.

-- ---------------------------------------------------------------------
-- Seed / demo data — ~15 illustrative reports across Belgrade & Novi Sad
-- ---------------------------------------------------------------------
--
-- Figures are hand-picked, plausible ballpark numbers based on general
-- knowledge of the two cities' rental markets, NOT scraped/verified live
-- listings (no live data source was available while building this
-- offline) — labeled here and in SPEC.md as illustrative demo data, same
-- as this sprint's other Serbia-flavored constants (e.g.
-- `solar-panel-roi-calculator`'s electricity price constants).
-- Coordinates are approximate neighborhood centers, already at ~2-decimal
-- precision to match what the real submission flow would store.

insert into rent_price_map_reports
  (city, neighborhood, rent_eur, rooms, size_m2, note, lat, lng, created_at)
values
  -- Belgrade
  ('Belgrade', 'Vračar', 420, 'studio', 32, 'Close to Kalenić market, quiet street.', 44.80, 20.47, now() - interval '28 days'),
  ('Belgrade', 'Dorćol', 480, '1', 45, '5 min walk to the river, old building with high ceilings.', 44.83, 20.46, now() - interval '26 days'),
  ('Belgrade', 'Novi Beograd', 550, '2', 60, 'Near Ušće mall, newer building with parking.', 44.81, 20.40, now() - interval '24 days'),
  ('Belgrade', 'Zemun', 350, '1', 40, 'Old town Zemun, lovely but a bit far from the center.', 44.85, 20.40, now() - interval '21 days'),
  ('Belgrade', 'Voždovac', 470, '2', 55, null, 44.77, 20.48, now() - interval '19 days'),
  ('Belgrade', 'Čukarica', 330, '1', 38, 'Near Ada Ciganlija, great for running.', 44.78, 20.40, now() - interval '17 days'),
  ('Belgrade', 'Stari Grad', 400, 'studio', 28, 'Tiny but central, can be noisy with tourists nearby.', 44.82, 20.46, now() - interval '14 days'),
  ('Belgrade', 'Konjarnik', 420, '2', 58, 'Good public transport, interior is a bit worn.', 44.79, 20.51, now() - interval '11 days'),
  ('Belgrade', 'Banovo Brdo', 650, '3', 75, 'Family neighborhood, green, good schools nearby.', 44.79, 20.42, now() - interval '8 days'),
  -- Novi Sad
  ('Novi Sad', 'Liman', 400, '1', 42, 'Close to Štrand beach and the city park.', 45.24, 19.84, now() - interval '25 days'),
  ('Novi Sad', 'Grbavica', 430, '2', 55, 'Central, walkable to everything.', 45.25, 19.84, now() - interval '22 days'),
  ('Novi Sad', 'Detelinara', 300, '1', 40, 'Quiet residential area.', 45.26, 19.82, now() - interval '18 days'),
  ('Novi Sad', 'Novo Naselje', 280, 'studio', 30, null, 45.25, 19.81, now() - interval '15 days'),
  ('Novi Sad', 'Petrovaradin', 380, '2', 60, 'Across the river near the fortress, calmer than the center.', 45.25, 19.86, now() - interval '10 days'),
  ('Novi Sad', 'Telep', 310, '1', 45, 'Near the tram line into the center.', 45.24, 19.81, now() - interval '6 days'),
  ('Novi Sad', 'Klisa', 450, '3', 80, 'Newly built, a bit further out but modern.', 45.27, 19.80, now() - interval '3 days');
