# Financial Literacy for Teens

## What the MVP does

- **Curriculum overview** (`/`) — public. Shows all 6 lessons (Saving,
  Budgeting, Compound Interest, Basic Investing, Credit, Taxes) pulled
  from the database, a "your progress" summary if logged in, and a top-5
  leaderboard preview.
- **Lesson + quiz** (`/lessons/[id]`) — requires magic-link login (redirect
  to `/login?next=...` if not signed in). First visit ever prompts for a
  one-time display name (first name or initials only — see below), then
  shows the lesson content and a 3-question multiple-choice quiz.
  Submitting scores it client-side, computes points (`round(score/total *
  points_available)`) and a badge (gold = 100%, silver = 80%+, bronze =
  anything else), and upserts one row per user per lesson — retaking a
  lesson updates the same row rather than creating duplicates.
- **Leaderboard** (`/leaderboard`) — public. Top point-earners, ranked by
  total points across all completed lessons, showing only the
  self-chosen display name.

## Scope adaptations / choices

- **Display names, not emails**: the task requires "first names/initials
  only, no sensitive data" on the leaderboard. Magic-link auth only gives
  us an email, so there's a small `financial_literacy_teens_profiles`
  table where the user picks their own display name the first time they
  open a lesson (`components/ChooseNameForm.tsx`) — never derived
  automatically from their email.
- **Seed data is the curriculum, not fake users**: per the task's
  explicit instruction, `schema.sql` seeds all 6 lessons and their 18 quiz
  questions (3 per lesson), but the `progress`/`profiles` tables are left
  empty — the leaderboard and "your progress" both render honest empty
  states until real users play.
- Lesson content is stored in the database (`lessons.content`, plain text
  with blank-line paragraph breaks rendered via `whitespace-pre-line`)
  rather than hardcoded in the app, so it's genuinely "real" seed data as
  asked, not static TS.
- Quiz is 3 questions per lesson (not exhaustive) — enough to meaningfully
  gate the badge tiers without turning this into a full course exam.

## Schema summary

See `schema.sql`. Four tables plus a view:

- `financial_literacy_teens_lessons` / `..._quiz_questions` — public
  read-only curriculum content, seeded.
- `financial_literacy_teens_progress` — one row per `(user_id,
  lesson_id)` (unique constraint; upserted on retake). `user_id` is a
  **real, non-nullable** FK into `auth.users` — no seed-data workaround
  needed here since there's no seed progress by design.
- `financial_literacy_teens_profiles` — `user_id`-keyed display name.
- `financial_literacy_teens_leaderboard` — a `security_invoker = on` view
  that sums `points_earned` per user and joins in the display name, so
  the leaderboard query is a single `select` instead of hand-rolled
  aggregation in the Supabase JS client (which doesn't have a clean
  `GROUP BY` helper).

RLS: lessons/questions are public-select (no writes from the app).
Progress and profiles are public-select (points aren't sensitive, and the
leaderboard needs to read totals across everyone) but writable only by
`user_id = auth.uid()`.

## What needs a live Supabase project to actually verify

- Every data-driven page (`/`, `/lessons/[id]`, `/leaderboard`) is a
  Server Component using `lib/supabase/server.ts` — excluded from static
  generation at build time (safe with empty env vars) but genuinely
  untested against a real database.
- The `financial_literacy_teens_leaderboard` view, including
  `security_invoker = on`, hasn't been run against a real Postgres
  instance. Postgres added `security_invoker` for views in v15 — Supabase
  runs a PG15+ image, so this should apply, but confirm the view actually
  creates without error once `schema.sql` runs live, and that the
  `GRANT SELECT` on it is sufficient for `anon`/`authenticated` to query
  it given the underlying tables' RLS.
- The `upsert(..., { onConflict: "user_id,lesson_id" })` call in
  `components/QuizClient.tsx` relies on the `unique (user_id, lesson_id)`
  constraint in `schema.sql` — worth confirming a real retake correctly
  updates the existing row instead of erroring once there's a live
  project to test against.
