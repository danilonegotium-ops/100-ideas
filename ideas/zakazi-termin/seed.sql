-- Zakazi Termin — seed.sql
--
-- Demo data: one shop ("Frizerski Salon Stil") with a week of half-hour
-- slots (09:00-17:00 weekdays), a few pre-booked.
--
-- IMPORTANT: `auth.users` rows are created by Supabase Auth itself (sign in
-- once via /login), not by this script. Before running:
--   1. Run schema.sql first.
--   2. Sign in once via /login with the demo owner's email.
--   3. Copy that user's `id` from Authentication -> Users in the dashboard.
--   4. Replace `demo_owner_id` below with it.

do $$
declare
  demo_owner_id uuid := '00000000-0000-0000-0000-000000000001'; -- <-- replace with a real auth.users id
  v_shop_id uuid;
  v_slot_id uuid;
  d date;
  slot_time time;
  booked_count int := 0;
begin
  insert into zakazi_termin_shops (owner_id, name, address, description)
  values (
    demo_owner_id,
    'Frizerski Salon Stil',
    'Kralja Petra 12, Beograd',
    'Šišanje, brijanje i farbanje — bez zakazivanja preko telefona.'
  )
  returning id into v_shop_id;

  -- weekdays (Mon-Fri) for the next 7 days, 09:00-17:00, 30-minute slots
  for d in select generate_series(current_date, current_date + 6, interval '1 day')::date loop
    if extract(isodow from d) between 1 and 5 then
      slot_time := time '09:00';
      while slot_time < time '17:00' loop
        insert into zakazi_termin_slots (shop_id, starts_at, ends_at, service_name, status)
        values (
          v_shop_id,
          (d + slot_time) at time zone 'Europe/Belgrade',
          (d + slot_time + interval '30 minutes') at time zone 'Europe/Belgrade',
          'Šišanje',
          'open'
        )
        returning id into v_slot_id;

        -- book a handful of early slots on the first two days for demo purposes
        if d <= current_date + 1 and slot_time in (time '09:00', time '10:30', time '14:00') then
          insert into zakazi_termin_bookings (slot_id, shop_id, customer_name, customer_email)
          values (
            v_slot_id,
            v_shop_id,
            'Demo Mušterija ' || (booked_count + 1),
            'musterija' || (booked_count + 1) || '@example.com'
          );
          update zakazi_termin_slots set status = 'booked' where id = v_slot_id;
          booked_count := booked_count + 1;
        end if;

        slot_time := slot_time + interval '30 minutes';
      end loop;
    end if;
  end loop;
end $$;
