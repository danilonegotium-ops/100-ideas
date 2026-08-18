-- Testimonial Collector — schema.sql
--
-- Run in the shared Supabase project's SQL editor. Tables namespaced
-- `testimonial_collector_*` per docs/PLAN.md's shared-project convention.
--
-- Data model: a business user (authenticated, owns rows via `user_id`)
-- creates one or more "collections" (a public link, e.g. /c/<slug>).
-- Anyone with the link can submit a testimonial WITHOUT logging in — this
-- table is the one exception in this idea's schema where anonymous
-- (unauthenticated / `anon` role) inserts are intentional, not a bug.
-- The business then reviews submissions in their dashboard and approves
-- the ones worth showing publicly.

create table if not exists testimonial_collector_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  slug text not null unique,
  business_name text not null,
  -- Shown to visitors on the public submission page, e.g. "Tell us about
  -- your experience with Acme Coaching".
  prompt_text text not null default 'We''d love to hear about your experience!',
  created_at timestamptz not null default now()
);

create index if not exists testimonial_collector_collections_user_id_idx
  on testimonial_collector_collections (user_id);

create table if not exists testimonial_collector_testimonials (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references testimonial_collector_collections (id) on delete cascade,
  author_name text not null,
  author_email text,
  content text,
  -- Public URL of a file in the `testimonial-collector-videos` Storage
  -- bucket (see the Storage section below). Null for text-only submissions.
  video_url text,
  rating smallint check (rating is null or (rating between 1 and 5)),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  -- A submission must be either a written testimonial or a video — not
  -- neither.
  constraint testimonial_collector_testimonials_has_content
    check (content is not null or video_url is not null)
);

create index if not exists testimonial_collector_testimonials_collection_id_idx
  on testimonial_collector_testimonials (collection_id);

create index if not exists testimonial_collector_testimonials_status_idx
  on testimonial_collector_testimonials (collection_id, status);

-- Row Level Security --------------------------------------------------

alter table testimonial_collector_collections enable row level security;
alter table testimonial_collector_testimonials enable row level security;

-- Collections: owner has full CRUD. Collections are ALSO publicly
-- readable (`select using (true)`) — this is required so an anonymous
-- visitor loading /c/<slug> can resolve the slug to a collection id and
-- so the public embed endpoint can do the same. Trade-off: this means the
-- `user_id` column is technically readable by anyone querying the table
-- directly with the anon key (not just via this app's own pages) — an
-- opaque UUID with no other PII attached, judged acceptable exposure for
-- an MVP whose whole point is a public collection page. Revisit with a
-- narrower view (e.g. exposing only slug/business_name/prompt_text) if
-- this becomes a real concern later.
create policy "collections_select_public" on testimonial_collector_collections
  for select using (true);

create policy "collections_insert_own" on testimonial_collector_collections
  for insert with check (auth.uid() = user_id);

create policy "collections_update_own" on testimonial_collector_collections
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "collections_delete_own" on testimonial_collector_collections
  for delete using (auth.uid() = user_id);

-- Testimonials: the owner (via a subquery over their own collections)
-- can see/moderate/delete every submission regardless of status. The
-- public can INSERT (anonymous submission) but only ever as 'pending' —
-- the with-check on status prevents a visitor from self-approving their
-- own testimonial. The public can also SELECT rows that are already
-- 'approved' (needed for the public embed endpoint and the collection
-- page's optional "wall of love" of already-approved testimonials).
create policy "testimonials_select_own" on testimonial_collector_testimonials
  for select using (
    collection_id in (select id from testimonial_collector_collections where user_id = auth.uid())
  );

create policy "testimonials_select_approved_public" on testimonial_collector_testimonials
  for select using (status = 'approved');

create policy "testimonials_insert_public" on testimonial_collector_testimonials
  for insert with check (status = 'pending');

create policy "testimonials_update_own" on testimonial_collector_testimonials
  for update
  using (collection_id in (select id from testimonial_collector_collections where user_id = auth.uid()))
  with check (collection_id in (select id from testimonial_collector_collections where user_id = auth.uid()));

create policy "testimonials_delete_own" on testimonial_collector_testimonials
  for delete using (
    collection_id in (select id from testimonial_collector_collections where user_id = auth.uid())
  );

-- Storage — video testimonials ----------------------------------------
--
-- Creates a PUBLIC bucket (public = true) so approved video URLs can be
-- played directly without generating signed URLs. Public here means
-- downloads bypass RLS entirely via Supabase's `/storage/v1/object/public/`
-- path — RLS below only governs the upload/list/delete operations done
-- through the authenticated Storage API.
insert into storage.buckets (id, name, public)
values ('testimonial-collector-videos', 'testimonial-collector-videos', true)
on conflict (id) do nothing;

-- Anyone (including anonymous visitors) can upload into this bucket —
-- intentional, since testimonial submission is unauthenticated by design.
-- KNOWN LIMITATION for this MVP pass: there's no rate limiting or
-- malware/content scanning on public uploads. Recommended hardening once
-- live (not blocking for this pass): set a file-size limit and allowed
-- MIME types (e.g. video/mp4, video/webm, video/quicktime) on the bucket
-- via Supabase Studio → Storage → this bucket's settings, since the exact
-- SQL column names for those constraints vary by Supabase Storage version
-- and weren't verified against a live project here.
create policy "testimonial_videos_public_upload" on storage.objects
  for insert
  with check (bucket_id = 'testimonial-collector-videos');

-- Owners can delete videos belonging to testimonials in their own
-- collections (e.g. after rejecting a submission). Storage object names
-- are stored as "<collection_id>/<random>-<filename>" by the app (see
-- components/SubmitTestimonialForm.tsx), so this policy checks the
-- collection_id prefix against the owner's own collections.
create policy "testimonial_videos_owner_delete" on storage.objects
  for delete
  using (
    bucket_id = 'testimonial-collector-videos'
    and (storage.foldername(name))[1] in (
      select id::text from testimonial_collector_collections where user_id = auth.uid()
    )
  );
