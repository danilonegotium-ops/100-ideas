# Speed Reading Trainer — SPEC

## What it does
Paste any text (or use the built-in sample), set a target words-per-minute, and hit
Play. The tool runs an RSVP (rapid serial visual presentation) reader: one word at a
time is flashed in a fixed spot on screen, centered on its "optimal recognition
point" (a stable pivot letter so your eye doesn't have to hunt for center as word
length changes), at the interval implied by the target WPM. Longer words and
sentence-ending punctuation get a small extra pause so the pace still feels readable
instead of mechanically constant. Play/Pause, Restart, a progress bar, a live
word counter, and a rough time-remaining estimate are all included. Typing new text
auto-restarts the run from word one.

## Out of scope for this pass
- No eye-tracking, comprehension quizzes, or per-user speed history/accounts.
- No "moving cursor" line-tracing mode from the original one-line pitch — RSVP
  (word-flash) is the more effective and simpler technique to implement well, and is
  what most modern speed-reading tools (Spritz, Spreeder) actually use, so that's
  what shipped.
- No saved/multiple texts — single textarea, single active run.

## Data / content
No curated dataset. `data.js` holds one short, originally-written sample paragraph
(not copyrighted material) so the tool works immediately with zero user input.

## Implementation notes
Pure timing/layout logic (`tokenize`, `computeDelayMs`, `pivotIndex`, `splitAtPivot`,
`computeProgressPct`, `estimateRemaining`) lives at the top of `app.js` and is
exported via a `module.exports` guard that only activates under Node (`typeof
module !== "undefined"`), which is always false in the browser since there's no
bundler/CommonJS on the page — so this is inert in production and only exists to let
the real shipped logic be unit-tested directly instead of duplicated into a scratch
test file.
