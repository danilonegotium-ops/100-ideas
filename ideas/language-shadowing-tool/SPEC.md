# Language Shadowing Tool

## What the MVP does

The browser speaks a curated short phrase (English or Serbian, user's
choice) using the native `speechSynthesis` API at an adjustable speed
(0.5x-1.5x). The user repeats it out loud, `SpeechRecognition` captures the
attempt, and a simple Levenshtein-distance-based similarity score (0-100%)
compares the spoken text to the original phrase, normalized for case,
punctuation, and whitespace. The phrase's translation is always shown
alongside so the learner knows what they're saying. 20 curated
beginner-friendly phrases are included, each with an English and a Serbian
(Latin script) version, covering greetings, questions, and everyday
requests.

## Scope adaptation

The original idea says "plays movie clips and makes you repeat the
dialogue." This ships with `speechSynthesis`-generated audio over curated
text instead — movie clips would be a copyright problem, and TTS has zero
licensing issues and works fully offline in-browser. The core intent
(repeat-after-audio pronunciation practice) is unchanged.

## Out of scope for this pass

- Pronunciation scoring is a rough text-similarity heuristic
  (Levenshtein distance on the recognized transcript), not real phonetic/
  accent analysis — recognition itself already does some "correction"
  toward dictionary words, so the score reflects word accuracy more than
  true pronunciation quality. Good enough for practice feedback, not a
  linguistics tool.
- Serbian is presented in Latin script only (no Cyrillic toggle).
- Only 2 languages / 20 phrases for this pass — easy to extend the
  `PHRASE_PAIRS` array in `data.js` later.
- Available TTS/recognition voices for `sr-RS` vary by browser/OS; if a
  Serbian voice isn't installed, playback may fall back to a default voice
  with an approximate accent. This is a browser/OS limitation, not
  something the app controls.

## Implementation notes

Pure functions (`normalizeText`, `levenshtein`, `similarityScore`,
`scoreFeedback`, `otherLang`) have no DOM dependency and are exported via a
guarded `module.exports` for Node sanity checks. `normalizeText` uses a
Unicode-aware regex (`\p{L}`) so Serbian diacritics (š, č, ć, ž, đ) are
treated as letters rather than stripped. `speechSynthesis` and
`SpeechRecognition` are feature-detected independently — if recognition is
unsupported, phrase playback still works but recording/scoring is disabled
with an explanatory message.
