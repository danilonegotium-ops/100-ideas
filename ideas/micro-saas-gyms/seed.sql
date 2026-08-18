-- Micro-SaaS for Gyms — seed.sql
--
-- Run AFTER schema.sql, and after creating (or picking) a demo account —
-- see the same placeholder-UUID instructions as automated-invoice-chaser's
-- seed.sql. Replace every `00000000-0000-0000-0000-000000000001` below
-- with a real `auth.users.id` before these rows will be visible to anyone
-- (RLS scopes every row to its owning user).
--
-- Dates are relative to CURRENT_DATE so "expiring soon" / "expired" always
-- look correct regardless of when this file is actually run. 15 members
-- spanning active, expiring-soon (within 7 days), expired, and cancelled.

insert into micro_saas_gyms_members
  (user_id, full_name, email, phone, plan_name, subscription_end, status, notes)
values
  ('00000000-0000-0000-0000-000000000001', 'Ana Petrovic', 'ana.petrovic@example.com', '+381 60 111 2222', 'Unlimited', current_date + interval '90 days', 'active', null),
  ('00000000-0000-0000-0000-000000000001', 'Marko Jovanovic', 'marko.j@example.com', '+381 60 111 3333', 'Unlimited', current_date + interval '60 days', 'active', null),
  ('00000000-0000-0000-0000-000000000001', 'Ivana Nikolic', 'ivana.nikolic@example.com', '+381 60 111 4444', '3x/week', current_date + interval '45 days', 'active', null),
  ('00000000-0000-0000-0000-000000000001', 'Stefan Ilic', 'stefan.ilic@example.com', '+381 60 111 5555', 'Unlimited', current_date + interval '30 days', 'active', null),
  ('00000000-0000-0000-0000-000000000001', 'Jelena Stojanovic', 'jelena.s@example.com', '+381 60 111 6666', '3x/week', current_date + interval '21 days', 'active', null),
  ('00000000-0000-0000-0000-000000000001', 'Nikola Pavlovic', 'nikola.p@example.com', '+381 60 111 7777', 'Unlimited', current_date + interval '5 days', 'active', 'Mentioned wanting to renew at check-in.'),
  ('00000000-0000-0000-0000-000000000001', 'Milica Djordjevic', 'milica.dj@example.com', '+381 60 111 8888', '3x/week', current_date + interval '3 days', 'active', null),
  ('00000000-0000-0000-0000-000000000001', 'Aleksandar Kovacevic', 'aleksandar.k@example.com', '+381 60 111 9999', 'Unlimited', current_date + interval '1 days', 'active', null),
  ('00000000-0000-0000-0000-000000000001', 'Tijana Radovic', 'tijana.radovic@example.com', '+381 60 112 1010', '1x/week', current_date - interval '4 days', 'active', 'Expired, hasn''t come in to renew yet.'),
  ('00000000-0000-0000-0000-000000000001', 'Bojan Simic', 'bojan.simic@example.com', '+381 60 112 1111', 'Unlimited', current_date - interval '15 days', 'active', null),
  ('00000000-0000-0000-0000-000000000001', 'Katarina Maric', 'katarina.maric@example.com', '+381 60 112 1212', '3x/week', current_date - interval '30 days', 'active', 'Long lapsed, consider a win-back email.'),
  ('00000000-0000-0000-0000-000000000001', 'Dusan Vukovic', 'dusan.vukovic@example.com', '+381 60 112 1313', 'Unlimited', current_date + interval '120 days', 'cancelled', 'Moved to another city, cancelled early.'),
  ('00000000-0000-0000-0000-000000000001', 'Sara Popovic', 'sara.popovic@example.com', '+381 60 112 1414', '1x/week', current_date - interval '10 days', 'cancelled', null),
  ('00000000-0000-0000-0000-000000000001', 'Vladimir Ristic', 'vladimir.ristic@example.com', '+381 60 112 1515', 'Unlimited', current_date + interval '75 days', 'active', null),
  ('00000000-0000-0000-0000-000000000001', 'Teodora Lukic', 'teodora.lukic@example.com', '+381 60 112 1616', '3x/week', current_date + interval '10 days', 'active', null);

-- A handful of check-ins today (for the "checked in today" dashboard
-- stat) plus a few over the last week, resolved via name lookup since
-- gen_random_uuid() ids differ every run.
insert into micro_saas_gyms_checkins (member_id, user_id, checked_in_at)
select id, '00000000-0000-0000-0000-000000000001', now() - interval '2 hours'
from micro_saas_gyms_members
where user_id = '00000000-0000-0000-0000-000000000001' and full_name = 'Ana Petrovic';

insert into micro_saas_gyms_checkins (member_id, user_id, checked_in_at)
select id, '00000000-0000-0000-0000-000000000001', now() - interval '45 minutes'
from micro_saas_gyms_members
where user_id = '00000000-0000-0000-0000-000000000001' and full_name = 'Marko Jovanovic';

insert into micro_saas_gyms_checkins (member_id, user_id, checked_in_at)
select id, '00000000-0000-0000-0000-000000000001', now() - interval '10 minutes'
from micro_saas_gyms_members
where user_id = '00000000-0000-0000-0000-000000000001' and full_name = 'Ivana Nikolic';

insert into micro_saas_gyms_checkins (member_id, user_id, checked_in_at)
select id, '00000000-0000-0000-0000-000000000001', now() - interval '1 days' - interval '3 hours'
from micro_saas_gyms_members
where user_id = '00000000-0000-0000-0000-000000000001' and full_name = 'Stefan Ilic';

insert into micro_saas_gyms_checkins (member_id, user_id, checked_in_at)
select id, '00000000-0000-0000-0000-000000000001', now() - interval '2 days' - interval '5 hours'
from micro_saas_gyms_members
where user_id = '00000000-0000-0000-0000-000000000001' and full_name = 'Jelena Stojanovic';
