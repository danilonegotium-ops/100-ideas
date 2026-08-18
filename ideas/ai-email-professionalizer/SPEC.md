# AI Email Professionalizer

## What it does

Single-page tool: user pastes an angry, emotional, or overly casual email
draft, and the server calls Gemini to rewrite it as a polite, professional
version that preserves the core message/intent (not a generic corporate
template — the model is instructed to keep legitimate requests/facts, just
soften tone and improve clarity). No accounts, no database — fully
stateless, single-shot.

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
- `lib/prompt.ts` — pure functions: `buildPrompt(draft)` builds a prompt
  instructing the model to soften tone/fix unprofessional language while
  explicitly preserving legitimate requests/concerns/facts (not just
  producing generic corporate-speak that loses the point), and to return
  ONLY a JSON object `{rewritten, notes}` where `notes` is a one-sentence
  summary of what tone changes were made. `parseRewrite(rawText)` parses+
  validates that JSON (stripping a markdown code fence if present); `notes`
  is optional and degrades to `""` if missing/invalid, since `rewritten`
  is the only strictly required field.
- `app/api/rewrite/route.ts` — Route Handler. Validates the draft is
  present and under `MAX_EMAIL_LENGTH = 4000` characters. Returns 503 with
  a friendly message if no API key, 502 if the Gemini call fails, and on
  success either the parsed `rewrite` object or the model's `raw` text if
  parsing failed.
- `components/EmailForm.tsx` — Client Component: textarea with a character
  counter, loading state, a result card showing the rewritten email plus
  the one-line tone-change note, a "Copy" button
  (`navigator.clipboard.writeText`, called inside the click handler — safe
  per the client-side-only-in-event-handlers convention), raw-text
  fallback, and inline error display (including the "AI isn't configured"
  message).
- `app/page.tsx` — Server Component. Calls `isConfigured()` (env var read
  only, safe at build time) to show a persistent "AI isn't configured"
  banner when no key is set, so the page stays fully browsable/demoable
  without a live key.

## Sanity-checked without a live key

`lib/prompt.ts`'s pure functions were compiled standalone and exercised
against hand-built mock data: a realistic mock `{rewritten, notes}` JSON
object parsed correctly both raw and wrapped in a ```` ```json ``` ````
fence; a prose (non-JSON) response correctly returned `null`, triggering
the raw-text UI fallback; and a response missing the `notes` key entirely
still parsed successfully with `notes: ""`. Best-effort mock of Gemini's
documented response shape, not verified against a live call.

## Verified

- `npm install && npm run build && npx tsc --noEmit && npm run lint` all
  pass clean with no `.env.local`.
- `/` prerenders as a static route.
- `npm run build && npm run start`, then `curl POST /api/rewrite` with no
  `GOOGLE_AI_API_KEY` set: returns
  `{"error":"AI isn't configured yet..."}` at HTTP 503, and `/` still
  returns 200.

## Out of scope / untestable until a live key exists

- Whether `gemini-2.0-flash` is still a valid/current model name.
- Real rewrite quality — specifically whether the model reliably preserves
  the sender's actual requests/facts rather than just producing generic
  polished-sounding text that loses specifics, can only be judged once a
  live key exists.
- No tone-strength selector (e.g. "slightly more formal" vs. "very
  formal") in this pass — single fixed "polite and professional" target.
