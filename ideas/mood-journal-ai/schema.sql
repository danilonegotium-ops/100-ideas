-- Mood Journal with AI — schema.sql
-- Run against the shared Supabase project. Table namespaced
-- `mood_journal_ai_*` per docs/PLAN.md's convention.
--
-- Model: a personal, single-user daily journal. Everything is owned by the
-- logged-in user (auth.uid()) — no sharing/public browsing needed. One
-- entry per calendar day per user (a "daily journal"), enforced by the
-- unique constraint below — resubmitting the same day upserts in place.

create extension if not exists pgcrypto;

create table if not exists mood_journal_ai_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null default current_date,
  content text not null,
  -- Filled in by the server-side AI call in app/api/analyze-mood/route.ts.
  -- Both nullable: an entry can be saved even when the AI call fails or
  -- GOOGLE_AI_API_KEY isn't configured yet — the journal itself still works,
  -- it just won't have a mood tag until the key exists.
  mood_label text,
  mood_score smallint check (mood_score between -2 and 2),
  created_at timestamptz not null default now(),
  unique (owner_id, entry_date)
);

create index if not exists mood_journal_ai_entries_owner_id_idx
  on mood_journal_ai_entries (owner_id);

create index if not exists mood_journal_ai_entries_entry_date_idx
  on mood_journal_ai_entries (entry_date);

-- Row Level Security -----------------------------------------------------

alter table mood_journal_ai_entries enable row level security;

create policy "owner full access" on mood_journal_ai_entries
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Seed data ---------------------------------------------------------------
-- `owner_id` is a real foreign key into `auth.users`. Once the shared
-- Supabase project is live: sign up once via this app's magic-link login
-- with a demo email, find that user's id under Authentication > Users in
-- the Supabase dashboard, and replace the placeholder UUID below with it
-- before running this block.
--
-- Mood labels/scores here are hand-assigned (illustrative, matching each
-- entry's content) rather than AI-generated, since no live GOOGLE_AI_API_KEY
-- exists yet to actually call the model — this lets the dashboard's
-- keyword-correlation insight panel have something real to compute against
-- immediately, without waiting on a live key. Content deliberately mentions
-- exercise/outdoors on the higher-mood days and work stress on the
-- lower-mood days so the correlation heuristic in lib/mood/insights.ts has
-- a genuine (not fabricated-looking) pattern to surface.

do $$
declare
  demo_owner_id uuid := '00000000-0000-0000-0000-000000000001';
begin
  insert into mood_journal_ai_entries
    (owner_id, entry_date, content, mood_label, mood_score, created_at) values
    (demo_owner_id, current_date - 9, 'Went for a long run this morning before work, felt great and clear-headed all day.', 'energized', 2, now() - interval '9 days'),
    (demo_owner_id, current_date - 8, 'Back-to-back meetings, a deadline got moved up, barely had time to eat lunch.', 'stressed', -1, now() - interval '8 days'),
    (demo_owner_id, current_date - 7, 'Quiet day at home, did laundry, watched TV in the evening.', 'neutral', 0, now() - interval '7 days'),
    (demo_owner_id, current_date - 6, 'Hiked with a friend outside the city, gorgeous weather, felt genuinely happy.', 'happy', 2, now() - interval '6 days'),
    (demo_owner_id, current_date - 5, 'Overslept, rushed through the morning, another stressful deadline at work.', 'anxious', -1, now() - interval '5 days'),
    (demo_owner_id, current_date - 4, 'Took a walk outside during lunch break, small thing but it helped.', 'calm', 1, now() - interval '4 days'),
    (demo_owner_id, current_date - 3, 'Stuck inside all day finishing a work project, low energy by evening.', 'tired', -1, now() - interval '3 days'),
    (demo_owner_id, current_date - 2, 'Went to the gym after a long time, then had dinner with family.', 'content', 2, now() - interval '2 days'),
    (demo_owner_id, current_date - 1, 'Ordinary work day, nothing notable, mood was fine.', 'neutral', 0, now() - interval '1 day'),
    (demo_owner_id, current_date, 'Cycled to the park this morning before starting work, feeling good.', 'happy', 1, now())
  on conflict (owner_id, entry_date) do nothing;
end $$;
