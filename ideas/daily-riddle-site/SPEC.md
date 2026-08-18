# Daily Riddle Site — SPEC

## What it does
Every visitor sees the same riddle on the same calendar day: today's riddle index
is computed deterministically as `dayOfYear(today) % riddles.length`, so there's no
server, database, or per-visitor state involved — pure client-side math against the
current date. A "Reveal answer" toggle hides/shows the answer without a page
reload. An archive section lets you pick any past date and see exactly what riddle
that day showed, using the same deterministic function run against the picked date
instead of today.

## Out of scope for this pass
- No ad monetization wiring (the original pitch mentions ads) — that's a business/
  deployment concern (ad network account, ad-tech script), not core functionality,
  and isn't needed to prove the feature works end-to-end.
- No streak tracking, accounts, or "you solved it" state — kept intentionally
  anonymous and stateless per the "no tracking, no signup" footer already on every
  Wave 1 tool.
- Riddle repeats every ~61 days (the length of the curated list) rather than never
  repeating — acceptable per the task's own framing ("enough for 2 months so it
  doesn't repeat too fast").

## Data / content
`data.js` holds 61 riddle/answer pairs (`RIDDLES`), covering objects, nature, and
wordplay riddles, phrased in my own words — riddles of this type are traditional
folklore/public domain in concept, not sourced verbatim from a single copyrighted
collection.

## Implementation notes
The date-seeded selection uses **local** calendar dates throughout (`dayOfYear`,
`parseDateInputValue`, `formatDateInputValue`) rather than UTC, so "today" matches
the visitor's own day and the archive date picker doesn't shift by one day near
midnight in negative-UTC-offset timezones. Pure functions are exported via a
`module.exports` guard (inert in the browser — no bundler/CommonJS on the page) so
they're unit-tested directly from Node rather than duplicated into a scratch script.
