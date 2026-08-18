# Link-in-Bio for Artists — SPEC

## What the MVP does

An artist signs in (shared template's passwordless magic-link auth), picks
a username, and lands in `/studio` — a 3-tab editor for their profile
(display name, bio, avatar image URL, published/unpublished toggle),
their links (label + URL list), and a portfolio grid (image URL +
optional caption per item). The published result is public at
`/u/<username>` with no login required: avatar, bio, a stacked list of
link buttons, and a responsive image grid.

## Scope adaptations

- **Auth is real and required for editing**, unlike the two single-tenant
  internal tools in this batch (`subscription-tracker-teams`,
  `cafe-inventory-tracker`) — this idea's entire premise is "user signs up,
  builds a public profile," so it keeps the shared template's magic-link
  flow. `app/login/page.tsx` gained the same `?next=` forwarding as
  `qr-menu-2` so `/studio` sends a logged-out visitor to `/login` and back.
- **No image upload** — portfolio/avatar images are pasted URLs, not
  uploaded files. Supabase Storage would be the natural real
  implementation, but wiring up a storage bucket + upload UI within this
  batch's time budget wasn't worth it when "paste a URL" fully satisfies
  the stated MVP ("a portfolio image grid," placeholders are explicitly
  fine per the brief). The seed data and the in-studio helper text both
  point at Picsum Photos (`picsum.photos`) as a free, keyless placeholder
  source.
- One profile per Supabase user, enforced by a partial unique index on
  `owner_id` (`where owner_id is not null`, so the NULL-owner seed row
  doesn't collide with anything) rather than at the application level.

## Schema summary

Three tables, prefixed `link_in_bio_artists_`: `profiles` (has `owner_id
-> auth.users`, unique `username`), `links` (profile_id, label, url,
sort_order), `portfolio_items` (profile_id, image_url, caption,
sort_order). RLS: profiles are readable if `is_published` or you're the
owner (so an owner can preview an unpublished draft); links/portfolio rows
inherit their parent profile's read visibility; all writes are
owner-only, checked via an `exists (...)` subquery against the parent
profile — same pattern as `qr-menu-2`'s category/menu-item policies.

`seed.sql` creates one demo profile ("Sasha Rivera", username
`demo-artist`, `owner_id = NULL`, published) with 4 links and 5 portfolio
images (Picsum placeholders, deterministic seeds so they're stable across
reloads).

## What still needs a live Supabase project to verify

- All query/RLS behavior reasoned through against the schema, not run
  live — same caveat as the other 4 ideas in this batch.
- **The seeded demo profile isn't editable via `/studio` as seeded** —
  `owner_id` is `NULL`. To test the studio flow against the seed data
  once Supabase is live: sign up via `/login`, then run
  `update link_in_bio_artists_profiles set owner_id = '<your-auth-uid>' where username = 'demo-artist';`
  Or just sign up and create a fresh profile — that flow needs no manual
  SQL, same as `qr-menu-2`.
- The partial unique index (`... where owner_id is not null`) is standard
  Postgres and should behave as documented, but hasn't been exercised
  against a real second-signup-with-existing-profile attempt yet.
