# Mood Journal with AI — SPEC

## What the MVP does

A personal, single-user daily journal (magic-link auth, no password):

- **`/`** — public landing page.
- **`/login`** — magic-link email login (template default).
- **`/dashboard`** (auth): a textarea to write today's entry (prefilled if
  you already wrote one today — saving again overwrites it). On save, the
  entry text is sent to a server-side AI route (`/api/analyze-mood`) which
  detects a mood label and a -2..2 mood score and returns them; the entry
  (with or without a mood tag) is then written to Supabase. Below that: a
  **Patterns** panel (only shown once there's enough data) and a
  **History** list of all past entries with their mood tag.

## AI call

`app/api/analyze-mood/route.ts` calls Google's Generative Language API
(`gemini-2.0-flash` by default, overridable via `GOOGLE_AI_MODEL`) as a raw
server-side `fetch`, asking for a JSON object (`{"mood_label": "...",
"mood_score": -2..2}`) via `responseMimeType: "application/json"`. Never
called from the browser — `GOOGLE_AI_API_KEY` stays server-side.

**Graceful degradation, deliberately layered:**
1. No `GOOGLE_AI_API_KEY` configured → route returns `{ configured: false }`,
   client still saves the entry with `mood_label`/`mood_score` left `null`.
2. Key configured but the call fails, times out, or the model's response
   isn't valid JSON with the expected fields → route returns a 502 with an
   `error` message, client still saves the entry, mood fields stay `null`.
3. Success → entry saves with a real mood tag.

In every case the journal itself — the actual "write and save an entry"
feature — always works. This was checked against a client with
`GOOGLE_AI_API_KEY` unset (`npm run build` and manual review of the
route's early-return path).

**Not live-verified**: no real Google AI Studio key exists yet in this
sprint. The exact request/response JSON shape (`contents[].parts[].text`,
`generationConfig.responseMimeType`, `candidates[0].content.parts[].text`)
and the default model name `gemini-2.0-flash` reflect the public `v1beta`
REST API as documented/known at template-authoring time, not a live test.
Verify once a key exists — see `MASTER_TRACKER.md`.

## Pattern insight ("you feel better on days you mention exercise")

**Not a second AI call** — a keyword-correlation heuristic computed
entirely client-side from already-stored entries (`lib/mood/insights.ts`).
Four fixed keyword themes (exercise/outdoors, poor sleep, social,
work stress/deadlines): for each theme, split all mood-scored entries into
"mentions this theme" vs "doesn't", average the mood score on each side,
and surface the theme if there's a meaningful gap (≥0.5 on the -2..2
scale) — requires at least 5 total scored entries and at least 2 entries
on each side of the split, so a single entry can't produce a misleading
claim. Sorted by magnitude, capped at 3 shown.

Verified with a standalone Node scratch script (`computeInsights` reimplemented
in plain JS) against the exact 10-entry seed fixture below and edge cases
(empty list, too few entries, all-null mood scores all correctly return
`[]`) before wiring into the UI.

## Schema (`schema.sql`)

One table, prefix `mood_journal_ai_`:

- **`entries`** — `owner_id` (→ `auth.users`), `entry_date` (date, defaults
  `current_date`, unique per `owner_id` — one entry per calendar day,
  resubmitting the same day upserts via `.upsert(..., { onConflict:
  "owner_id,entry_date" })`), `content`, `mood_label` (nullable text),
  `mood_score` (nullable smallint, checked -2..2), `created_at`.

RLS: owner-only (`auth.uid() = owner_id`) for all operations — a personal
journal, no sharing.

Seed data: 10 entries over the last 10 days with hand-assigned (not
AI-generated — no live key to call) mood labels/scores that match each
entry's content, deliberately mentioning exercise/outdoors on the
higher-mood days and work stress on the lower-mood days so the insight
panel has a genuine pattern to surface immediately, even before a real AI
key or real usage history exists. `owner_id` is a placeholder UUID — see
the comment at the top of the seed block for the swap-in-a-real-user step.

## Scope adaptations

- **One entry per day**, not free-form multiple-entries-per-day — matches
  "daily journal" from the brief and keeps the pattern-insight math simple
  (one mood score per day).
- **Fixed keyword themes**, not a user-editable or AI-discovered set — a
  small, hand-curated list keeps the heuristic legible and avoids overclaiming
  ("AI discovered this pattern" would be misleading; this is a straightforward,
  transparent keyword split).
- **No entry editing history / no delete** for this pass — resave overwrites
  the day's entry in place (upsert), but there's no "edit yesterday" flow.

## What's genuinely untestable until live

- The AI call itself (see above) — both the request shape and whether
  `gemini-2.0-flash` is still a valid/available model name.
- RLS policy behavior against a real Postgres instance.
- The magic-link login round trip (template-provided, not re-verified
  per-idea).
