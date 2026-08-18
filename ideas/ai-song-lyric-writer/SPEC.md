# AI Song Lyric Writer — SPEC

**MVP:** User picks a genre (10 presets — Pop, Rock, Hip-Hop, Folk, Country, R&B, Electronic,
Acoustic, Balkan Ballad, Punk — or types a custom one) and a free-text mood/theme (e.g. "Balkan
ballad about a rainy day" maps to genre="Balkan Ballad", theme="a rainy day"). A Route Handler
(`app/api/lyrics/route.ts`) prompts Gemini to write original lyrics with a real verse/chorus
structure (section count/order adapted to genre — at minimum a verse and a repeated chorus),
explicitly instructed not to reference any real existing song/artist/copyrighted lyric. Rendered
as a titled lyric sheet, sections labeled (Verse 1, Chorus, etc), with a note reminding the user
to check for accidental similarity to real songs before publishing.

**AI call:** same raw-REST-`fetch` pattern as the other Wave 4 ideas in this batch (see
`ai-travel-itinerary/SPEC.md` for the shared reasoning) — `lib/gemini.ts` is duplicated
per-idea rather than shared via a relative import, since each idea deploys as an independent
Vercel project with its own root directory (per the template README's "keep the idea genuinely
standalone" rule). `temperature: 1.0` used here (vs. lower values in the more fact-bound ideas)
since creative variation is the point.

**Graceful "not configured" state:** same pattern as the rest of the batch — `503
{ error: "not_configured" }` before any network call if `GOOGLE_AI_API_KEY` is unset, surfaced
as an explicit message in the UI.

**Input caps:** genre capped at 60 characters, theme at 300 characters.

**Prompt-construction and response-parsing (`lib/lyrics.ts`) are pure functions**, sanity-checked
against a realistic mocked Gemini response (including a fenced-code-block variant, a safety-block
variant, and unparseable text) before this was marked built.

**Out of scope for this pass:** no melody/chord suggestions (lyrics only, as scoped), no
saving/history (stateless — no accounts/DB), no export to audio, no rhyme-scheme control beyond
what the prompt implies per genre.

**What still needs a live `GOOGLE_AI_API_KEY` to verify:** the actual Gemini call has never run
against a real key — only request-construction and response-parsing were tested via mocked
responses. Confirm the real API's JSON-mode output matches the assumed shape once a key exists.
