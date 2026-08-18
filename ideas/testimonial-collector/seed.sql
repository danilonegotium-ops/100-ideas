-- Testimonial Collector — seed.sql
--
-- Run AFTER schema.sql. Unlike the other Wave 3 ideas in this batch, part
-- of this demo works WITHOUT any placeholder-UUID fixup: the public
-- collection page (/c/demo-coaching) and the embed endpoint
-- (/api/embed/demo-coaching) only need approved testimonials to be
-- publicly readable, which they are (`testimonials_select_approved_public`
-- doesn't check `user_id` at all). The DASHBOARD view (moderation queue,
-- "your collections" list) still needs the placeholder UUID below swapped
-- for a real `auth.users.id` — same one-time step as the other ideas'
-- seed files: sign up via /login, then
--   select id, email from auth.users where email = 'your-demo@email';
-- and replace 00000000-0000-0000-0000-000000000001 throughout.

insert into testimonial_collector_collections (id, user_id, slug, business_name, prompt_text)
values (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'demo-coaching',
  'Acme Coaching',
  'Tell us about your experience working with Acme Coaching — what changed for you?'
);

insert into testimonial_collector_testimonials
  (collection_id, author_name, author_email, content, rating, status, submitted_at)
values
  ('10000000-0000-0000-0000-000000000001', 'Priya Malhotra', 'priya@example.com',
   'Working with Acme Coaching completely changed how I approach my mornings. Six months in and I''ve finally got a routine that sticks.',
   5, 'approved', now() - interval '20 days'),
  ('10000000-0000-0000-0000-000000000001', 'Jordan Lee', 'jordan@example.com',
   'I was skeptical at first, but the accountability check-ins made all the difference. Would recommend to anyone stuck in a rut.',
   5, 'approved', now() - interval '12 days'),
  ('10000000-0000-0000-0000-000000000001', 'Sam Okafor', null,
   'Solid program overall. A few sessions felt a bit rushed, but the results speak for themselves.',
   4, 'approved', now() - interval '6 days'),
  ('10000000-0000-0000-0000-000000000001', 'Taylor Brooks', 'taylor@example.com',
   'Just finished my first month — loving it so far! Excited to see where the next few months take me.',
   5, 'pending', now() - interval '1 days'),
  ('10000000-0000-0000-0000-000000000001', 'Morgan Reyes', 'morgan@example.com',
   'Didn''t click with my coach''s style, unfortunately. Might try again with a different coach in the future.',
   2, 'rejected', now() - interval '15 days');
