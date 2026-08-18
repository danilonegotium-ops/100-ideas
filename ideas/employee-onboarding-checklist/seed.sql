-- Employee Onboarding Checklist — seed.sql
--
-- Run AFTER schema.sql, and after creating (or picking) a demo HR admin
-- account — same placeholder-UUID instructions as this sprint's other
-- Wave 3 ideas. Replace every 00000000-0000-0000-0000-000000000001 below
-- with a real `auth.users.id` before the HR dashboard will show anything
-- (RLS scopes owner-side rows to `user_id`/`owner_id`).
--
-- The HIRE side is different: each seeded onboarding's `hire_email` is
-- itself a real login identity under this system (whoever signs in with
-- that exact email sees that checklist). To actually click through the
-- hire experience, either sign in with one of the emails below, or update
-- a row's `hire_email` to an inbox you can access, e.g.:
--   update employee_onboarding_checklist_onboardings
--     set hire_email = 'you+hire-demo@example.com'
--     where hire_name = 'Sam Okafor';
--   update employee_onboarding_checklist_onboarding_tasks
--     set hire_email = 'you+hire-demo@example.com'
--     where onboarding_id = (select id from employee_onboarding_checklist_onboardings where hire_name = 'Sam Okafor');

insert into employee_onboarding_checklist_templates (id, user_id, name)
values ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Standard Engineering Onboarding');

insert into employee_onboarding_checklist_template_tasks (template_id, title, sort_order)
values
  ('20000000-0000-0000-0000-000000000001', 'Sign employment contract', 1),
  ('20000000-0000-0000-0000-000000000001', 'Set up work laptop', 2),
  ('20000000-0000-0000-0000-000000000001', 'Get added to Slack and email', 3),
  ('20000000-0000-0000-0000-000000000001', 'Complete security training', 4),
  ('20000000-0000-0000-0000-000000000001', 'Meet your onboarding buddy', 5),
  ('20000000-0000-0000-0000-000000000001', 'Review the company handbook', 6),
  ('20000000-0000-0000-0000-000000000001', 'Set up local dev environment', 7),
  ('20000000-0000-0000-0000-000000000001', 'First 1:1 with your manager', 8);

-- Three demo onboardings at different completion states: nearly done,
-- just started, and fully complete.
insert into employee_onboarding_checklist_onboardings (id, user_id, template_id, hire_name, hire_email, started_at)
values
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Jordan Ellis', 'jordan.ellis@example.com', current_date - interval '10 days'),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Sam Okafor', 'sam.okafor@example.com', current_date - interval '2 days'),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Priya Nair', 'priya.nair@example.com', current_date - interval '20 days');

-- Jordan Ellis: 6 of 8 tasks complete.
insert into employee_onboarding_checklist_onboarding_tasks
  (onboarding_id, owner_id, hire_email, title, sort_order, completed, completed_at)
values
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'jordan.ellis@example.com', 'Sign employment contract', 1, true, current_date - interval '10 days'),
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'jordan.ellis@example.com', 'Set up work laptop', 2, true, current_date - interval '9 days'),
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'jordan.ellis@example.com', 'Get added to Slack and email', 3, true, current_date - interval '9 days'),
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'jordan.ellis@example.com', 'Complete security training', 4, true, current_date - interval '7 days'),
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'jordan.ellis@example.com', 'Meet your onboarding buddy', 5, true, current_date - interval '6 days'),
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'jordan.ellis@example.com', 'Review the company handbook', 6, true, current_date - interval '4 days'),
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'jordan.ellis@example.com', 'Set up local dev environment', 7, false, null),
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'jordan.ellis@example.com', 'First 1:1 with your manager', 8, false, null);

-- Sam Okafor: just started, 1 of 8 complete.
insert into employee_onboarding_checklist_onboarding_tasks
  (onboarding_id, owner_id, hire_email, title, sort_order, completed, completed_at)
values
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'sam.okafor@example.com', 'Sign employment contract', 1, true, current_date - interval '2 days'),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'sam.okafor@example.com', 'Set up work laptop', 2, false, null),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'sam.okafor@example.com', 'Get added to Slack and email', 3, false, null),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'sam.okafor@example.com', 'Complete security training', 4, false, null),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'sam.okafor@example.com', 'Meet your onboarding buddy', 5, false, null),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'sam.okafor@example.com', 'Review the company handbook', 6, false, null),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'sam.okafor@example.com', 'Set up local dev environment', 7, false, null),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'sam.okafor@example.com', 'First 1:1 with your manager', 8, false, null);

-- Priya Nair: fully complete.
insert into employee_onboarding_checklist_onboarding_tasks
  (onboarding_id, owner_id, hire_email, title, sort_order, completed, completed_at)
values
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'priya.nair@example.com', 'Sign employment contract', 1, true, current_date - interval '20 days'),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'priya.nair@example.com', 'Set up work laptop', 2, true, current_date - interval '19 days'),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'priya.nair@example.com', 'Get added to Slack and email', 3, true, current_date - interval '19 days'),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'priya.nair@example.com', 'Complete security training', 4, true, current_date - interval '18 days'),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'priya.nair@example.com', 'Meet your onboarding buddy', 5, true, current_date - interval '17 days'),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'priya.nair@example.com', 'Review the company handbook', 6, true, current_date - interval '15 days'),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'priya.nair@example.com', 'Set up local dev environment', 7, true, current_date - interval '14 days'),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'priya.nair@example.com', 'First 1:1 with your manager', 8, true, current_date - interval '13 days');
