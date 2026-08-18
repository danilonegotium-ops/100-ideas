# Public Speaking Simulator

## What the MVP does

Uses the browser's native Web Speech API (`SpeechRecognition`) to transcribe
the user speaking after they hit "Start speaking." When they hit "Stop," the
transcript is analyzed for:

- **Filler words** — a curated list of English fillers (um, uh, like, you
  know, i mean, sort of, kind of, basically, actually, so yeah) plus three
  Serbian fillers as a bonus (ovaj, znači, kao), matched case-insensitively
  with word-boundary regex so substrings inside unrelated words don't
  false-positive (e.g. "uh" inside "through").
- **Words per minute** — word count from the transcript divided by elapsed
  session time.
- A results summary: WPM with a plain-language pace label, total filler
  count with a per-phrase breakdown, session duration, and the full
  transcript.

A language selector (English / Srpski) sets the recognition locale.

## Scope calls / out of scope for this pass

- **Eye-contact analysis is explicitly out of scope.** The original idea
  description mentions eye contact; that would need real computer vision on
  a live webcam feed, which isn't feasible in this pass. The UI states this
  plainly so it isn't a silent gap.
- **Browser support**: `SpeechRecognition` is a non-standard API implemented
  well in Chrome-based browsers (Chrome, Edge, Brave) and poorly or not at
  all in Safari/Firefox. The tool feature-detects `window.SpeechRecognition
  || window.webkitSpeechRecognition` and shows a clear "not supported, try
  Chrome" message instead of failing silently.
- **Filler-word detection is a keyword/phrase counter, not true disfluency
  detection.** Words like "like," "actually," or "so yeah" can be
  legitimate in some sentences and will still be counted — this is a known
  heuristic limitation, not a bug.
- No audio/video is recorded or uploaded anywhere — everything runs
  client-side; the transcript never leaves the browser.

## Implementation notes

Pure functions (`countWords`, `calcWPM`, `countFillers`, `analyzeSpeech`,
`paceLabel`) live at the top of `app.js`, have no DOM dependency, and are
exported via a guarded `module.exports` for Node-based sanity checks. All
`SpeechRecognition` wiring is inside a `document`-guarded block.
