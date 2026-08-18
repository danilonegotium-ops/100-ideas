# Skill Swap Platform

## What the MVP does

"Tinder for skills" — I teach you X, you teach me Y.

- **Browse members** (`/profiles`) — public. Lists all profiles, filterable
  by a skill someone wants to learn (case-insensitive substring match
  against each profile's `skills_teach`, plus quick-filter chips for every
  skill currently listed).
- **Create/edit your profile** (`/profiles/new`) — requires magic-link
  login. Display name, optional bio, and comma-separated lists of skills
  you teach / want to learn. Upserts by `user_id` so revisiting the page
  edits your existing profile instead of creating a duplicate.
- **Profile detail + propose a swap** (`/profiles/[id]`) — public to view.
  If you're logged in, have your own profile, and are viewing someone
  else's, a "Propose a swap" form lets you pick one of your taught skills
  to offer and one of theirs to request, plus an optional note.
- **My swaps** (`/swaps`) — requires login. Lists every swap where you're
  either the requester or the target, shows status, and lets the target
  accept/decline or the requester cancel a pending proposal.

No in-app messaging — once a swap is accepted, contact happens outside the
app, per the sprint's scope note for this idea.

## Scope adaptations

- No messaging/chat — "propose a swap" just creates a `pending` row that
  either party can act on; coordinating logistics happens off-platform.
- A user can have at most one profile (`profiles.user_id` is `unique`);
  editing an existing profile reuses the same row rather than versioning.
- Self-swaps are prevented at the UI level (the propose form only renders
  on someone *else's* profile) rather than a DB constraint — Postgres
  `check` constraints can't reference other rows, and a trigger felt like
  overkill for MVP scope.

## Schema summary

See `schema.sql`. Two tables:

- `skill_swap_platform_profiles` — `user_id` is a **nullable, unique** FK
  into `auth.users`. The 8 seed profiles use `user_id = NULL` (no
  hand-written `auth.users` rows — see the note at the top of
  `schema.sql` for why) so they're browsable/proposable-to but can't be
  edited through the app. `skills_teach`/`skills_learn` are Postgres text
  arrays with GIN indexes (the app itself does JS-side filtering for
  case-insensitivity rather than relying on array-containment operators,
  but the indexes are there if that changes later).
- `skill_swap_platform_swaps` — `requester_user_id` (always a real,
  logged-in user — no seed data here per the task's scope) and
  `target_profile_id` (can point at a seed profile). `status` is
  `pending` → `accepted`/`declined`/`cancelled`.

RLS: profiles are publicly readable, writable only by their own
`user_id`. Swaps are only visible/updatable by the requester or the
target profile's owner — proposals are private between the two parties,
not a public feed.

## What needs a live Supabase project to actually verify

- Every data page (`/profiles`, `/profiles/[id]`, `/profiles/new`,
  `/swaps`) is a Server Component using `lib/supabase/server.ts`, so it's
  excluded from static generation at build time (safe with empty env
  vars) but genuinely untested against a real database.
- The "my swaps" other-party lookup deliberately avoids Supabase's
  foreign-table embed/alias select syntax (not confident enough in the
  exact disambiguation syntax to use it without a live project to check
  against) in favor of two plain follow-up queries + a manual JS join —
  worth confirming this performs fine once there's real data, and
  revisiting with an embed if it turns out cleaner.
- `schema.sql`'s RLS policies (especially the `exists (...)`/subquery
  checks tying swaps to "my profile") are reasoned through but unverified
  against a real Postgres instance — run `schema.sql`, then walk through:
  create profile A, create profile B (as a second real account), propose
  a swap from A→B, confirm B can see and accept/decline it and A cannot
  see it before that.
