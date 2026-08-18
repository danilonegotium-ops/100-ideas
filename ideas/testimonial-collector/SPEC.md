# Testimonial Collector — SPEC

## What the MVP does

A business user logs in via magic link and creates one or more "collections" (dashboard →
`/dashboard`), each with a public, no-login-required link at `/c/<slug>`. Anyone with that link
can submit a text testimonial and/or a short video (uploaded directly to Supabase Storage), an
optional star rating, their name, and an optional email. Submissions start as `pending`. The
business reviews and approves/rejects/deletes submissions in their dashboard. Approved
testimonials are shown back on the public collection page itself ("What people are saying") and
are also servable to any third-party site via a public JSON embed endpoint:
`GET /api/embed/<slug>` → `{ business_name, testimonials: [...] }`, with
`Access-Control-Allow-Origin: *` so it can be `fetch()`-ed cross-origin from wherever the business
embeds it.

## Scope adaptations / design calls

- **Video upload is a real Supabase Storage integration**, not stubbed out. The submission form
  uploads directly from the browser to a public bucket (`testimonial-collector-videos`) using the
  Supabase JS client, gets back a public URL, and includes that URL in the same submission. See
  the "Storage" section of `schema.sql` for the bucket + RLS policy setup (bucket creation and
  `storage.objects` policies are included as SQL — this needs to run once against the live
  project).
- **Known limitation, called out explicitly in `schema.sql`:** the video upload policy allows
  anonymous inserts scoped only to the bucket id, since submission is intentionally
  unauthenticated. There's no file-size limit, MIME-type restriction, or abuse/rate-limiting in
  this pass — recommended to configure a size/type limit via Supabase Studio's bucket settings
  once live (the exact SQL columns for that vary by Storage version, so it wasn't hardcoded here
  rather than guessing at an unverified API).
- **RLS design nuance — two audiences share the same tables.** Both `collections` and
  `testimonials` have a public read policy (needed for the anonymous submission page and the
  embed endpoint) *alongside* an owner-only policy. This means a bare `select("*")` from the
  dashboard would NOT be safely scoped by RLS alone — it would also match other tenants'
  `approved` testimonials via the public policy. `app/dashboard/page.tsx` explicitly filters by
  `user_id` / the owner's own `collection_id`s in the query itself rather than relying on RLS to
  do that scoping, and this is called out in a code comment there. Worth double-checking against
  a real login once Supabase is live.
- **Approved testimonials are also shown on the public collection page itself** ("What people are
  saying"), not just via the embed endpoint — a natural, low-cost addition since the same
  public-read policy was already needed for the embed endpoint.

## Schema summary (`schema.sql`, seed data in `seed.sql`)

- `testimonial_collector_collections` — one row per public collection link, `user_id` = owner.
- `testimonial_collector_testimonials` — one row per submission, `collection_id` FK, `status`
  (`pending`/`approved`/`rejected`), requires either `content` or `video_url` (DB check
  constraint).
- Storage bucket `testimonial-collector-videos` (public) + `storage.objects` RLS policies for
  public upload / owner delete.
- RLS: collections and testimonials each have both an owner-scoped policy and a public-read
  policy for the anonymous flows (see the design-call note above for why app code needs to filter
  explicitly on top of that for the dashboard view).

## Demo data that works without any live-Supabase fixup

Unlike this sprint's other Wave 3 ideas, `seed.sql`'s **public-facing** data (the `demo-coaching`
collection and its 3 approved testimonials) will actually render correctly at `/c/demo-coaching`
and `/api/embed/demo-coaching` as soon as it's run against a live project — no need to swap in a
real user id first, because the public-read RLS policies don't check `user_id` at all. Only the
**dashboard** view (moderation queue, "your collections" list) needs the placeholder UUID
(`00000000-0000-0000-0000-000000000001`) swapped for a real `auth.users.id`, same as the other
ideas — see the comment block at the top of `seed.sql`.

## What still needs a live Supabase project to verify end-to-end

- **RLS policy correctness**, especially the two-audience (owner + public) policies on
  `collections` and `testimonials`, and the `storage.objects` policies — all written against
  documented Supabase RLS/Storage patterns but never executed against real Postgres/Storage.
- **The Storage bucket creation SQL** (`insert into storage.buckets ...`) — this is a less common
  pattern than table RLS and should be double-checked in the Supabase SQL editor; if it errors,
  creating the bucket via Supabase Studio's UI instead and just keeping the `storage.objects`
  policies from `schema.sql` is the fallback.
- **The actual video upload → public URL → playback path** — untestable without a live project;
  once live, submit a real test video and confirm it plays back from the returned `video_url`.
- **`npm run build` / `tsc` / `lint`** were run locally with no `.env.local` and pass — confirms
  the app doesn't need live credentials to build, not that the Supabase/Storage calls are correct
  against a real backend.
