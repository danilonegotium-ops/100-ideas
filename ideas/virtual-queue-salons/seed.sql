-- Virtual Queue for Salons — seed.sql
-- One demo shop with a handful of queue entries in varied states, so the
-- customer view and staff dashboard both have something real to show
-- immediately. Run after schema.sql.

insert into virtual_queue_salons_shops (id, slug, name)
values ('22222222-2222-2222-2222-222222222222', 'glow-nail-bar', 'Glow Nail Bar')
on conflict (id) do nothing;

insert into virtual_queue_salons_entries
  (shop_id, customer_name, customer_email, party_size, status, joined_at, called_at, served_at)
values
  ('22222222-2222-2222-2222-222222222222', 'Mia Torres', 'mia@example.com', 1, 'served', now() - interval '55 minutes', now() - interval '40 minutes', now() - interval '25 minutes'),
  ('22222222-2222-2222-2222-222222222222', 'Jordan Blake', null, 2, 'served', now() - interval '48 minutes', now() - interval '35 minutes', now() - interval '20 minutes'),
  ('22222222-2222-2222-2222-222222222222', 'Priya Shah', 'priya@example.com', 1, 'called', now() - interval '20 minutes', now() - interval '2 minutes', null),
  ('22222222-2222-2222-2222-222222222222', 'Sam Okafor', null, 1, 'waiting', now() - interval '15 minutes', null, null),
  ('22222222-2222-2222-2222-222222222222', 'Elena Petrova', 'elena@example.com', 3, 'waiting', now() - interval '9 minutes', null, null),
  ('22222222-2222-2222-2222-222222222222', 'Noah Kim', null, 1, 'waiting', now() - interval '3 minutes', null, null),
  ('22222222-2222-2222-2222-222222222222', 'Ava Johnson', null, 1, 'cancelled', now() - interval '30 minutes', null, null);
