# Vrtić Management Tool — SPEC

## What the MVP does

A private-kindergarten portal, built on `_shared/nextjs-template`:

- **Teacher auth**: magic-link login (template default). A logged-in user is a "teacher" and owns any group they create.
- **Teacher dashboard** (`/dashboard`, protected): list groups, create a group.
- **Group management** (`/dashboard/[groupId]`, protected, owner-only): add children (with optional parent name/email), a 7-day attendance grid with a one-click "mark today" form per child, a daily-menu form (breakfast/lunch/snack, upsert per date), and a photo-post composer.
- **Parent view** (`/parent`, protected — any logged-in user, not just invited parents, can visit the URL, but sees nothing unless the database says so): shows every child linked to the logged-in email, with that child's own attendance, the group's recent menus, and the group's photo posts. Access is enforced entirely by RLS (see below), not by application-level filtering — `getGroupsForParent` just selects from `children`/`groups` with no manual `WHERE parent_email = ...`, and the database only returns rows the policy allows.
- **Landing page** (`/`) explains the product for both audiences.

## Scope adaptations / design calls

- **"Share photos... securely" was taken literally**, unlike Digitalni Upravnik's intentionally-public notice board. There's no unguessable-link pattern here — a parent must sign in via magic link with the *same email address* the teacher entered as that child's contact. Two SECURITY DEFINER SQL helper functions (`vrtic_is_parent_of_child`, `vrtic_is_group_member` in `schema.sql`) do the email match inside RLS policies without ever granting parents direct SELECT on the PII table (`child_contacts`) itself.
- **No real photo uploads.** Per the task brief ("use a solid-color placeholder image or simple SVG illustration, not a real child's photo"), `photo_posts.placeholder_key` is a fixed enum (`sun`, `balloons`, `painting`, ...), not free text and not Supabase Storage. The frontend (`components/PlaceholderIllustration.tsx`) maps each key to a hardcoded emoji + background color. This also sidesteps a real XSS risk: letting a teacher submit arbitrary SVG/HTML to be rendered for parents would be a stored-XSS vector, so it's deliberately not built that way even as a "nice to have."
- **Attendance privacy is per-child, not per-group.** A parent can only read their own child's attendance/name row; the *shared* content (daily menu, photo posts) is visible to every parent in the group, since those genuinely are group-wide announcements. This distinction is enforced by two different RLS shapes (`vrtic_is_parent_of_child(id)` for `children`/`attendance_records`, vs. `vrtic_is_group_member(group_id)` for `daily_menus`/`photo_posts`) — worth double-checking live, see below.
- **No edit/delete UI** for children, menus, or photo posts (attendance uses `upsert` so re-marking the same day corrects it) — same "create-first" MVP scope call as Digitalni Upravnik.

## Schema summary (`schema.sql`, seed data in `seed.sql`)

Tables (prefix `vrtic_management_tool_`): `groups`, `children`, `child_contacts` (PII, teacher-only), `attendance_records` (unique per `child_id, attendance_date`), `daily_menus` (unique per `group_id, menu_date`), `photo_posts`.

RLS: nothing is `using (true)` in this idea — every SELECT policy calls one of the three SECURITY DEFINER helper functions to check "is this the teacher of the group" or "is this the matched parent of this specific child" (see the big comment block at the top of `schema.sql` for the full reasoning). Writes are always teacher-only.

Seed (`seed.sql`): one group "Sunčeva grupa" with 10 children (name + birth date + a `parentN@example.com` contact each), 5 weekdays of attendance for all 10 (one `sick` entry for variety), 2 daily menus, 2 photo posts. Same "no way to seed a real login from SQL" caveat as Digitalni Upravnik — see the comment block at the top of `seed.sql` for the exact steps (sign in as teacher once, then optionally sign in as `parent1@example.com` etc. to see the parent view for real).

## What's genuinely untestable until Supabase is live

- The parent-view RLS is the highest-risk part of this idea to get subtly wrong — it's reasoned through carefully (three SECURITY DEFINER functions, each checked against the JWT email claim via `auth.jwt() ->> 'email'`) but **never executed against a real Postgres instance**. Specifically worth a manual live test once Supabase exists: (1) a parent really can only see their own child, not siblings' groupmates; (2) a parent really can see the shared `daily_menus`/`photo_posts` for their child's group; (3) `auth.jwt() ->> 'email'` actually contains the signed-in user's email in this Supabase project's JWT shape (this is standard, but hasn't been confirmed against a live token).
- The `upsert` calls in `lib/actions.ts` (`markAttendance`, `upsertDailyMenu`) rely on the named `unique (child_id, attendance_date)` / `unique (group_id, menu_date)` constraints matching the `onConflict` column list exactly — only verifiable once real inserts happen against the live schema.
- Magic-link auth round-trip — unmodified from the template, needs a live project to actually send/receive an email.
- `npm run build`, `npx tsc --noEmit`, `npm run lint` all pass locally with empty env vars (see handoff notes).
