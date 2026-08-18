-- Subscription Tracker for Teams — seed.sql
-- ~12 demo subscriptions with a realistic mix of actively-used tools and
-- "zombie" candidates (unused 60+ days, or never used at all). Run after
-- schema.sql. Dates are relative to `current_date` so the zombie flag
-- (computed in the app, current_stock-style: today - last_used_date > 60)
-- stays meaningful no matter when this is actually run.

insert into subscription_tracker_teams_subscriptions
  (tool_name, cost_cents, billing_cycle, owner_name, category, url, last_used_date, notes) values
  ('Figma', 1500, 'monthly', 'Alice Chen', 'Design', 'https://figma.com', current_date - 2, null),
  ('Notion', 1000, 'monthly', 'Bob Martinez', 'Productivity', 'https://notion.so', current_date - 5, null),
  ('Slack', 8000, 'monthly', 'Carol Nguyen', 'Communication', 'https://slack.com', current_date, 'Team plan, 20 seats'),
  ('GitHub Team', 2100, 'monthly', 'Dan Osei', 'Dev tools', 'https://github.com', current_date - 1, null),
  ('Zoom Pro', 15000, 'annual', 'Eve Larsson', 'Communication', 'https://zoom.us', current_date - 10, null),
  ('Datadog', 9900, 'monthly', 'Dan Osei', 'Dev tools', 'https://datadoghq.com', current_date - 8, null),
  ('Canva Pro', 12000, 'annual', 'Carol Nguyen', 'Design', 'https://canva.com', current_date - 45, null),
  ('Adobe Creative Cloud', 60000, 'annual', 'Frank Ibarra', 'Design', 'https://adobe.com', current_date - 95, 'Only one designer left using this'),
  ('Asana', 2500, 'monthly', 'Grace Kim', 'Productivity', 'https://asana.com', current_date - 120, 'Team migrated to Notion'),
  ('Mailchimp', 3500, 'monthly', 'Alice Chen', 'Marketing', 'https://mailchimp.com', null, 'Signed up for a campaign that never launched'),
  ('HelloSign', 1500, 'monthly', 'Bob Martinez', 'Legal', 'https://hellosign.com', current_date - 200, 'Replaced by DocuSign, forgot to cancel'),
  ('Loom', 9600, 'annual', 'Eve Larsson', 'Communication', 'https://loom.com', current_date - 75, null);
