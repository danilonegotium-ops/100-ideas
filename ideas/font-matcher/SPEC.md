# Font Matcher — SPEC

## Scope note
The original one-line pitch is "upload a picture of a font you saw and the tool
finds the closest free Google Font." Real image-based font recognition needs a
trained ML model (or a paid API like WhatTheFont/Adobe), which is out of scope for
this sprint. Instead this ships as a **guided questionnaire matcher**: the user
answers a few visual-characteristic questions about the font they remember (serif
vs sans-serif, weight, rounded vs sharp terminals, condensed/normal/wide, and any
distinctive feature), and those answers are scored against 25 curated, tagged
Google Fonts. The UI is upfront about this — the card at the top explicitly says
it's a questionnaire, not image recognition, so it's not misleading users.

## What it does
5 questions, each mapped to one tag dimension. On submit, every font in `data.js`
is scored: `category` match is weighted 3x (most visually distinctive trait),
`terminals`/`width`/`feature` matches weighted 2x, `weight` matched 1x. The top 4
highest-scoring fonts are shown, each rendered live in its real typeface (via a
single Google Fonts CSS2 `<link>` covering all 25 families, injected on page load
so results appear instantly), with a one-line "why it matched" summary and a link
to that font's real Google Fonts specimen page.

## Out of scope for this pass
- No actual image upload/OCR/ML matching — see scope note above.
- No font pairing suggestions, no download/embed code generation.

## Data / content
`data.js` holds `FONTS` (25 real, genuinely free Google Fonts — verified to exist on
fonts.google.com — tagged by category/weight/terminals/width/feature based on their
actual known design characteristics) and `QUESTIONS` (5 questions, one per
dimension).

## Implementation notes
Scoring logic (`scoreFont`, `rankFonts`, `generateMatchReason`, `fontSpecimenUrl`,
`buildGoogleFontsHref`, `allAnswered`) is pure and exported via a `module.exports`
guard (inert in the browser — no bundler/CommonJS on the page) so it's unit-tested
directly from Node. `buildGoogleFontsHref` / `fontSpecimenUrl` build correct Google
Fonts CDN and specimen URLs from each family name (spaces become `+`).
