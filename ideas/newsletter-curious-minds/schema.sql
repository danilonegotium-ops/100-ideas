-- Newsletter for Curious Minds — schema.sql
--
-- Run against the shared Supabase project. Table namespaced
-- `newsletter_curious_minds_*` per the shared nextjs-template convention.
--
-- Only one table for this pass — signup capture. The archive of past
-- issues is static content shipped in the app itself
-- (`content/issues.ts`), not database-backed, since it's fixed editorial
-- content for this MVP rather than something readers or an admin UI
-- create/edit. See SPEC.md for why actual scheduled sending is out of
-- scope for this pass.

create table if not exists newsletter_curious_minds_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  subscribed_at timestamptz not null default now()
);

-- Case-insensitive uniqueness too (so "Alice@x.com" and "alice@x.com"
-- can't both subscribe) — the app also lowercases before insert, but this
-- is a second line of defense at the database level.
create unique index if not exists newsletter_curious_minds_subscribers_email_lower_idx
  on newsletter_curious_minds_subscribers (lower(email));

-- Row Level Security -----------------------------------------------------

alter table newsletter_curious_minds_subscribers enable row level security;

-- Anyone (including anonymous visitors) can sign up. Nobody can read the
-- subscriber list back through the API — that's only for whoever sends
-- the newsletter, via the Supabase dashboard / service role key, not this
-- app's public-facing anon key.
create policy newsletter_curious_minds_subscribers_insert_anon
  on newsletter_curious_minds_subscribers for insert
  to anon, authenticated
  with check (true);

grant insert on newsletter_curious_minds_subscribers to anon, authenticated;
-- Deliberately no `grant select` to anon/authenticated — no RLS select
-- policy exists either, so even if a grant were added later RLS would
-- still block reads. Reading the list requires the service_role key
-- (bypasses RLS), used only for the actual send job (see SPEC.md).

-- No seed data — a list of real-looking subscriber emails isn't something
-- to fabricate, and the task didn't ask for it. The archive issues (the
-- other piece of "seed content" this idea needs) live in
-- `content/issues.ts` as static app content instead.
