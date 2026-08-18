# AI Gift Idea Generator

## What it does

Single-page tool: user enters a friend's interests (free text) and a budget
(free text, e.g. "$50" or "under $30"), submits the form, and the server
calls Google's Gemini API to generate 5 unique gift ideas, each with a
short one-sentence reason. No accounts, no database — fully stateless,
single-shot.

## Stack

Copied from `_shared/nextjs-template`, with the Supabase-specific pieces
removed since this idea needs no accounts/DB: deleted `app/login`,
`app/auth`, `middleware.ts`, `lib/supabase/`, and the `@supabase/ssr` /
`@supabase/supabase-js` dependencies from `package.json`. Kept
`components/Nav.tsx`, `Button.tsx`, `Card.tsx`, the Tailwind design tokens,
and `app/globals.css` for visual consistency with the rest of the sprint.

## AI integration approach

- `lib/gemini.ts` — server-only wrapper that calls the Generative Language
  API via raw `fetch()` (not an npm SDK), per the sprint's Wave 4 convention
  (mirrors how another Wave 3 agent handled Stripe: raw REST is more robust
  to SDK version drift than a package whose exact current signature can't
  be verified without live credentials).
  - Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GOOGLE_AI_API_KEY}`
  - Model read from `GOOGLE_AI_MODEL` env var, default `"gemini-2.0-flash"`.
    **This default is unverified** — no live API key exists in this sprint
    to confirm it's still the current model name. Update it once a real key
    is configured, if needed.
  - `isConfigured()` checks `GOOGLE_AI_API_KEY` is set (server-side only).
  - `extractText()` pulls `candidates[0].content.parts[].text` out of the
    response JSON — this is Google's documented response shape as of this
    agent's training data, but **has not been exercised against a live
    response**. Re-verify once a key exists.
- `lib/prompt.ts` — pure functions, no `fetch`, so they're testable without
  a live key: `buildPrompt(interests, budget)` builds the prompt text
  (instructs the model to respond with ONLY a JSON array of
  `{name, reason}` objects, no markdown), and `parseGiftIdeas(rawText)`
  parses+validates that JSON (stripping a markdown code fence if the model
  adds one anyway, which happens in practice with LLMs even when told not
  to). Returns `null` on any parse/shape failure rather than throwing.
- `app/api/generate/route.ts` — Route Handler (server-side only, never
  executed at build time). Validates input presence/length
  (`MAX_INTERESTS_LENGTH = 500`, `MAX_BUDGET_LENGTH = 100` — a few hundred
  chars is plenty for this field and bounds cost once live), returns 503
  with a friendly message if `GOOGLE_AI_API_KEY` is missing, 502 if the
  Gemini call fails, and on success returns either the parsed `ideas` array
  or, if parsing failed, the model's `raw` text so the feature degrades
  gracefully instead of erroring out.
- `components/GiftForm.tsx` — Client Component. Calls `/api/generate`,
  shows a loading state, renders parsed ideas as cards, falls back to
  showing raw text if parsing failed, and surfaces any error (including the
  "AI isn't configured" message) inline.
- `app/page.tsx` — Server Component. Calls `isConfigured()` (just reads an
  env var, no `fetch`, so it's safe to call at build time) and shows a
  persistent banner if no key is set, so the rest of the page — including
  the form itself — stays fully browsable/demoable without a live key.

## Sanity-checked without a live key

Per the sprint's verification standard, `lib/prompt.ts`'s pure functions
were compiled standalone and run against hand-built mock data:
- A realistic mock Gemini `generateContent` JSON response (matching the
  `candidates[0].content.parts[0].text` shape) round-tripped correctly
  through `extractText()`.
- `parseGiftIdeas()` correctly parses a clean JSON array, a JSON array
  wrapped in a ```` ```json ... ``` ```` code fence (models do this despite
  instructions not to), and returns `null` (not a throw) for a
  non-JSON/prose response, which triggers the raw-text fallback path.
This is a best-effort mock, not verified against Google's actual live API
response — that remains untestable until `GOOGLE_AI_API_KEY` exists.

## Verified

- `npm install && npm run build && npx tsc --noEmit && npm run lint` all
  pass clean with no `.env.local` (empty/placeholder env vars).
- `/` prerenders as a static route (confirms `isConfigured()` doesn't force
  the page dynamic or throw at build time).
- Ran `npm run build && npm run start` and hit `/api/generate` with `curl`
  with no `GOOGLE_AI_API_KEY` set: returns
  `{"error":"AI isn't configured yet..."}` with HTTP 503, and `/` still
  returns 200 — confirms the app is fully browsable/demoable without a key.

## Out of scope / untestable until a live key exists

- Whether `gemini-2.0-flash` is still a valid/current model name.
- Whether the model reliably returns exactly 5 ideas (prompt asks for
  exactly 5; not enforced server-side beyond truncating to 5 if more are
  returned — fewer than 5 are shown as-is rather than erroring).
- Real end-to-end output quality/tone of the suggestions.
