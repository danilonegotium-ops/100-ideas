-- Employee Onboarding Checklist — schema.sql
--
-- Run in the shared Supabase project's SQL editor. Tables namespaced
-- `employee_onboarding_checklist_*` per docs/PLAN.md's shared-project
-- convention.
--
-- Data model has TWO kinds of authenticated users sharing these tables:
--   1. The HR admin (`user_id` / `owner_id` columns) — creates templates,
--      assigns them to new hires, and views progress across everyone.
--   2. The new hire — logs in via the SAME magic-link flow, using
--      whatever email address HR assigned them under, and sees/completes
--      only their own checklist. A hire never needs an account created
--      for them ahead of time; they just sign in with the email HR typed
--      in, and Supabase auth + RLS (matching on email) does the rest.
--
-- `templates` / `template_tasks` are the reusable checklist definitions.
-- `onboardings` / `onboarding_tasks` are per-hire SNAPSHOTS taken at
-- assignment time (copied from a template's tasks) — so editing a
-- template later never retroactively changes a hire's in-progress
-- checklist. This is the standard "checklist template vs instance"
-- pattern.

create table if not exists employee_onboarding_checklist_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists employee_onboarding_checklist_template_tasks (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references employee_onboarding_checklist_templates (id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists employee_onboarding_checklist_template_tasks_template_id_idx
  on employee_onboarding_checklist_template_tasks (template_id, sort_order);

create table if not exists employee_onboarding_checklist_onboardings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Nullable + ON DELETE SET NULL: deleting the source template later
  -- should never destroy an already-assigned hire's checklist history.
  template_id uuid references employee_onboarding_checklist_templates (id) on delete set null,
  hire_name text not null,
  hire_email text not null,
  started_at date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists employee_onboarding_checklist_onboardings_user_id_idx
  on employee_onboarding_checklist_onboardings (user_id);

create index if not exists employee_onboarding_checklist_onboardings_hire_email_idx
  on employee_onboarding_checklist_onboardings (lower(hire_email));

create table if not exists employee_onboarding_checklist_onboarding_tasks (
  id uuid primary key default gen_random_uuid(),
  onboarding_id uuid not null references employee_onboarding_checklist_onboardings (id) on delete cascade,
  -- Denormalized from the parent onboarding row on purpose, so RLS here
  -- doesn't need a subquery join back to `onboardings` for every check —
  -- both the HR owner and the hire need direct, simple predicates.
  owner_id uuid not null,
  hire_email text not null,
  title text not null,
  sort_order integer not null default 0,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists employee_onboarding_checklist_onboarding_tasks_onboarding_id_idx
  on employee_onboarding_checklist_onboarding_tasks (onboarding_id, sort_order);

create index if not exists employee_onboarding_checklist_onboarding_tasks_hire_email_idx
  on employee_onboarding_checklist_onboarding_tasks (lower(hire_email));

-- Row Level Security --------------------------------------------------

alter table employee_onboarding_checklist_templates enable row level security;
alter table employee_onboarding_checklist_template_tasks enable row level security;
alter table employee_onboarding_checklist_onboardings enable row level security;
alter table employee_onboarding_checklist_onboarding_tasks enable row level security;

-- Templates: HR-owner only, no hire ever reads these directly (they only
-- see the SNAPSHOT in onboarding_tasks).
create policy "templates_all_own" on employee_onboarding_checklist_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "template_tasks_all_own" on employee_onboarding_checklist_template_tasks
  for all
  using (template_id in (select id from employee_onboarding_checklist_templates where user_id = auth.uid()))
  with check (template_id in (select id from employee_onboarding_checklist_templates where user_id = auth.uid()));

-- Onboardings: HR owner has full CRUD. The hire can SELECT (read-only)
-- their own onboarding row(s), matched by email on their JWT — this is
-- what lets a brand-new hire log in with no pre-created account and
-- immediately see the checklist HR assigned to that email address.
create policy "onboardings_all_own" on employee_onboarding_checklist_onboardings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "onboardings_select_hire" on employee_onboarding_checklist_onboardings
  for select using (lower(hire_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- Onboarding tasks: HR owner has full CRUD via `owner_id`. The hire can
-- SELECT and UPDATE (to check off tasks) their own rows via `hire_email`.
--
-- KNOWN SIMPLIFICATION for this MVP pass: the hire's UPDATE policy allows
-- updating the whole row, not just `completed`/`completed_at` — Postgres
-- row-level RLS can't restrict to specific columns without an extra
-- view/RPC layer. In practice a hire could rename their own task, which
-- is a data-integrity nuisance, not a security issue (they still can't
-- touch anyone else's rows, can't see other hires' checklists, and can't
-- write directly to `owner_id`/`onboarding_id`/`hire_email` in a way that
-- would let them jump to someone else's checklist — the WITH CHECK below
-- still requires the row to keep matching their own email after the
-- update). Documented here and in SPEC.md as a candidate for hardening
-- (e.g. a `toggle_onboarding_task(task_id, completed)` SECURITY DEFINER
-- function) before using this with real external hires.
create policy "onboarding_tasks_all_own" on employee_onboarding_checklist_onboarding_tasks
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "onboarding_tasks_select_hire" on employee_onboarding_checklist_onboarding_tasks
  for select using (lower(hire_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

create policy "onboarding_tasks_update_hire" on employee_onboarding_checklist_onboarding_tasks
  for update
  using (lower(hire_email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  with check (lower(hire_email) = lower(coalesce(auth.jwt() ->> 'email', '')));
