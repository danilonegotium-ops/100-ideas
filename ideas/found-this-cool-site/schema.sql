-- Found This Cool Site — schema.sql
-- Run against the shared Supabase project's SQL editor. Table names are
-- namespaced `found_this_cool_site_*` per docs/PLAN.md's shared-project
-- convention.
--
-- ============================================================================
-- Demo user note
-- ----------------------------------------------------------------------------
-- Two of the seeded sites below are attributed to a placeholder demo user,
-- UUID '00000000-0000-0000-0000-000000000001' (to demonstrate the
-- submitted_by relationship) — the rest have submitted_by = null,
-- representing curated/pre-existing pool entries with no submitter. Before
-- running the seed INSERTs, either:
--   (a) sign up as a real user via the app's magic-link flow (/login), then
--       run `update found_this_cool_site_sites set submitted_by = '<real-uuid>'
--       where submitted_by = '00000000-0000-0000-0000-000000000001';`, or
--   (b) create a user with that exact UUID via Supabase Dashboard ->
--       Authentication -> Users -> Add user, then run the seed INSERTs
--       as-is, or
--   (c) just delete those two `submitted_by` values / leave them null —
--       submitted_by is nullable specifically so this isn't blocking.
-- ============================================================================

create extension if not exists pgcrypto;

create table if not exists found_this_cool_site_sites (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  description text not null,
  category text not null,
  submitted_by uuid references auth.users(id) on delete set null,
  approved boolean not null default true,
  report_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists found_this_cool_site_sites_approved_idx
  on found_this_cool_site_sites (approved);

create table if not exists found_this_cool_site_reports (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references found_this_cool_site_sites(id) on delete cascade,
  reported_by uuid references auth.users(id) on delete set null,
  reason text,
  created_at timestamptz not null default now(),
  unique (site_id, reported_by)
);

-- Keeps sites.report_count in sync automatically so a future admin/review
-- UI can just sort by it — no application-side counter logic needed.
create or replace function found_this_cool_site_increment_report_count()
returns trigger
language plpgsql
as $$
begin
  update found_this_cool_site_sites
  set report_count = report_count + 1
  where id = new.site_id;
  return new;
end;
$$;

drop trigger if exists found_this_cool_site_reports_increment on found_this_cool_site_reports;
create trigger found_this_cool_site_reports_increment
  after insert on found_this_cool_site_reports
  for each row
  execute function found_this_cool_site_increment_report_count();

-- Row Level Security.
alter table found_this_cool_site_sites enable row level security;
alter table found_this_cool_site_reports enable row level security;

-- Sites: anyone (including anonymous visitors) can browse approved sites —
-- "surprise me" doesn't require login. Submitting a new site (auto-approved
-- per MVP scope, see SPEC.md) requires being logged in and attributed to
-- yourself. No update/delete policy for regular users — there's no
-- edit/self-moderation UI in this pass, only the reports table below, which
-- a future admin view would read.
create policy found_this_cool_site_sites_select_approved
  on found_this_cool_site_sites
  for select
  using (approved = true);

create policy found_this_cool_site_sites_insert_own
  on found_this_cool_site_sites
  for insert
  with check (auth.uid() = submitted_by);

-- Reports: logged-in users can flag a site; nobody (other than a future
-- service-role admin tool) can read reports back out — RLS defaults to
-- deny when no select policy exists, which is intentional: this data
-- exists for a moderation pass, not for the public app UI.
create policy found_this_cool_site_reports_insert_own
  on found_this_cool_site_reports
  for insert
  with check (auth.uid() = reported_by);

-- ============================================================================
-- Seed data — ~30 real, currently-live, safe-for-work websites across
-- varied categories (tools, art, science, weird, plus a couple of bonus
-- categories for variety: music, learning). Only sites the author is
-- confident are real and appropriate were included; no invented/placeholder
-- entries. Two are attributed to the demo user to show the submission
-- relationship (see note above), the rest are curated/no submitter.
-- ============================================================================

insert into found_this_cool_site_sites (title, url, description, category, submitted_by)
values
  ('Wolfram Alpha', 'https://www.wolframalpha.com', 'A computational answer engine — ask it math, science, or everyday questions and it computes an answer instead of just searching for one.', 'tools', null),
  ('Regex101', 'https://regex101.com', 'Build, test, and debug regular expressions with a live, plain-English explanation of what each part matches.', 'tools', null),
  ('Excalidraw', 'https://excalidraw.com', 'A free virtual whiteboard for sketching diagrams that looks hand-drawn, no account required.', 'tools', '00000000-0000-0000-0000-000000000001'),
  ('Carbon', 'https://carbon.now.sh', 'Turn a snippet of code into a beautiful, shareable image with syntax highlighting.', 'tools', null),
  ('Coolors', 'https://coolors.co', 'A fast color palette generator — hit spacebar to keep generating combinations.', 'tools', null),
  ('Internet Archive', 'https://archive.org', 'A digital library of millions of free books, movies, music, and old websites via the Wayback Machine.', 'tools', null),
  ('OpenStreetMap', 'https://www.openstreetmap.org', 'A free, editable map of the entire world, built and maintained by volunteers.', 'tools', null),
  ('JSFiddle', 'https://jsfiddle.net', 'An online code playground for testing and sharing HTML/CSS/JS snippets instantly.', 'tools', null),
  ('Project Gutenberg', 'https://www.gutenberg.org', 'Over 70,000 free ebooks, all in the public domain, no login or fees.', 'tools', null),
  ('Shadertoy', 'https://www.shadertoy.com', 'A community gallery of GLSL shader art you can view, tweak, and remix live in your browser.', 'art', '00000000-0000-0000-0000-000000000001'),
  ('Google Arts & Culture', 'https://artsandculture.google.com', 'Explore high-resolution art and cultural artifacts from museums and archives around the world.', 'art', null),
  ('This Is Colossal', 'https://www.thisiscolossal.com', 'An art and design magazine spotlighting unusual, wonderful creative work you would not otherwise stumble on.', 'art', null),
  ('Are.na', 'https://www.are.na', 'A platform for collecting and connecting images, links, and ideas into visual research boards.', 'art', null),
  ('xkcd', 'https://xkcd.com', 'A long-running webcomic about romance, sarcasm, math, and language, by Randall Munroe.', 'art', null),
  ('NASA Astronomy Picture of the Day', 'https://apod.nasa.gov/apod/astropix.html', 'A new space photo (or video) every day, with a short expert explanation, running since 1995.', 'science', null),
  ('Webb Space Telescope', 'https://webbtelescope.org', 'Full-resolution images and the latest discoveries from the James Webb Space Telescope.', 'science', null),
  ('Eyes on the Solar System', 'https://eyes.nasa.gov', 'An interactive 3D visualization of the solar system and NASA missions, built with real trajectory data.', 'science', null),
  ('Zooniverse', 'https://www.zooniverse.org', 'Real citizen-science projects — help classify galaxies, transcribe historical documents, or spot wildlife.', 'science', null),
  ('OEIS', 'https://oeis.org', 'The Online Encyclopedia of Integer Sequences — paste any number sequence and see what it is.', 'science', null),
  ('Ciechanowski''s Blog', 'https://ciechanow.ski', 'Deeply interactive, beautifully illustrated explainers on how everyday physics and mechanics actually work.', 'science', null),
  ('Neal.fun', 'https://neal.fun', 'A collection of quirky, addictive interactive experiments exploring big and weird ideas.', 'weird', null),
  ('The Useless Web', 'https://theuselessweb.com', 'Click the button, land on a delightfully useless website. Basically the original spirit of this app.', 'weird', null),
  ('Radio Garden', 'https://radio.garden', 'Spin a globe and listen to live radio stations from almost anywhere on Earth.', 'weird', null),
  ('Do Nothing for 2 Minutes', 'https://www.donothingfor2minutes.com', 'Exactly what it sounds like — sit still and do nothing for two minutes, or the timer resets.', 'weird', null),
  ('Wikipedia: Random Article', 'https://en.wikipedia.org/wiki/Special:Random', 'Jumps to a completely random Wikipedia article — a built-in feature turned into an endless rabbit hole.', 'weird', null),
  ('GeoGuessr', 'https://www.geoguessr.com', 'Drop into a random Street View location and guess where on Earth you are.', 'weird', null),
  ('Free Rice', 'https://freerice.com', 'Answer trivia questions; every correct answer donates rice through the UN World Food Programme.', 'weird', null),
  ('Incredibox', 'https://incredibox.com', 'Make music by dragging animated characters that each add a beat, melody, or vocal loop.', 'music', null),
  ('Wait But Why', 'https://waitbutwhy.com', 'Long, deeply-researched, illustrated essays that explain big ideas in a friendly, approachable way.', 'learning', null),
  ('The Pudding', 'https://pudding.cool', 'Visual essays that explain ideas debated in culture using interactive data graphics.', 'learning', null);
