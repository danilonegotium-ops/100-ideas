# AI Dream Interpreter

## What it does

Single-page tool: user describes a dream in free text, and the server calls
Gemini to generate a fun, playful, symbolic interpretation plus a short list
of key symbolic themes. No accounts, no database — fully stateless,
single-shot.

**Explicit entertainment framing:** the idea's spec requires a clear
disclaimer that this is entertainment only, not professional psychological
advice. This is enforced in two places, not just one:
1. A permanent, always-visible disclaimer `Card` at the top of `app/page.tsx`
   ("For entertainment purposes only... not professional psychological,
   medical, or mental health advice... talk to a real professional or
   someone you trust") — shown regardless of whether AI is configured, so
   it's visible even in demo mode.
2. The prompt itself (`lib/prompt.ts` → `buildPrompt`) instructs the model
   to keep a light, playful, horoscope-like tone, avoid diagnosing or
   labeling any disorder, and to respond gently (pointing toward a real
   professional/trusted person) if the dream content is genuinely dark,
   while still giving a short fun symbolic take.

## Stack

Copied from `_shared/nextjs-template`, with the Supabase-specific pieces
removed since this idea needs no accounts/DB: deleted `app/login`,
`app/auth`, `middleware.ts`, `lib/supabase/`, and the `@supabase/ssr` /
`@supabase/supabase-js` dependencies from `package.json`. Kept
`components/Nav.tsx`, `Button.tsx`, `Card.tsx`, the Tailwind design tokens,
and `app/globals.css` for visual consistency with the rest of the sprint.

## AI integration approach

- `lib/gemini.ts` — server-only wrapper calling the Generative Language API
  via raw `fetch()` (not an npm SDK), same pattern used across all 5 ideas
  in this batch (see `ai-gift-idea-generator/SPEC.md` for the full
  rationale). Endpoint:
  `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GOOGLE_AI_API_KEY}`.
  Model from `GOOGLE_AI_MODEL` env var, default `"gemini-2.0-flash"`
  (**unverified** — no live key exists to confirm this is still current).
  `isConfigured()` gates on `GOOGLE_AI_API_KEY` being set.
- `lib/prompt.ts` — pure functions: `buildPrompt(dream)` builds the prompt
  (including the entertainment-only/no-diagnosis framing above) and
  instructs the model to return ONLY a JSON object
  `{interpretation, themes}`. `parseInterpretation(rawText)` parses+
  validates that JSON (stripping a markdown code fence if present); if
  `themes` is missing/malformed it degrades to an empty array rather than
  failing the whole parse (the interpretation text is the important part),
  returning `null` only if `interpretation` itself is missing/empty.
- `app/api/interpret/route.ts` — Route Handler. Validates the dream text is
  present and under `MAX_DREAM_LENGTH = 4000` characters. Returns 503 with
  a friendly message if no API key, 502 if the Gemini call fails, and on
  success either the parsed `interpretation` object or the model's `raw`
  text if parsing failed.
- `components/DreamForm.tsx` — Client Component: textarea with a character
  counter, loading state, a result card (interpretation text + theme
  chips), raw-text fallback, and inline error display (including the "AI
  isn't configured" message).
- `app/page.tsx` — Server Component. Calls `isConfigured()` (env var read
  only, safe at build time) to show a persistent "AI isn't configured"
  banner when no key is set, separate from (and in addition to) the
  always-visible entertainment disclaimer — so the page stays fully
  browsable/demoable without a live key.

## Sanity-checked without a live key

`lib/prompt.ts`'s pure functions were compiled standalone and exercised
against hand-built mock data: a realistic mock `{interpretation, themes}`
JSON object parsed correctly both raw and wrapped in a
```` ```json ``` ```` fence; a prose (non-JSON) response correctly returned
`null`, triggering the raw-text UI fallback; and a response missing the
`themes` key entirely still parsed successfully with `themes: []`, since
only `interpretation` is required. Best-effort mock of Gemini's documented
response shape, not verified against a live call.

## Verified

- `npm install && npm run build && npx tsc --noEmit && npm run lint` all
  pass clean with no `.env.local`.
- `/` prerenders as a static route.
- `npm run build && npm run start`, then `curl POST /api/interpret` with no
  `GOOGLE_AI_API_KEY` set: returns
  `{"error":"AI isn't configured yet..."}` at HTTP 503, and `/` still
  returns 200.

## Out of scope / untestable until a live key exists

- Whether `gemini-2.0-flash` is still a valid/current model name.
- Real tone/quality of the interpretation output — whether the model
  reliably stays playful and avoids clinical-sounding language as
  instructed can only be confirmed once a live key exists.
- No ad integration in this pass (original idea description mentions
  "ad-supported" — monetization is out of scope for this sprint, same as
  every other idea; the tool itself is fully functional without ads).
