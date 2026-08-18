-- Vrtic Management Tool — seed.sql
--
-- Demo data: one group ("Sunčeva grupa"), 10 children with parent contacts,
-- a week of attendance, a daily menu, and two photo posts.
--
-- IMPORTANT: `auth.users` rows are created by Supabase Auth itself (sign in
-- once via /login), not by this script. Before running:
--   1. Run schema.sql first.
--   2. Sign in once via /login with the demo teacher's email.
--   3. Copy that user's `id` from Authentication -> Users in the dashboard.
--   4. Replace `demo_teacher_id` below with it.
-- To also see the parent view for real, sign in a second time with one of
-- the seeded `parent*@example.com` addresses — that account's magic-link
-- email match against `child_contacts.parent_email` is what grants it read
-- access (see schema.sql's `vrtic_is_parent_of_child`).

do $$
declare
  demo_teacher_id uuid := '00000000-0000-0000-0000-000000000001'; -- <-- replace with a real auth.users id
  v_group_id uuid;
  v_child_ids uuid[] := '{}';
  v_child_id uuid;
  child_names text[] := array[
    'Mila Jovanović', 'Nikola Petrović', 'Ana Ilić', 'Luka Stojanović', 'Teodora Nikolić',
    'Vuk Marković', 'Jovana Đorđević', 'Filip Pavlović', 'Lena Radović', 'Đorđe Milošević'
  ];
  d date;
  i int;
  statuses text[] := array['present', 'present', 'present', 'sick', 'present'];
begin
  insert into vrtic_management_tool_groups (teacher_id, name)
  values (demo_teacher_id, 'Sunčeva grupa')
  returning id into v_group_id;

  for i in 1..10 loop
    insert into vrtic_management_tool_children (group_id, full_name, birth_date)
    values (v_group_id, child_names[i], date '2021-01-01' + ((i * 37) || ' days')::interval)
    returning id into v_child_id;
    v_child_ids := array_append(v_child_ids, v_child_id);

    insert into vrtic_management_tool_child_contacts (child_id, parent_name, parent_email)
    values (v_child_id, 'Roditelj ' || child_names[i], 'parent' || i || '@example.com');
  end loop;

  -- a week of attendance (5 weekdays) for every child; one child (index 4,
  -- "Teodora") is marked sick on day 3 for a bit of realistic variation.
  for i in 1..10 loop
    for d in select generate_series(current_date - 6, current_date - 2, interval '1 day')::date loop
      insert into vrtic_management_tool_attendance_records (child_id, group_id, attendance_date, status)
      values (
        v_child_ids[i],
        v_group_id,
        d,
        case when i = 5 and d = current_date - 4 then 'sick' else 'present' end
      )
      on conflict (child_id, attendance_date) do nothing;
    end loop;
  end loop;

  insert into vrtic_management_tool_daily_menus (group_id, menu_date, breakfast, lunch, snack)
  values
    (v_group_id, current_date, 'Ovsena kaša sa voćem', 'Pileća supa, pire krompir, šnicla', 'Jogurt i keks'),
    (v_group_id, current_date - 1, 'Palačinke sa džemom', 'Pasulj čorba, hleb', 'Voćna salata');

  insert into vrtic_management_tool_photo_posts (group_id, caption, placeholder_key)
  values
    (v_group_id, 'Jutarnji krug i pesmica dobrodošlice', 'sun'),
    (v_group_id, 'Slikanje jesenjeg lišća bojicama', 'painting');
end $$;
