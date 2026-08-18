-- Serbian for Expats — seed.sql
--
-- Demo data: a few completed lessons for one demo user, so the /progress
-- page isn't empty on first visit.
--
-- IMPORTANT: `auth.users` rows are created by Supabase Auth itself (sign in
-- once via /login), not by this script. Before running:
--   1. Run schema.sql first.
--   2. Sign in once via /login with the demo account's email.
--   3. Copy that user's `id` from Authentication -> Users in the dashboard.
--   4. Replace `demo_user_id` below with it.

do $$
declare
  demo_user_id uuid := '00000000-0000-0000-0000-000000000001'; -- <-- replace with a real auth.users id
begin
  insert into serbian_for_expats_progress (user_id, lesson_slug, score, total, completed_at)
  values
    (demo_user_id, 'pozdravi', 5, 5, now() - interval '6 days'),
    (demo_user_id, 'brojevi', 4, 5, now() - interval '4 days'),
    (demo_user_id, 'hrana-i-pice', 5, 5, now() - interval '1 days')
  on conflict (user_id, lesson_slug) do update
    set score = excluded.score, total = excluded.total, completed_at = excluded.completed_at;
end $$;
