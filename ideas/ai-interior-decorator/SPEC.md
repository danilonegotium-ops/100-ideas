# AI Interior Decorator — SPEC

## ⚠️ HIGHEST-RISK ITEM IN THE WHOLE 90-IDEA SPRINT — READ THIS FIRST

This idea needs Gemini to return a **generated/edited image**, not just
text. As of this template's authoring, **no live `GOOGLE_AI_API_KEY`
exists anywhere in this sprint**, so the image-generation code path below
has **never been executed against the real API** — it is a best-effort
implementation of a request shape that may or may not work as written.

What's uncertain, specifically:
- Whether the configured model id (`GOOGLE_AI_IMAGE_MODEL`, defaulting to
  `"gemini-2.0-flash-preview-image-generation"`) is a real, currently
  available model name. Google has shipped native image-output Gemini
  models under a few different preview names over time; this default is a
  best guess, not a confirmed-current id.
- Whether that capability is available on the **free tier** at all (image
  generation/output is more likely than text/vision to be gated to paid
  tiers or have much tighter free-tier quotas).
- Whether `generationConfig.responseModalities: ["TEXT", "IMAGE"]` is the
  correct field to request image output via the REST API, vs. some other
  parameter shape.
- Whether the returned image actually resembles "the same room with
  furniture added" (a real image-editing task) rather than an unrelated
  generated image, even if the API call itself technically succeeds.

**Before assuming this works: get a real `GOOGLE_AI_API_KEY`, set it plus
`GOOGLE_AI_IMAGE_MODEL` (check Google AI Studio's current model list for
the real image-generation model id first), upload a real room photo, and
manually check whether `/api/decorate-room` returns `mode: "image"` with a
sensible result, or `mode: "text"` (meaning it silently fell back).**
Either outcome is a "working" state for this app (see below), but only one
of them is the originally-requested feature.

## What's real and definitely working, regardless of the above

- The full upload → preview → style-picker → submit UI
  (`app/page.tsx`).
- Client- and server-side validation (file type, 5MB size cap, style
  allow-list).
- The **fallback path**: a second, much higher-confidence Gemini call using
  the same image+text vision-input pattern already used successfully in
  `ai-logo-critic` (text-only structured JSON output, not image output) —
  this is the same kind of call, just with a different prompt, so it
  carries the same (much lower) risk level as that idea, not the
  image-generation risk level above.
- The three-tier degradation, so the product is **never a dead end**:
  1. No `GOOGLE_AI_API_KEY` → `{ configured: false }`, UI shows a clear
     "not configured yet" message.
  2. Key configured, image-generation attempt fails or returns no image
     part → **automatically** retries with the text-suggestions fallback,
     UI clearly labels the result as "Text-based suggestions (image
     generation unavailable)" — never presented as if it were the real
     generated image.
  3. Both attempts fail (e.g. key invalid, network down) → 502 with an
     inline error message.

## What the MVP does

A single stateless page (`app/page.tsx`, no accounts, no DB — Supabase
plumbing removed from the shared template, see below):

1. Upload a photo of an empty (or mostly empty) room (PNG/JPEG/WEBP, max
   5MB, validated client- and server-side).
2. Pick a style from a fixed list (`lib/interior/styles.ts`): Modern,
   Nordic/Scandinavian, Minimalist, Industrial, Bohemian, Mid-Century
   Modern, Rustic, Coastal.
3. "Decorate this room" calls `/api/decorate-room`, which:
   - Attempts real image generation/editing (see risk section above).
   - On any failure or a text-only response, falls back to structured text
     furniture-placement suggestions (summary, color palette, 4-6 key
     pieces, layout notes relative to the room's visible features).
4. UI renders whichever mode came back: a before/after image pair, or a
   clearly-labeled suggestions panel.

## Schema / data

None — fully stateless, no Supabase. `app/login`, `app/auth/callback`,
`lib/supabase/*`, `middleware.ts`, and the `@supabase/*` deps were removed
from the copied template since they're unused.

## Scope adaptations

- **No save/history/gallery** — each generation is one-off; nothing
  persisted. Adding "save your past room makeovers" later would need
  Supabase + Storage added back in.
- **No manual furniture drag-and-drop editor** as a non-AI fallback — out
  of scope for this pass; the text-suggestions fallback is the chosen
  degraded mode instead, per the task's explicit instruction to make the
  degraded path "a real, useful degraded mode, not a dead end."
- Style list is fixed/curated (8 styles), not free-text, so both the image
  prompt and the fallback prompt stay well-scoped and consistent.
