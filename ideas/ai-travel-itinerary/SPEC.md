# AI Travel Itinerary — SPEC

**MVP:** User enters a city and a trip length (1-14 days, clamped server-side). A Route Handler
(`app/api/itinerary/route.ts`) builds a prompt instructing Gemini to act as a local travel guide
and return a day-by-day plan — morning/afternoon/evening activities plus one distinct "hidden
gem" per day (explicitly instructed to avoid famous landmarks/generic top-10-list spots, and to
vary the hidden-gem category across days). Response is rendered as day cards with the hidden gem
visually called out in its own highlighted box.

**AI call:** raw REST `fetch` to `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
(no SDK dependency), model name from `GOOGLE_AI_MODEL` env var (default `gemini-2.0-flash` —
unverified against a live key, double-check against https://ai.google.dev/gemini-api/docs/models
once a real key exists). Requests `generationConfig.responseMimeType: "application/json"` for
structured output, with defensive fenced-code-block stripping in `lib/gemini.ts#parseJsonFromText`
in case a model doesn't fully honor the mime type. Key is read server-side only
(`process.env.GOOGLE_AI_API_KEY`), never sent to the client.

**Graceful "not configured" state:** if `GOOGLE_AI_API_KEY` is unset, the API route returns
`503 { error: "not_configured", message: "..." }` before attempting any network call; the UI
shows an explicit "AI isn't configured yet" message rather than a generic error.

**Input caps:** city name capped at 100 characters (`MAX_CITY_LENGTH`); days clamped to 1-14.

**Prompt-construction and response-parsing logic (`lib/itinerary.ts`) are pure functions**,
independent of the network call, and were sanity-checked against a realistic mocked Gemini
`generateContent` response shape (including a fenced-code-block variant and a safety-blocked/
malformed-JSON variant) before this was marked built — see commit history / dev notes; all
passed.

**Out of scope for this pass:** no accounts/DB (idea is fully stateless — every request is
independent, nothing is saved), no multi-city trips, no budget/pace preferences, no export/share
link, no map integration.

**What still needs a live `GOOGLE_AI_API_KEY` to verify:** the actual Gemini call has never run
against a real key — only the request-construction and response-parsing logic were tested (via
mocked API responses). Confirm the real API's JSON-mode output matches the assumed shape once a
key exists, and re-check the default model name is still current.
