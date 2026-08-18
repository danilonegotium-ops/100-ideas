-- Automated Invoice Chaser — seed.sql
--
-- Demo data so the dashboard isn't empty on first login. Run AFTER
-- schema.sql, and after creating (or picking) a demo account:
--
--   1. Sign up for real via the app's magic-link login (/login) with
--      whatever email you want to use as the demo/test account.
--   2. Find that user's id:
--        select id, email from auth.users where email = 'your-demo@email';
--   3. Replace every `00000000-0000-0000-0000-000000000001` below with
--      that real UUID before running this file. Until that swap happens,
--      these rows are technically inserted (the SQL editor runs as a
--      role that bypasses RLS) but Row Level Security means they won't be
--      visible to ANY logged-in user, because the placeholder UUID
--      doesn't match a real auth.users row.
--
-- Dates are relative to CURRENT_DATE so the demo always looks "live"
-- (some invoices freshly overdue, some due soon, some already paid)
-- regardless of when this file actually gets run.

insert into automated_invoice_chaser_invoices
  (user_id, client_name, client_email, amount, currency, issue_date, due_date, status, notes)
values
  ('00000000-0000-0000-0000-000000000001', 'Bloom & Co Florists', 'accounts@bloomandco.example', 450.00, 'USD', current_date - interval '40 days', current_date - interval '10 days', 'pending', 'Third reminder due — biggest overdue balance.'),
  ('00000000-0000-0000-0000-000000000001', 'Nordic Design Studio', 'billing@nordicdesign.example', 1200.00, 'USD', current_date - interval '35 days', current_date - interval '5 days', 'pending', null),
  ('00000000-0000-0000-0000-000000000001', 'Riverside Cafe', 'owner@riversidecafe.example', 180.50, 'USD', current_date - interval '20 days', current_date - interval '1 days', 'pending', 'Usually pays within a couple days of the reminder.'),
  ('00000000-0000-0000-0000-000000000001', 'Vantage Consulting', 'ap@vantageconsulting.example', 3200.00, 'USD', current_date - interval '15 days', current_date + interval '2 days', 'pending', 'Net-30 client, historically reliable.'),
  ('00000000-0000-0000-0000-000000000001', 'Willow Creek Yoga', 'hello@willowcreekyoga.example', 95.00, 'USD', current_date - interval '10 days', current_date + interval '5 days', 'pending', null),
  ('00000000-0000-0000-0000-000000000001', 'Pinehurst Landscaping', 'invoices@pinehurstlandscaping.example', 675.00, 'USD', current_date - interval '8 days', current_date + interval '12 days', 'pending', null),
  ('00000000-0000-0000-0000-000000000001', 'Skyline Marketing Group', 'finance@skylinemarketing.example', 2100.00, 'USD', current_date - interval '50 days', current_date - interval '20 days', 'paid', 'Paid via bank transfer.'),
  ('00000000-0000-0000-0000-000000000001', 'Harbor Books', 'orders@harborbooks.example', 320.00, 'USD', current_date - interval '45 days', current_date - interval '15 days', 'paid', null),
  ('00000000-0000-0000-0000-000000000001', 'Cedar & Stone Architecture', 'ap@cedarstone.example', 4800.00, 'USD', current_date - interval '60 days', current_date - interval '30 days', 'paid', 'Large project milestone payment.'),
  ('00000000-0000-0000-0000-000000000001', 'Maple Street Bakery', 'maple.street@example.com', 60.00, 'USD', current_date - interval '90 days', current_date - interval '60 days', 'void', 'Cancelled order, invoice voided.');

-- One prior reminder logged against the oldest overdue invoice, so the
-- "last reminded" trail has an example on first login. Uses a correlated
-- subquery instead of a hardcoded id since gen_random_uuid() ids differ
-- every run.
insert into automated_invoice_chaser_reminders (invoice_id, user_id, sent_at, channel, delivery_status, message_preview)
select id, '00000000-0000-0000-0000-000000000001', current_date - interval '9 days', 'email', 'logged',
  'Reminder: Invoice for Bloom & Co Florists ($450.00) was due on ' || to_char(due_date, 'Mon DD, YYYY') || '.'
from automated_invoice_chaser_invoices
where user_id = '00000000-0000-0000-0000-000000000001'
  and client_name = 'Bloom & Co Florists'
limit 1;
