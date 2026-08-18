# Simple Client Portal — SPEC

## What the MVP does

A place for freelancers to share files and project updates with clients, built on `_shared/nextjs-template`:

- **Auth**: the template's existing magic-link `/login`, used by both freelancers and clients — there's no separate "client account" flow. A client gets access the moment they sign in with the same email address the freelancer invited.
- **Dashboard** (`/dashboard`, protected): "Your projects" (owned) and "Shared with you" (invited-as-client) sections, plus a create-project form.
- **Project page** (`/dashboard/[projectId]`, protected, member-only): the freelancer can invite a client by email, post text updates, and upload real files to Supabase Storage. A client sees the same page read-only (no invite/post/upload forms) — updates and a download link per file (a time-limited signed URL, generated server-side per request).
- **Real file uploads**: `lib/actions.ts`'s `uploadFile` takes a `<input type="file">` from a Server Action's `FormData`, uploads the raw bytes to a private Storage bucket at `<project_id>/<uuid>-<filename>`, and records the metadata row. Downloads go through `createSignedUrl`, which is itself gated by the same Storage RLS policy as everything else (see `storage.sql`).

## Scope adaptations / design calls

- **One-directional sharing, matching the brief literally** ("freelancers share files and project updates WITH clients"). Only the freelancer can post updates or upload files; the client is read-only. This is a deliberate MVP scope call, not a limitation of the schema — extending clients to also post/upload later just needs a couple of RLS policy changes (INSERT policies using `scp_is_project_member` instead of `scp_is_freelancer`), not a redesign.
- **No client signup flow, no separate roles table.** "Client" is just `project_clients.client_email` matched against the logged-in user's JWT email at query time (`auth.jwt() ->> 'email'`) — the exact same "email is the identity" pattern used by Vrtic Management Tool's parent access, reused here because it already proved out reasoning-wise in that idea.
- **SECURITY DEFINER helper functions** (`scp_is_freelancer`, `scp_is_invited_client`, `scp_is_project_member` in `schema.sql`) exist specifically to avoid a real RLS circular-dependency risk: `project_clients`' policy needs to check "is this the project's freelancer," which requires looking at `projects`, whose own policy needs to check `project_clients` right back. The SECURITY DEFINER functions bypass RLS internally when evaluating that check, breaking the cycle. Worth double-checking live (see below).
- **Storage bucket/policies are hand-written SQL, not created via the dashboard UI**, per the task brief's instruction to document exactly what needs to be created. `storage.sql` is a separate file from `schema.sql` since a bucket isn't a plain table — run `schema.sql` first (the Storage policies reference its helper functions), then `storage.sql`.

## Schema summary (`schema.sql`, storage setup in `storage.sql`, seed data in `seed.sql`)

Tables (prefix `simple_client_portal_`): `projects`, `project_clients` (email invite, unique per `project_id, client_email`), `project_updates`, `project_files` (Storage metadata only — the bytes live in Storage, not Postgres). Storage: one private bucket `simple_client_portal_files`, object path convention `<project_id>/<uuid>-<filename>`, with SELECT/INSERT/DELETE policies on `storage.objects` that parse the leading path segment via Supabase's built-in `storage.foldername(name)` helper and check it against `scp_is_project_member`/`scp_is_freelancer`.

Seed (`seed.sql`): one project "Redizajn sajta — Studio Kappa," one invited client (`klijent@example.com`), two updates, and one **placeholder** `project_files` row (DB metadata only — no real bytes exist in Storage for it, since a SQL script can't upload a file; documented at the top of `seed.sql`). Same "sign in once, then paste the real `auth.users` id in" requirement as the rest of this batch.

## What's genuinely untestable until Supabase is live

- **The SECURITY DEFINER circular-dependency fix is the highest-risk part of this schema** — reasoned through carefully but never executed against real Postgres. Worth a manual live test once Supabase exists: (1) a freshly invited client really can see the project after logging in with the matching email; (2) a user who is NOT invited and NOT the freelancer really gets nothing back from `getProjectById` (RLS-filtered to `null`, which the page treats as 404); (3) the helper functions don't accidentally create a permissions gap where `scp_is_freelancer` returns true for the wrong project (double-check the `p_project_id` parameter binding in each `EXISTS` subquery).
- **The Storage RLS policies in `storage.sql`** — `storage.foldername(name)` and the bucket/policy shape follow Supabase's documented Storage RLS pattern, but there's no live Storage to actually upload a file against and confirm the path-parsing + membership check work end-to-end. Recommended first live test: upload a file as the freelancer, confirm the invited client can generate a signed URL for it, confirm a non-member cannot.
- Real end-to-end file upload — `uploadFile`'s `File` -> `Uint8Array` -> `.storage.upload()` path is written correctly against the documented `@supabase/supabase-js` Storage API, but has never actually sent bytes to a real bucket.
- Magic-link auth round-trip — unmodified template behavior, needs a live project.
- `npm run build`, `npx tsc --noEmit`, `npm run lint` all pass locally with empty env vars (see handoff notes).
