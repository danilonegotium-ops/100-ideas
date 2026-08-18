-- Code Snippet Vault — schema.sql
-- Run against the shared Supabase project's SQL editor. Table names are
-- namespaced `code_snippet_vault_*` per docs/PLAN.md's shared-project
-- convention.
--
-- ============================================================================
-- Demo user note
-- ----------------------------------------------------------------------------
-- Seed rows below are owned by a placeholder demo user, UUID
-- '00000000-0000-0000-0000-000000000001'. auth.users is managed by Supabase
-- Auth, not by this file, so seeding an actual auth user isn't part of this
-- schema. Before running the INSERTs at the bottom, either:
--   (a) sign up as a real user via the app's magic-link flow (/login), then
--       run `update code_snippet_vault_snippets set user_id = '<real-uuid>'
--       where user_id = '00000000-0000-0000-0000-000000000001';`, or
--   (b) create a user with that exact UUID via Supabase Dashboard ->
--       Authentication -> Users -> Add user (Supabase lets you set the UID
--       explicitly), then run the seed INSERTs as-is.
-- Until one of those exists, the seed INSERTs will fail with a foreign key
-- violation — that's expected, not a bug.
-- ============================================================================

create extension if not exists pgcrypto;

create table if not exists code_snippet_vault_snippets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  language text not null,
  code text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists code_snippet_vault_snippets_user_id_idx
  on code_snippet_vault_snippets (user_id);

create index if not exists code_snippet_vault_snippets_tags_idx
  on code_snippet_vault_snippets using gin (tags);

-- Keep updated_at current on every edit.
create or replace function code_snippet_vault_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists code_snippet_vault_snippets_set_updated_at on code_snippet_vault_snippets;
create trigger code_snippet_vault_snippets_set_updated_at
  before update on code_snippet_vault_snippets
  for each row
  execute function code_snippet_vault_set_updated_at();

-- Row Level Security: every snippet is private to its owner. No sharing
-- feature in this MVP, so there is no "public" read policy at all.
alter table code_snippet_vault_snippets enable row level security;

create policy code_snippet_vault_select_own
  on code_snippet_vault_snippets
  for select
  using (auth.uid() = user_id);

create policy code_snippet_vault_insert_own
  on code_snippet_vault_snippets
  for insert
  with check (auth.uid() = user_id);

create policy code_snippet_vault_update_own
  on code_snippet_vault_snippets
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy code_snippet_vault_delete_own
  on code_snippet_vault_snippets
  for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- Seed data — a handful of demo snippets across a couple of languages,
-- owned by the demo user (see note above). Run only after the demo user
-- exists.
-- ============================================================================

insert into code_snippet_vault_snippets (user_id, title, language, code, tags)
values
  (
    '00000000-0000-0000-0000-000000000001',
    'Debounce a function',
    'javascript',
    'function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}',
    array['utility', 'javascript', 'performance']
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Fetch with timeout',
    'javascript',
    'async function fetchWithTimeout(url, ms = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}',
    array['fetch', 'javascript', 'networking']
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Read a file line by line',
    'python',
    'with open("data.txt") as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        print(line)',
    array['python', 'files']
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'List comprehension with filter',
    'python',
    'evens_squared = [n * n for n in range(20) if n % 2 == 0]',
    array['python', 'snippet']
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Center a div',
    'css',
    '.center {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}',
    array['css', 'layout']
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Postgres upsert on conflict',
    'sql',
    'insert into settings (user_id, key, value)
values ($1, $2, $3)
on conflict (user_id, key)
do update set value = excluded.value;',
    array['sql', 'postgres', 'upsert']
  );
