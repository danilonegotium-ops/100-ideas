# AI Meeting Minutes — SPEC

## What the MVP does

A single stateless page (`app/page.tsx`, no accounts, no DB — this idea's
Supabase plumbing was removed from the shared template, see below):

1. **Start recording** — starts the browser's built-in Web Speech API
   (`SpeechRecognition`, feature-detected on mount). As you speak, finalized
   speech segments are appended into a `Transcript` textarea; interim
   (not-yet-finalized) text is shown separately below it in italics so it
   never clobbers text you've manually typed/edited.
2. **Stop recording** stops the recognizer.
3. The `Transcript` textarea is always editable, live-recording or not —
   you can fix transcription errors, or paste/type a transcript entirely by
   hand (useful if the browser doesn't support live transcription, or the
   meeting was already recorded elsewhere).
4. **Summarize into minutes** sends the transcript to
   `/api/summarize-minutes`, a server-side Route Handler that calls Gemini
   and asks for structured JSON: a short summary, a list of key decisions,
   and a list of action items (with an owner's name if the transcript makes
   one clear).

## Scope adaptation (per the brief)

The original idea says "listens to a recording" — implemented via the
browser's free, built-in `SpeechRecognition` Web Speech API instead of a
paid audio-transcription API (e.g. a hosted Whisper/Speech-to-Text
endpoint), which would cost money and isn't available on any $0 free tier
for sustained use. Transcription happens entirely client-side/on-device;
**only the final transcript text** (not audio) is sent to the server for
the summarization step.

**Browser support is feature-detected**, not assumed: `SpeechRecognition`
is genuinely non-standard and works best in Chrome-based browsers (Chrome,
Edge, Brave) — Safari/Firefox support is inconsistent or absent. When
unsupported, the recording controls are hidden and a clear message is
shown, but the page is **not a dead end**: the transcript textarea and the
AI summarization step still work with a manually pasted/typed transcript.
`lib/speech/types.d.ts` has minimal ambient TypeScript declarations for
`SpeechRecognition` (MDN-shape) since TypeScript's bundled `lib.dom.d.ts`
doesn't include this API.

## AI call

`app/api/summarize-minutes/route.ts` calls Gemini (`gemini-2.0-flash`
default, overridable via `GOOGLE_AI_MODEL`) via the same raw-REST
`lib/ai/gemini.ts` wrapper used across Wave 4/5, text-only, requesting
`responseMimeType: "application/json"` for `{ summary, decisions[],
action_items[] }`. Transcript capped at 20,000 characters both client- and
server-side.

**Not live-verified**: no real Google AI Studio key exists yet in this
sprint (see `MASTER_TRACKER.md`) — the request/response shape and default
model name are the same pattern used in mood-journal-ai and ai-logo-critic,
worth a real check once a key exists.

**Graceful degradation:**
- No `GOOGLE_AI_API_KEY` → route returns `{ configured: false }`, UI shows
  a clear "not configured yet" message; the recorded/typed transcript
  itself is never lost — it just stays in the textarea.
- Call fails / model returns unexpected shape → route returns a 502 with an
  `error` message shown inline.

## Scope adaptations (secondary)

- **Removed this idea's unused Supabase/auth plumbing** (`app/login`,
  `app/auth/callback`, `lib/supabase/*`, `middleware.ts`, and the
  `@supabase/*` deps from `package.json`) — stateless tool, no accounts
  needed. `.env.local.example` only lists `GOOGLE_AI_API_KEY`/`GOOGLE_AI_MODEL`.
- **No speaker diarization** ("who said what") — the Web Speech API doesn't
  expose speaker identity, only a single running transcript. Action-item
  ownership relies on names being spoken naturally in the meeting (e.g.
  "Maria will send the proposal"), which the AI prompt is instructed to
  pick up on, not a structural guarantee.
- **No save/history** — each session's transcript and minutes are one-off,
  nothing persisted server-side.
