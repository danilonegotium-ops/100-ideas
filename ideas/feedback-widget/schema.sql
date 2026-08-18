-- Feedback Widget — schema.sql
-- Run against the shared Supabase project. Table names namespaced
-- `feedback_widget_*` per docs/PLAN.md's convention.
--
-- Model: a logged-in user creates a widget (a question, e.g. "Was this
-- helpful?"). The embeddable `<script>` snippet (served from the public
-- `/widget.js` route, see app/widget.js/route.ts) runs on ANY external
-- site, fetches the widget's question anonymously, and posts yes/no
-- responses anonymously. Both of those need public (non-owner) access —
-- see the RLS policies below.

create extension if not exists pgcrypto;

create table if not exists feedback_widget_widgets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  question text not null default 'Was this helpful?',
  created_at timestamptz not null default now()
);

create index if not exists feedback_widget_widgets_owner_id_idx
  on feedback_widget_widgets (owner_id);

create table if not exists feedback_widget_responses (
  id uuid primary key default gen_random_uuid(),
  widget_id uuid not null references feedback_widget_widgets(id) on delete cascade,
  answer boolean not null, -- true = "yes/helpful", false = "no/not helpful"
  -- Self-reported by the embedding page's own `window.location.href` at
  -- response time. Not verified server-side (there's no way to verify a
  -- referrer for an anonymous cross-origin POST without more machinery
  -- than this MVP needs) — treat as best-effort telemetry, not a security
  -- boundary or a guaranteed-accurate audit trail.
  page_url text,
  created_at timestamptz not null default now()
);

create index if not exists feedback_widget_responses_widget_id_idx
  on feedback_widget_responses (widget_id);

create index if not exists feedback_widget_responses_created_at_idx
  on feedback_widget_responses (created_at);

-- Row Level Security -----------------------------------------------------

alter table feedback_widget_widgets enable row level security;
alter table feedback_widget_responses enable row level security;

-- Owner: full CRUD on their own widgets.
create policy "owner full access" on feedback_widget_widgets
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Public: anyone (including the anonymous embed script on a third-party
-- site) may read widget rows to fetch the question text. This does expose
-- `owner_id` at the row level — RLS is row-level, not column-level — but
-- application code (`app/api/w/[id]/route.ts`) only ever selects
-- `id, question`, so it's never actually returned to the browser. Owner
-- ids are random UUIDs with no other exploitable value on their own.
create policy "public can read widgets" on feedback_widget_widgets
  for select to anon, authenticated using (true);

-- Public: anyone may submit a response to any widget that exists (this is
-- the whole point of an embeddable "was this helpful" button — the
-- visitor has no account). The `exists` check just guards against
-- inserting responses for a made-up widget id.
create policy "public can submit responses" on feedback_widget_responses
  for insert to anon, authenticated
  with check (exists (select 1 from feedback_widget_widgets w where w.id = widget_id));

-- Only the widget's owner can read its responses (dashboard stats).
create policy "owner can read own widget responses" on feedback_widget_responses
  for select using (
    exists (
      select 1 from feedback_widget_widgets w
      where w.id = widget_id and w.owner_id = auth.uid()
    )
  );

-- Seed data ---------------------------------------------------------------
-- `owner_id` is a real foreign key into `auth.users`. Once the shared
-- Supabase project is live: sign up once via this app's magic-link login
-- with a demo email, find that user's id under Authentication > Users in
-- the Supabase dashboard, and replace the placeholder UUID below with it
-- before running this block.

do $$
declare
  demo_owner_id uuid := '00000000-0000-0000-0000-000000000001';
  widget1 uuid := gen_random_uuid();
begin
  insert into feedback_widget_widgets (id, owner_id, question, created_at) values
    (widget1, demo_owner_id, 'Was this helpful?', now() - interval '14 days');

  insert into feedback_widget_responses (widget_id, answer, page_url, created_at) values
    (widget1, true,  'https://example.com/docs/getting-started', now() - interval '13 days'),
    (widget1, true,  'https://example.com/docs/getting-started', now() - interval '13 days'),
    (widget1, false, 'https://example.com/docs/getting-started', now() - interval '12 days'),
    (widget1, true,  'https://example.com/blog/release-notes',   now() - interval '10 days'),
    (widget1, true,  'https://example.com/blog/release-notes',   now() - interval '9 days'),
    (widget1, true,  'https://example.com/docs/api-reference',   now() - interval '7 days'),
    (widget1, false, 'https://example.com/docs/api-reference',   now() - interval '6 days'),
    (widget1, true,  'https://example.com/docs/getting-started', now() - interval '4 days'),
    (widget1, true,  'https://example.com/docs/getting-started', now() - interval '2 days'),
    (widget1, false, 'https://example.com/pricing',               now() - interval '1 days'),
    (widget1, true,  'https://example.com/pricing',               now());
end $$;
