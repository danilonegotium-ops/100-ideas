# Employee Onboarding Checklist — SPEC

## What the MVP does

Two roles share one app, both authenticated via the same magic-link flow:

- **HR admin** (`/dashboard`): creates reusable checklist templates (name + one task per line),
  assigns a template to a new hire by name + email (this snapshots the template's current tasks
  onto a new `onboarding`, so later template edits never retroactively change an in-progress
  hire's checklist), and sees every active onboarding with a live progress bar
  (`X/Y tasks complete`) and an expandable read-only view of which tasks are done.
- **New hire** (`/my-onboarding`): logs in with whatever email HR assigned them under — no
  pre-created account, no invite flow beyond "HR typed your email into a form" — and sees their
  own checklist with checkboxes to mark tasks complete/incomplete.

The homepage shows both entry points once logged in, since the same login works for either role
depending on which email address was used.

## Scope adaptations / design calls

- **"Send a welcome flow"** is realized as: HR assigns a template to a hire's email, and that
  email's owner sees their checklist immediately upon logging in via magic link. There's no
  separate "invite" email with a custom message in this pass — signing in with the assigned email
  IS the welcome flow. Adding a custom Resend-sent welcome email (same optional-env-var pattern as
  Automated Invoice Chaser) would be a natural next step, not built here to keep this pass focused.
- **Templates vs. onboardings is snapshot-based**, not a live reference. `assignOnboarding` in
  `app/dashboard/actions.ts` copies each `template_tasks` row into a new `onboarding_tasks` row at
  assignment time. This is deliberate — see the comment block at the top of `schema.sql`.
- **RLS simplification, explicitly documented in `schema.sql`:** a hire's UPDATE policy on
  `onboarding_tasks` allows updating the whole row (not just `completed`), because Postgres RLS
  can't restrict to specific columns without an extra view/RPC layer. A hire could theoretically
  rename their own task — a data-integrity nuisance, not a cross-tenant security issue, since the
  `WITH CHECK` still requires the row to keep matching their own `hire_email` after the update, and
  RLS still fully blocks touching any other hire's rows. Flagged as a hardening candidate (a
  `toggle_onboarding_task(task_id, completed)` SECURITY DEFINER function) before real external use.
- **Case-insensitive email matching.** Both the RLS policies (`lower(hire_email) =
  lower(auth.jwt() ->> 'email')`) and the app's own queries (`.ilike("hire_email", user.email)`)
  match case-insensitively, since there's no guarantee HR types an email in the exact same casing
  the hire later signs in with.
- **Dashboard queries explicitly filter by owner, not just RLS**, consistent with the same pattern
  used in Testimonial Collector: `onboardings` has two audiences (owner sees all their hires;
  hires see only their own row), so `app/dashboard/page.tsx` explicitly adds `.eq("user_id",
  user.id)` / `.eq("owner_id", user.id)` rather than relying solely on RLS to scope the result set.

## Schema summary (`schema.sql`, seed data in `seed.sql`)

- `employee_onboarding_checklist_templates` / `..._template_tasks` — reusable checklist
  definitions, owner-only.
- `employee_onboarding_checklist_onboardings` / `..._onboarding_tasks` — per-hire snapshots.
  `onboarding_tasks` denormalizes `owner_id` and `hire_email` directly (rather than joining back
  through `onboardings`) so both audiences' RLS policies are simple direct-column predicates.
- RLS: owner has full CRUD on everything they own (`templates`, `template_tasks` via subquery,
  `onboardings`, `onboarding_tasks`); the hire gets read-only access to their own `onboardings`
  row(s) and read+toggle access to their own `onboarding_tasks` rows, both matched by email.
- Seed data: one 8-task template ("Standard Engineering Onboarding") and 3 demo onboardings at
  different completion states (nearly done, just started, fully complete).

## What still needs a live Supabase project to verify end-to-end

- **RLS policy correctness**, especially `auth.jwt() ->> 'email'` — this reads the `email` claim
  directly off the JWT rather than using a wrapper function, since that's the most fundamental,
  version-stable Supabase RLS primitive; never executed against a real Postgres instance with a
  real JWT, so worth a real login test (both as the HR admin and as a hire) before trusting it.
- **Seed data — two different fixups needed.** The HR-owner side needs the usual placeholder UUID
  swap (`00000000-0000-0000-0000-000000000001` → a real `auth.users.id`, see the comment block at
  the top of `seed.sql`). The **hire** side needs at least one seeded `hire_email` changed to an
  inbox you can actually sign into, to click through `/my-onboarding` — instructions for that are
  also in `seed.sql`'s header comment.
- **`npm run build` / `tsc` / `lint`** were run locally with no `.env.local` and pass — confirms
  the app doesn't need live credentials to build, not that the Supabase queries are correct
  against a real schema.
