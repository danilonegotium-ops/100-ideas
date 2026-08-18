-- Digitalni Upravnik — seed.sql
--
-- Demo data: one building ("Bulevar Oslobođenja 45"), 12 units/tenants, a
-- fund ledger, two open votes with some cast responses, and a few notices.
--
-- IMPORTANT: `auth.users` rows are created by Supabase Auth itself (e.g. by
-- signing in once via the app's magic-link /login flow) — this script does
-- NOT create a login. Before running this file:
--   1. Run schema.sql first.
--   2. Sign in once via /login with the demo manager's email (any inbox you
--      control), or otherwise create a user in the Supabase dashboard.
--   3. Copy that user's `id` from Authentication -> Users.
--   4. Replace the `demo_manager_id` placeholder value below with it.
-- Until then this script will fail its foreign key check against
-- auth.users, by design — there is no way to seed a real login from plain
-- SQL, and inserting directly into auth.users is unsupported/fragile.

do $$
declare
  demo_manager_id uuid := '00000000-0000-0000-0000-000000000001'; -- <-- replace with a real auth.users id
  v_building_id uuid;
  v_unit_ids uuid[] := '{}';
  v_unit_id uuid;
  v_vote1_id uuid;
  v_vote1_yes uuid;
  v_vote1_no uuid;
  v_vote2_id uuid;
  v_vote2_opt1 uuid;
  i int;
begin
  insert into digitalni_upravnik_buildings (manager_id, name, address)
  values (demo_manager_id, 'Bulevar Oslobođenja 45', 'Bulevar Oslobođenja 45, Novi Sad')
  returning id into v_building_id;

  for i in 1..12 loop
    insert into digitalni_upravnik_units (building_id, label, floor, monthly_fee)
    values (v_building_id, 'Stan ' || i, ((i - 1) / 2), 2500.00)
    returning id into v_unit_id;
    v_unit_ids := array_append(v_unit_ids, v_unit_id);

    insert into digitalni_upravnik_unit_contacts (unit_id, owner_name, tenant_name, contact_email)
    values (
      v_unit_id,
      'Vlasnik Stana ' || i,
      'Stanar Stana ' || i,
      'stan' || i || '@example.com'
    );
  end loop;

  insert into digitalni_upravnik_fund_transactions (building_id, occurred_on, description, amount)
  values
    (v_building_id, current_date - interval '60 days', 'Uplata održavanja — jul', 30000.00),
    (v_building_id, current_date - interval '45 days', 'Popravka lifta', -12500.00),
    (v_building_id, current_date - interval '30 days', 'Uplata održavanja — avgust', 30000.00),
    (v_building_id, current_date - interval '20 days', 'Čišćenje i održavanje dvorišta', -4000.00),
    (v_building_id, current_date - interval '10 days', 'Zamena sijalica u hodniku', -1800.00),
    (v_building_id, current_date - interval '2 days', 'Uplata održavanja — septembar', 30000.00);

  insert into digitalni_upravnik_notices (building_id, title, body, pinned)
  values
    (v_building_id, 'Godišnja skupština stanara', 'Skupština je zakazana za poslednju subotu u mesecu u 18h, u zajedničkoj prostoriji u prizemlju.', true),
    (v_building_id, 'Radovi na fasadi', 'Od ponedeljka počinju radovi na fasadi zgrade. Moguća je buka radnim danima od 8 do 16h.', false),
    (v_building_id, 'Novi raspored odnošenja smeća', 'Kontejneri se od ovog meseca prazne utorkom i petkom ujutru.', false);

  insert into digitalni_upravnik_votes (building_id, question, description, closes_at)
  values (
    v_building_id,
    'Da li da postavimo nadzorne kamere na ulazu?',
    'Predlog upravnika nakon nedavnog pokušaja provale u podrum. Kamere bi pokrivale glavni ulaz i hodnik u prizemlju.',
    now() + interval '14 days'
  )
  returning id into v_vote1_id;

  insert into digitalni_upravnik_vote_options (vote_id, label, position)
  values (v_vote1_id, 'Za', 0)
  returning id into v_vote1_yes;

  insert into digitalni_upravnik_vote_options (vote_id, label, position)
  values (v_vote1_id, 'Protiv', 1)
  returning id into v_vote1_no;

  insert into digitalni_upravnik_vote_responses (vote_id, option_id, unit_id)
  values
    (v_vote1_id, v_vote1_yes, v_unit_ids[1]),
    (v_vote1_id, v_vote1_yes, v_unit_ids[2]),
    (v_vote1_id, v_vote1_no, v_unit_ids[3]),
    (v_vote1_id, v_vote1_yes, v_unit_ids[4]),
    (v_vote1_id, v_vote1_yes, v_unit_ids[6]);

  insert into digitalni_upravnik_votes (building_id, question, description, closes_at)
  values (
    v_building_id,
    'Izbor nove firme za održavanje lifta',
    'Trenutni ugovor sa Liftservisom ističe krajem meseca — potrebno je izabrati ponudu za narednu godinu.',
    now() + interval '7 days'
  )
  returning id into v_vote2_id;

  insert into digitalni_upravnik_vote_options (vote_id, label, position)
  values (v_vote2_id, 'Liftservis d.o.o. (postojeći)', 0)
  returning id into v_vote2_opt1;

  insert into digitalni_upravnik_vote_options (vote_id, label, position)
  values (v_vote2_id, 'ELind Novi Sad', 1);

  insert into digitalni_upravnik_vote_responses (vote_id, option_id, unit_id)
  values (v_vote2_id, v_vote2_opt1, v_unit_ids[5]);
end $$;
