# Sponsorship Manager — SPEC

## What the MVP does

A single-tenant-per-user CRM for tracking brand sponsorship deals. After logging in via magic
link, the creator gets:

- A kanban board with 5 columns (Prospecting, Negotiating, Signed, Paid, Declined), each deal
  shown as a card with sponsor name, contact, deal value, next action, and notes. Per-column
  running totals of deal value.
- Per-deal actions: move forward/backward through the pipeline, decline (jumps straight to the
  Declined column from any stage), inline-edit notes/next-action/next-action-date/deal-value, and
  delete.
- An "Add deal" form capturing sponsor name, contact name/email, deal value, next action + date,
  and notes.
- Dashboard totals: total deal count, in-progress value (negotiating + signed), paid-to-date
  value.

Everything is a Server Action (`app/dashboard/actions.ts`) called from Client Components.

## Scope adaptations / design calls

- **No separate contacts table.** A sponsor contact (name/email) lives directly on the deal row
  rather than a normalized `contacts` table, since in this context a contact is effectively 1:1
  with a single deal/outreach thread, not a shared address book reused across many deals.
- **"Move forward/backward" is a fixed linear order** (`prospecting → negotiating → signed →
  paid`), with `declined` reachable as a one-way jump from any of the first three stages (not part
  of the forward/backward flow — you don't "move forward" into declined, you explicitly decline).
  This matches how a real sponsorship pipeline actually behaves: paid deals don't get declined,
  and declining isn't a normal forward step.
- **Kanban interaction is buttons, not drag-and-drop.** Deliberately skipped a
  drag-and-drop library (extra dependency, non-trivial to get keyboard-accessible) in favor of
  explicit "← stage" / "stage →" buttons per card, which is fully functional and testable without
  the complexity.
- **No outreach email tracking/sending in this MVP** — despite the original one-liner mentioning
  "outreach emails," this pass focuses on pipeline/CRM tracking (stages, contacts, notes, next
  actions). Actually sending/tracking outreach emails would need the same Resend integration
  pattern as Automated Invoice Chaser; flagged here as a natural next feature rather than built
  now, to keep this pass scoped to what's clearly "the CRM."

## Schema summary (`schema.sql`, seed data in `seed.sql`)

- `sponsorship_manager_deals` — one row per sponsor deal, `user_id` scopes ownership, `stage`
  constrained to the 5 pipeline values. Trigger keeps `updated_at` current.
- RLS: scoped `auth.uid() = user_id` for select/insert/update/delete.
- Seed data: 8 demo deals spread across every stage (2 prospecting, 2 negotiating, 1 signed, 2
  paid, 1 declined) with realistic sponsor names, notes, and next actions.

## What still needs a live Supabase project to verify end-to-end

- **RLS policy correctness** — written against the same `auth.uid() = user_id` pattern used
  throughout this sprint, never executed against real Postgres. Verify with a real login.
- **Seed data visibility** — swap the placeholder UUID
  (`00000000-0000-0000-0000-000000000001`) in `seed.sql` for a real `auth.users.id` first (see the
  comment block at the top of that file).
- **`npm run build` / `tsc` / `lint`** were run locally with no `.env.local` and pass — confirms
  the app doesn't need live credentials to build, not that the Supabase queries are correct
  against a real schema.
