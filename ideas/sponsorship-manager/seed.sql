-- Sponsorship Manager — seed.sql
--
-- Run AFTER schema.sql, and after creating (or picking) a demo account —
-- same placeholder-UUID instructions as this sprint's other Wave 3 ideas.
-- Replace 00000000-0000-0000-0000-000000000001 with a real `auth.users.id`
-- before these rows will be visible to anyone (RLS scopes every row to
-- its owning user). 8 demo deals spread across every pipeline stage.

insert into sponsorship_manager_deals
  (user_id, sponsor_name, contact_name, contact_email, stage, deal_value, currency, notes, next_action, next_action_date)
values
  ('00000000-0000-0000-0000-000000000001', 'NordVPN', 'Petra Lindqvist', 'petra@nordvpnsponsors.example', 'prospecting', 2500.00, 'USD', 'Found via their sponsorship inbound form. Awaiting media kit request response.', 'Send media kit', current_date + interval '2 days'),
  ('00000000-0000-0000-0000-000000000001', 'Squarespace', 'Devon Marsh', 'devon.marsh@squarespacepartners.example', 'prospecting', null, 'USD', 'Cold outreach sent last week, no reply yet.', 'Follow up if no reply by Friday', current_date + interval '4 days'),
  ('00000000-0000-0000-0000-000000000001', 'Raycon', 'Lily Tran', 'lily@rayconaffiliates.example', 'negotiating', 1800.00, 'USD', 'They countered with a lower flat fee + affiliate code instead. Considering it.', 'Reply with counter-offer', current_date + interval '1 days'),
  ('00000000-0000-0000-0000-000000000001', 'Skillshare', 'Marcus Webb', 'marcus.webb@skillshare.example', 'negotiating', 3200.00, 'USD', 'Verbal agreement on scope, waiting on their legal for contract draft.', 'Chase contract draft', current_date + interval '5 days'),
  ('00000000-0000-0000-0000-000000000001', 'Notion', 'Ana Kruger', 'ana.kruger@notionpartners.example', 'signed', 4000.00, 'USD', 'Contract signed, video due end of month.', 'Film and submit for approval', current_date + interval '10 days'),
  ('00000000-0000-0000-0000-000000000001', 'Athletic Greens', 'Ravi Chandran', 'ravi@ag1sponsors.example', 'paid', 5000.00, 'USD', 'Ran the integration in last month''s video, payment cleared.', null, null),
  ('00000000-0000-0000-0000-000000000001', 'HelloFresh', 'Nina Ostrowski', 'nina@hellofreshcreators.example', 'paid', 2200.00, 'USD', null, null, null),
  ('00000000-0000-0000-0000-000000000001', 'Brilliant', 'Owen Faraday', 'owen@brilliantsponsors.example', 'declined', 1500.00, 'USD', 'Their exclusivity clause conflicted with an existing deal — passed on this one.', null, null);
