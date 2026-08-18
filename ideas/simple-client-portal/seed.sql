-- Simple Client Portal — seed.sql
--
-- Demo data: one project, one invited client, two updates, one placeholder
-- file reference.
--
-- IMPORTANT: `auth.users` rows are created by Supabase Auth itself (sign in
-- once via /login), not by this script. Before running:
--   1. Run schema.sql, then storage.sql.
--   2. Sign in once via /login as the demo freelancer.
--   3. Copy that user's `id` from Authentication -> Users.
--   4. Replace `demo_freelancer_id` below with it.
-- To see the client's view for real, also sign in as
-- "klijent@example.com" (or change the seeded email to one you control).
--
-- NOTE: the seeded `project_files` row is DB metadata only — no matching
-- object actually exists in Supabase Storage (this script can't upload
-- real bytes). Generating a signed URL for it will 404 until a real file
-- is uploaded through the app at that same path. This is intentional per
-- the task brief ("seed a placeholder file reference").

do $$
declare
  demo_freelancer_id uuid := '00000000-0000-0000-0000-000000000001'; -- <-- replace with a real auth.users id
  v_project_id uuid;
begin
  insert into simple_client_portal_projects (freelancer_id, name, description)
  values (
    demo_freelancer_id,
    'Redizajn sajta — Studio Kappa',
    'Redizajn korporativnog sajta: nova naslovna strana, portfolio sekcija i kontakt formular.'
  )
  returning id into v_project_id;

  insert into simple_client_portal_project_clients (project_id, client_email)
  values (v_project_id, 'klijent@example.com');

  insert into simple_client_portal_project_updates (project_id, author_id, body)
  values
    (
      v_project_id,
      demo_freelancer_id,
      'Poslao sam prvi predlog dizajna naslovne strane — pogledajte fajl ispod i javite utiske.'
    ),
    (
      v_project_id,
      demo_freelancer_id,
      'Ugrađene su izmene sa prošlog sastanka. Sledeći korak: portfolio sekcija, planiram da završim do petka.'
    );

  insert into simple_client_portal_project_files (
    project_id, uploaded_by, storage_path, file_name, size_bytes, content_type
  )
  values (
    v_project_id,
    demo_freelancer_id,
    v_project_id || '/predlog-dizajna-v1.pdf',
    'predlog-dizajna-v1.pdf',
    482304,
    'application/pdf'
  );
end $$;
