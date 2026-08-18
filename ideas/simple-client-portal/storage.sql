-- Simple Client Portal — storage.sql
--
-- Supabase Storage setup: a bucket isn't a plain table, so it can't go in
-- schema.sql, but object-level access is still governed by RLS policies on
-- `storage.objects`, which ARE plain SQL and belong here. Run this AFTER
-- schema.sql (it references the `scp_is_freelancer`/`scp_is_project_member`
-- functions defined there).
--
-- Object path convention: every file is stored at
--   <project_id>/<random-suffix>-<original-file-name>
-- e.g. "3fa2.../a91c-contract.pdf". The leading path segment (before the
-- first "/") is always the project's UUID — `storage.foldername(name)`
-- (a built-in Supabase Storage helper that splits an object path on "/"
-- and returns everything except the final filename as a text[]) is how the
-- policies below recover that project_id to check membership.
--
-- lib/actions.ts's `uploadFile` is responsible for actually constructing
-- paths this way when calling `supabase.storage.from(...).upload(...)` —
-- these policies only enforce that whatever path is used still resolves to
-- a project the caller is actually a member of.

-- Private bucket — not publicly readable by URL. Every read goes through
-- `supabase.storage.from(...).createSignedUrl(...)`, which itself is
-- subject to the SELECT policy below.
insert into storage.buckets (id, name, public)
values ('simple_client_portal_files', 'simple_client_portal_files', false)
on conflict (id) do nothing;

create policy "scp files: project members can read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'simple_client_portal_files'
  and scp_is_project_member(((storage.foldername(name))[1])::uuid)
);

create policy "scp files: freelancer can upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'simple_client_portal_files'
  and scp_is_freelancer(((storage.foldername(name))[1])::uuid)
);

create policy "scp files: freelancer can delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'simple_client_portal_files'
  and scp_is_freelancer(((storage.foldername(name))[1])::uuid)
);
