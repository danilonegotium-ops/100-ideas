# Serbian for Expats — SPEC

## What the MVP does

An interactive beginner (A1) Serbian course for expats in Belgrade/Novi Sad, built on `_shared/nextjs-template`:

- **8 real lessons** (`lib/lessons.ts`): Pozdravi i upoznavanje (greetings), Brojevi 0-20 (numbers), Naručivanje hrane i pića (ordering food & drink), Snalaženje i pravci (directions), Porodica i ljudi (family & people), Dani u nedelji i vreme (days & time), Kupovina i novac (shopping & money), Svakodnevne fraze i glagoli (everyday phrases). Each has a vocab list, a short two-person dialogue (Serbian + English), and a 5-question multiple-choice quiz.
- **Lesson content is code, not database rows** — it's fixed curated content, so it ships as plain TypeScript data (`lib/lessons.ts`), the same "content as code" approach used across this sprint's static-template ideas. Only per-user progress needs a database.
- **`/`** — lesson grid, shows a score badge per lesson if the visitor is logged in and has completed it.
- **`/lessons/[slug]`** — vocab + dialogue + an interactive quiz (`components/Quiz.tsx`, client component). Grading (`lib/quiz.ts`'s `gradeQuiz`) is a pure function, directly unit-testable. On submit, if logged in, the graded score is saved via a Server Action (`saveProgress`) called imperatively from the client component (not a `<form action>`, since the quiz needs client-side interactive state); if not logged in, the result still displays but a message explains it wasn't saved.
- **`/progress`** (protected) — every lesson with the user's score if completed, "nije rađeno" (not done) otherwise.

## Scope adaptations / design calls

- **No lesson editing/authoring UI** — the brief asked for "~8 real beginner lessons," not a CMS, so content lives in code and updating it means editing `lib/lessons.ts`, not a database migration. This is a deliberate simplicity choice, not an oversight.
- **Progress is upserted per `(user_id, lesson_slug)`**, so retaking a lesson overwrites the previous score rather than keeping a history of attempts — reasonable for "did you complete this lesson," not needed to track every attempt for a weekend MVP.
- **Serbian content accuracy**: standard, widely-known A1 vocabulary/phrases (greetings, numbers 0-20, basic food/direction/family/shopping words) — the kind of content that's stable and low-risk to get right without a live source to check against. Kept deliberately simple (no case-declension explanations, no Cyrillic) to match "beginner."

## Schema summary (`schema.sql`, seed data in `seed.sql`)

One table: `serbian_for_expats_progress` (`user_id`, `lesson_slug` matching a `Lesson.slug` in code — not a DB foreign key since lessons aren't a table —, `score`, `total`, `completed_at`), unique per `(user_id, lesson_slug)`. This is the textbook "private-per-user data" case from the task brief: RLS is fully owner-only (`auth.uid() = user_id`) on all four operations, no public/shared read at all.

Seed (`seed.sql`): 3 completed lessons for one demo user (pozdravi 5/5, brojevi 4/5, hrana-i-pice 5/5), so `/progress` isn't empty on first login. Same "sign in once, then paste the real `auth.users` id in" requirement as the other ideas in this batch — see the comment block at the top of the file.

## What's genuinely untestable until Supabase is live

- The `saveProgress` Server Action's `upsert` with `onConflict: "user_id,lesson_slug"` — only verifiable once real writes happen against the live unique constraint.
- The owner-only RLS policies are simple (`auth.uid() = user_id`, no joins) and low-risk, but still unexecuted against real Postgres until Supabase exists.
- Magic-link auth round trip — unmodified template behavior, needs a live project.
- Calling a Server Action imperatively from a Client Component (`saveProgressAction(...)` inside `useTransition`, not via `<form action>`) is a supported Next.js 14 App Router pattern, but the actual request/response round-trip through a real deployed serverless function is only exercised once deployed — locally this only ran through `next build`'s type/lint checks, not a live click-through (no browser in this environment).
