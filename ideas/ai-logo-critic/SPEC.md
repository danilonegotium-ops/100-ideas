# AI Logo Critic — SPEC

## What the MVP does

A single stateless page (`app/page.tsx`, no accounts, no DB — this idea's
Supabase plumbing was removed from the shared template since it's never
used, see below):

1. Upload a logo image (PNG/JPEG/WEBP/GIF, capped at 4MB client- and
   server-side).
2. Preview renders immediately (plain `<img>` from a `data:` URL — Next's
   `<Image>` component doesn't handle data URLs without extra config, not
   worth it for a single preview).
3. "Get feedback" sends the image as base64 to `/api/critique-logo`, a
   server-side Route Handler that calls Gemini with **multimodal input**
   (a text prompt part + an `inlineData` image part in the same
   `generateContent` request) and asks for structured JSON feedback.
4. Results render as four sections: color balance, readability, modern
   design trends, and a 1-10 overall score with a one-line summary.

## AI call — multimodal (vision) input

`app/api/critique-logo/route.ts` sends `generateContent` a `parts` array
with two entries: `{ text: <critique prompt> }` and `{ inlineData: {
mimeType, data: <base64> } }`, requesting `responseMimeType:
"application/json"` for a structured `{ color_balance, readability,
modern_trends, overall_score, summary }` response. `lib/ai/gemini.ts` is
the same raw-REST wrapper used across all Wave 4/5 ideas (`gemini-2.0-flash`
default, overridable via `GOOGLE_AI_MODEL`), just called with an extra
`inlineData` part instead of text-only.

**Not live-verified**: no real Google AI Studio key exists yet in this
sprint (see `MASTER_TRACKER.md`). The `inlineData`/`mimeType` field naming
for the image part reflects the documented `v1beta` REST JSON mapping —
worth a real check once a key exists, since some Gemini docs/examples use
snake_case (`inline_data`/`mime_type`) instead; protobuf JSON parsers
generally accept both, but this hasn't been exercised against the live API.

**Graceful degradation:**
- No `GOOGLE_AI_API_KEY` → route returns `{ configured: false }`, UI shows
  a clear "not configured yet" message instead of erroring.
- Call fails / model returns unexpected shape → route returns a 502 with an
  `error` message, UI shows it inline rather than a dead-end.

## Scope adaptations

- **Removed this idea's unused Supabase/auth plumbing** (`app/login`,
  `app/auth/callback`, `lib/supabase/*`, `middleware.ts`, and the
  `@supabase/*` deps from `package.json`) — this tool is stateless (upload,
  analyze, done), no accounts needed, so the template's auth scaffolding
  would just be dead code. `.env.local.example` only lists
  `GOOGLE_AI_API_KEY`/`GOOGLE_AI_MODEL`.
- **No history/save** — each critique is one-off; nothing persisted. If
  this needs "save your past critiques" later, it'd need Supabase added
  back in (namespaced `ai_logo_critic_*` tables per `docs/PLAN.md`).
- 4MB image size cap and a fixed allow-list of image MIME types
  (PNG/JPEG/WEBP/GIF), enforced both client-side (before upload) and
  server-side (defense in depth — never trust the client-side check alone).
