# Flashcard Exchange

## What the MVP does

A place to create, browse, and study public flashcard decks by subject/exam
tag.

- **Browse & search** (`/decks`) — public, no login required. Lists all
  decks, searchable by title/subject/exam tag, with quick-filter chips
  generated from the subjects currently in the database.
- **Deck detail + study** (`/decks/[id]`) — public. Shows the deck's info
  and a flip-card study mode: click a card to flip it, then mark "got it"
  (removes it from the session queue) or "study again" (sends it to the
  back of the queue so it comes back around). This is pure client-side
  React state, reset on page reload — no per-session progress is persisted
  to the database in this pass.
- **Create a deck** (`/decks/new`) — requires the template's magic-link
  login (so you can find/edit it later). Enter a title, subject, optional
  exam tag/description, and add as many front/back cards as you want.
  Inserts one `flashcard_exchange_decks` row and N
  `flashcard_exchange_cards` rows, owned by the logged-in user.

## Scope adaptations from the original one-liner

The original description says students can "sell" flashcards. Per the
sprint's scope note, this pass ships **no marketplace or payment flow at
all** — just free browse/create/share. Decks are public to everyone by
default (no private/paid decks) since there's no purchase gate to make
private-until-purchased meaningful yet.

Editing/deleting an existing deck (beyond creating one) is not built in
this pass — RLS is already scoped so only the owner *could* update/delete
their own deck (see `schema.sql`), but there's no UI for it yet. Cheapest
follow-up: an "edit" button on `/decks/[id]` that only renders when
`owner_id === current user's id`.

## Schema summary

See `schema.sql` for the full DDL, RLS policies, and seed data. Two tables:

- `flashcard_exchange_decks` — `owner_id` is a **nullable** FK into
  `auth.users` on purpose: seed/demo decks use `owner_id = NULL` plus an
  `owner_label` text column ("Demo deck") for display, since hand-writing
  rows into Supabase's internal `auth.users` table isn't something to do
  without a live project to verify the exact required columns against.
  Real decks created through the app always have `owner_id = auth.uid()`
  (enforced by the INSERT policy).
- `flashcard_exchange_cards` — belongs to a deck (`deck_id`, cascade
  delete), ordered by `position`.

RLS: anyone (including anonymous) can `select` both tables. `insert` /
`update` / `delete` on decks requires `owner_id = auth.uid()`; the same on
cards requires the card's parent deck to be owned by the caller (checked
via an `exists (...)` subquery against the deck row).

Seed data: 4 demo decks (Organic Chemistry functional groups, Spanish
present-tense conjugations, US Civil War causes, Data Structures Big-O)
with 4–6 cards each, spanning different subjects so the browse/search/tag
filters have something real to show.

## What needs a live Supabase project to actually verify

- The whole app currently can't run past `npm run build` without real
  `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — every data
  page (`/decks`, `/decks/[id]`) is a Server Component that calls
  `createClient()` from `lib/supabase/server.ts`, which throws on missing
  env vars at request time (it's fine at build time — see the template's
  build-safety pattern, these routes are excluded from static generation
  because they call `cookies()`).
- `schema.sql` has not been run against any database — the RLS policies
  and seed inserts are reasoned through but unverified. Double-check once
  live: that the `flashcard_exchange_cards` insert/update/delete policies'
  `exists (...)` subqueries perform acceptably (they're fine at demo
  scale), and that the magic-link login → `/decks/new` → deck creation
  flow works end-to-end with a real account.
- The search box uses `.ilike(...)` with `%`/`_` manually escaped in the
  query string — worth a quick real-world test with a search term
  containing `%` or `_` once live.
