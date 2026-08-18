# AI Recipe Creator

## What it does

Single-page tool: user types 3+ ingredients they have (comma or newline
separated), and the server calls Gemini to generate a full recipe: title,
a complete ingredient list (their ingredients plus reasonable added pantry
staples), and numbered steps. No accounts, no database — fully stateless,
single-shot.

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
- `lib/prompt.ts` — pure functions:
  - `parseIngredientsInput(raw)` splits the textarea input on commas
    and/or newlines, trims, and drops empty entries — this runs both
    client-side (live "N ingredients detected" counter) and server-side
    (the actual `MIN_INGREDIENTS = 3` validation), so the two can't drift.
  - `buildPrompt(ingredients)` builds a prompt instructing the model to
    return ONLY a JSON object `{title, ingredients, steps}`, explicitly
    allowed to add reasonable pantry staples but told to keep the user's
    ingredients central.
  - `parseRecipe(rawText)` parses+validates that JSON (stripping a
    markdown code fence if present, filtering out any non-string array
    entries), returning `null` on any shape mismatch so the caller falls
    back to raw text.
- `app/api/generate/route.ts` — Route Handler. Validates the raw input is
  present and under `MAX_INGREDIENTS_INPUT_LENGTH = 500` chars, then parses
  it and rejects with a 400 if fewer than `MIN_INGREDIENTS = 3` ingredients
  were detected. Returns 503 with a friendly message if no API key, 502 if
  the Gemini call fails, and on success either the parsed `recipe` object
  or the model's `raw` text if parsing failed.
- `components/RecipeForm.tsx` — Client Component with a single textarea,
  live ingredient-count feedback (reusing `parseIngredientsInput`), loading
  state, a formatted recipe card (title / ingredients list / numbered
  steps), raw-text fallback, and inline error display (including the "AI
  isn't configured" message).
- `app/page.tsx` — Server Component, calls `isConfigured()` (env var read
  only, safe at build time) to show a persistent "AI isn't configured"
  banner up front when no key is set, so the page stays fully
  browsable/demoable without a live key.

## Sanity-checked without a live key

`lib/prompt.ts`'s pure functions were compiled standalone and exercised
against hand-built cases: `parseIngredientsInput` correctly handles
comma-only, newline+comma mixed, and empty-entry inputs; a realistic mock
recipe JSON object parsed correctly both raw and wrapped in a
```` ```json ``` ```` fence; malformed inputs (missing `steps` field, or a
prose non-JSON response) both correctly returned `null` from
`parseRecipe`, which triggers the raw-text UI fallback. Best-effort mock of
Gemini's documented response shape, not verified against a live call.

## Verified

- `npm install && npm run build && npx tsc --noEmit && npm run lint` all
  pass clean with no `.env.local`.
- `/` prerenders as a static route.
- `npm run build && npm run start`, then `curl POST /api/generate` with no
  `GOOGLE_AI_API_KEY` set: returns
  `{"error":"AI isn't configured yet..."}` at HTTP 503, and `/` still
  returns 200.

## Out of scope / untestable until a live key exists

- Whether `gemini-2.0-flash` is still a valid/current model name.
- Real recipe quality/coherence, and whether the model reliably keeps the
  user's ingredients central rather than burying them under added staples.
- No dietary-restriction or nutrition-info handling in this pass.
