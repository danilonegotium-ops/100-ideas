# AI Resume Optimizer

## What it does

Single-page tool: user pastes a job description and their resume text.
The server calls Gemini to identify important keywords from the job
description that are missing (or weakly present) in the resume, with a
short suggestion for where to naturally add each one. No accounts, no
database — fully stateless, single-shot.

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
- `lib/prompt.ts` — pure functions: `buildPrompt(jobDescription, resume)`
  builds a prompt instructing the model to return ONLY a JSON array of
  `{keyword, suggestion}` objects (capped at 10 keywords), explicitly
  telling it not to suggest fabricating experience the applicant doesn't
  have. `parseMissingKeywords(rawText)` parses+validates that JSON
  (stripping a markdown code fence if present), returning `null` on any
  shape mismatch so the caller can fall back to raw text.
- `app/api/analyze/route.ts` — Route Handler. Validates both fields are
  present and under length caps (`MAX_JOB_DESCRIPTION_LENGTH = 6000`,
  `MAX_RESUME_LENGTH = 6000` — generous enough for a real job posting and
  full resume, while bounding cost). Returns 503 with a friendly message if
  no API key, 502 if the Gemini call fails, and on success either the
  parsed `keywords` array or the model's `raw` text if parsing failed.
- `components/ResumeForm.tsx` — Client Component with two textareas
  (character counters), loading state, keyword-list results, raw-text
  fallback, and inline error display (including the "AI isn't configured"
  message).
- `app/page.tsx` — Server Component, calls `isConfigured()` (env var read
  only, safe at build time) to show a persistent "AI isn't configured"
  banner up front when no key is set, so the page stays fully
  browsable/demoable without a live key.

## Sanity-checked without a live key

`lib/prompt.ts`'s pure functions were compiled standalone and exercised
against hand-built mock data: a realistic mock two-keyword JSON array
parsed correctly both raw and wrapped in a ```` ```json ``` ```` fence, and
a prose (non-JSON) response correctly returned `null` from
`parseMissingKeywords`, which triggers the raw-text UI fallback. This is a
best-effort mock of Gemini's documented response shape, not verified
against a live call.

## Verified

- `npm install && npm run build && npx tsc --noEmit && npm run lint` all
  pass clean with no `.env.local`.
- `/` prerenders as a static route.
- `npm run build && npm run start`, then `curl POST /api/analyze` with no
  `GOOGLE_AI_API_KEY` set: returns
  `{"error":"AI isn't configured yet..."}` at HTTP 503, and `/` still
  returns 200.

## Out of scope / untestable until a live key exists

- Whether `gemini-2.0-flash` is still a valid/current model name.
- Real quality of keyword extraction and suggestion phrasing (e.g. whether
  the model reliably avoids suggesting fabricated experience as instructed).
- No resume parsing beyond plain text — PDFs/DOCX are out of scope; the
  user must paste text.
