# Music Theory Trainer

## What the MVP does

Two practice modes, both with a running score (session + best streak,
persisted in `localStorage`) and three difficulty levels:

- **Ear training** — real tones generated with the Web Audio API
  (oscillators at equal-temperament frequencies, A4 = 440Hz). Plays either
  an interval (two notes in sequence) or a chord (3-4 notes simultaneously)
  and asks the user to identify it from multiple choice.
- **Note reading** — renders a treble-clef staff as SVG (5 lines, correct
  ledger lines above/below when the note is outside the staff, sharp symbol
  when applicable, stem direction based on note height) showing a randomly
  generated note; the user names it from multiple choice.

Difficulty levels: **Level 1** naturals only, simple intervals (2nd-5th,
octave), Major/Minor triads. **Level 2** adds sharps and the full interval
range plus Diminished/Augmented triads. **Level 3** adds 7th chords
(Major 7th, Minor 7th, Dominant 7th) and a wider note range.

## Scope calls / out of scope for this pass

- **Accidentals are sharps only — no flats.** A note like "Db" is always
  spelled as "C#" instead. This avoids enharmonic-spelling ambiguity in
  multiple choice (the same pitch showing up as two different "correct"
  answers depending on spelling), at the cost of not teaching flat-key
  spelling. Reasonable simplification for an ear/sight-reading drill.
- **Web Audio feature-detected**: if `AudioContext` isn't available, ear
  training playback is disabled with a message, but note reading (no audio
  needed) still works fully.
- The treble clef glyph is rendered using the Unicode musical symbol
  (U+1D11E) rather than a hand-drawn SVG path — a reasonable simplification;
  rendering depends on the system having a font with that glyph, but the
  staff lines/ledger lines/notehead (the actual pedagogical content) are
  drawn with plain SVG primitives and don't depend on font support.
  Numeric HTML character references are used for both the clef and the
  sharp symbol so no external font/icon dependency is needed.
- No bass clef, no rhythm/note-duration reading, no MIDI input support.

## Implementation notes

All pitch math, staff-position math (diatonic index relative to the bottom
line E4), ledger-line placement, question generation (with an injectable
RNG for determinism), and scoring live as pure functions at the top of
`app.js` with no DOM dependency, exported via a guarded `module.exports`.
Verified via a throwaway Node script: `noteToFrequency`/`frequencyToNote`
round-trip for several notes (A4 = 440Hz exactly, C4 ≈ 261.63Hz), staff
positions checked against known reference notes (E4=0 bottom line ...
F5=8 top line, C4=-2 with one ledger line, middle-C being a classic
textbook case), ledger-line counts checked against hand-verified expected
values (e.g. A3 needs two ledger lines below the staff, G5 needs none
above it), and question generation checked for 100 trials across all 3
levels to confirm the correct answer is always among the (unique) choices.
Only Web Audio playback and SVG-to-DOM insertion touch the browser.
