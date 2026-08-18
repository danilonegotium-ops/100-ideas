# Roommate Matcher — SPEC

## What the MVP does

A logged-in student creates one profile (`/profile`): display name, city
(Belgrade or Novi Sad), optional area/university, budget range,
sleep schedule, cleanliness, social style, smoker, pets-ok, and a bio.
`/browse` lists other profiles in a city (defaults to your own, filterable
by city and a budget range), each scored 0–100 against your own profile
by `lib/compatibility.ts` and sorted best-match-first. Clicking "I'm
interested" records that on the other profile; if they've also expressed
interest in you, the UI shows "Mutual match!" on both sides instead of
the button — the "visible when mutual" behavior the brief asked for.

## Compatibility scoring (`lib/compatibility.ts`)

Pure function, no I/O, weights sum to 100: budget range overlap (30 —
proportional to how much of the two ranges overlap relative to their
average width), sleep schedule (20 — exact match full, either person
"flexible" partial, opposite full mismatch zero), cleanliness (20) and
social style (15) (both scored by how far apart the two picks are on a
 3-point ordered scale: very_clean/average/messy and
quiet/mixed/social), smoker match (10, all-or-nothing — often a real
dealbreaker), pets-ok match (5, small bonus since it's a softer
preference). Verified by construction and a manual check that
`computeCompatibility(a, b) === computeCompatibility(b, a)` for every
pairing in the seed data, and that scores stay within `[0, 100]`.

## Schema summary (`schema.sql`)

- `roommate_matcher_profiles` — one row per user (`user_id uuid unique`,
  no FK to `auth.users` — see the note at the top of `schema.sql`, same
  reasoning as every idea in this batch, and here it's also what makes
  seeding 10 varied demo profiles possible without 10 real accounts
  existing first), `city` constrained by CHECK to `Belgrade`/`Novi Sad`
  per the brief's explicit scope. RLS: select requires being logged in
  (not public — these include budget/lifestyle details); insert/update/delete
  restricted to the profile's own owner.
- `roommate_matcher_interests` — `(from_user_id, to_user_id)` pairs,
  `unique` (idempotent "I'm interested" clicks) and a CHECK preventing
  self-interest. RLS select: visible to either party, which is exactly
  what makes mutual-match detection possible (the browse page queries
  both directions and checks if both rows exist).

Seed data: 10 profiles split across Belgrade and Novi Sad, spanning the
full lifestyle-tag space (all three sleep schedules, all three
cleanliness/social levels, smokers and non-smokers, pet-friendly and
not), plus one seeded mutual match (Mila ↔ Aleksa, both
early-bird/very-clean/quiet Belgrade students — also scores highly by the
compatibility function, so the demo data is internally consistent) and
one one-directional interest (Stefan → Teodora, not yet mutual).

## Scope adaptations / calls made

- Browsing requires login — profiles carry more personal detail (budget,
  lifestyle) than e.g. concert-buddy's public event board, so this felt
  like the right default privacy posture even though the brief didn't
  explicitly require it either way.
- No messaging beyond the mutual-match signal — once mutual, both parties
  can already see each other's display name/area/university/bio; actual
  contact happens the same way as the rest of this sprint's UGC ideas
  (outside the app), consistent with concert-buddy's "no messaging for
  MVP" precedent.
- City is a fixed two-value CHECK constraint (Belgrade/Novi Sad) rather
  than free text, matching the brief's specific scope rather than
  building a general-purpose city field.

## What's genuinely untestable until Supabase is live

- The actual magic-link auth round trip (template-level, applies to every
  Wave 3 idea).
- The `roommate_matcher_profiles_user_id_key` unique constraint actually
  preventing a second profile per user via the upsert's `onConflict:
  "user_id"` path (`app/api/profile/route.ts`) — reasoned through
  carefully against supabase-js's documented upsert/`onConflict` API
  shape, but never executed against a live Postgres instance.
- Whether the seeded "mutual match" pair displays correctly once real
  RLS is enforced — the select policy logic was reasoned through by hand
  (`from_user_id = auth.uid() or to_user_id = auth.uid()`), not run
  against real data.
