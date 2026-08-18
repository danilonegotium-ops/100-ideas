-- Serbian for Expats — schema.sql
--
-- Run against the shared Supabase project's SQL editor. Table namespaced
-- `serbian_for_expats_*` per the sprint's shared-project convention.
--
-- Lesson/quiz CONTENT itself is not in the database — it's curated,
-- fixed data shipped with the app (see lib/lessons.ts), the same way a
-- static site would ship curated content as code. The only thing that
-- genuinely needs a database is PER-USER PROGRESS, which is exactly the
-- "private-per-user data gets owner-only RLS" case from the task brief:
-- nobody else should be able to read or forge another user's quiz scores.

create extension if not exists pgcrypto;

create table if not exists serbian_for_expats_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- matches a `Lesson.slug` in lib/lessons.ts (e.g. "pozdravi"). Not a
  -- foreign key since lesson content lives in code, not a table.
  lesson_slug text not null,
  score int not null,
  total int not null,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_slug)
);

create index if not exists idx_serbian_for_expats_progress_user
  on serbian_for_expats_progress(user_id);

alter table serbian_for_expats_progress enable row level security;

-- Fully owner-only: a user can only ever see/write their own progress rows.
create policy "progress owner select" on serbian_for_expats_progress
  for select to authenticated using (auth.uid() = user_id);
create policy "progress owner insert" on serbian_for_expats_progress
  for insert to authenticated with check (auth.uid() = user_id);
create policy "progress owner update" on serbian_for_expats_progress
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "progress owner delete" on serbian_for_expats_progress
  for delete to authenticated using (auth.uid() = user_id);
