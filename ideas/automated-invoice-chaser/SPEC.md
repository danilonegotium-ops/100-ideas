# Automated Invoice Chaser — SPEC

## What the MVP does

A single-tenant-per-user invoice tracker. A business owner logs in via magic link, manually adds
invoices (client name, client email, amount, due date, optional notes), and gets:

- A dashboard of three totals: outstanding (all unpaid), overdue (unpaid + past due date), and
  paid-to-date.
- A table of every invoice, sorted overdue-first, with a status badge (Overdue / Pending / Paid /
  Void).
- A "Send reminder" action per pending invoice. If `RESEND_API_KEY` is set, it actually emails the
  client via Resend's HTTP API (`POST https://api.resend.com/emails`). If not set, it logs a row
  to the reminders table describing exactly what would have been sent (visible in the UI as "Last
  reminder: ... (logged)") instead of silently doing nothing or throwing.
- "Mark paid" / "Void" / "Delete" actions per invoice.

Everything is a Server Action (`app/invoices/actions.ts`) called directly from small Client
Components — no hand-written `/api` routes needed for CRUD, consistent with the template's App
Router conventions.

## Scope adaptations

- **"Connects to accounting software" → manual entry.** The original one-liner assumes OAuth
  integration with QuickBooks/Xero/etc, which needs partner-app approval from each platform — not
  achievable this sprint. Manual entry keeps the core value (overdue tracking + reminders) intact.
- **Overdue is derived, not stored.** `status` only has `pending` / `paid` / `void`. "Overdue" is
  computed as `status = 'pending' AND due_date < today` both in SQL-adjacent app logic
  (`lib/types.ts#isOverdue`) and could be recomputed identically in a raw SQL query — this avoids
  needing a cron job to flip a stored status and can never drift out of sync with the calendar.
- **Email sending is best-effort and env-gated.** `RESEND_API_KEY` / `RESEND_FROM_EMAIL` are
  optional. Every reminder attempt is logged to `automated_invoice_chaser_reminders` regardless of
  whether the email actually sent, so the "did I already remind this client" question always has
  an answer even before Resend is configured.
- **No client/contact table.** Client name + email live directly on the invoice row rather than a
  separate `clients` table, since this MVP doesn't need a client directory — just "who to remind
  about this specific invoice."

## Schema summary (`schema.sql`, seed data in `seed.sql`)

- `automated_invoice_chaser_invoices` — one row per invoice, `user_id` scopes ownership. Trigger
  keeps `updated_at` current.
- `automated_invoice_chaser_reminders` — append-only log of reminder attempts, one row per click of
  "Send reminder", with `delivery_status` of `sent` / `logged` / `failed`.
- RLS: every table scoped `auth.uid() = user_id` for select/insert/update (delete only on
  invoices; reminders are append-only, no delete/update policy on purpose — it's meant to be an
  audit trail).

## What still needs a live Supabase project to verify end-to-end

- **The actual RLS behavior.** Policies were written by reading the Supabase RLS pattern
  (`auth.uid() = user_id`, `references auth.users(id)`) and match the same shape as the template's
  own auth code, but have never executed against a real Postgres instance. Double-check with the
  Supabase SQL editor's policy tester or a real login once the project exists.
- **Seed data visibility.** `seed.sql` inserts against a placeholder user UUID
  (`00000000-0000-0000-0000-000000000001`). It must be swapped for a real `auth.users.id` (from a
  real magic-link sign-up) before the seeded invoices will show up for anyone — see the comment
  block at the top of `seed.sql`.
- **Resend delivery.** The `dispatchReminderEmail` call in `app/invoices/actions.ts` was written
  against Resend's documented request shape (`Authorization: Bearer <key>`, POST JSON with
  `from`/`to`/`subject`/`text`) but has not been executed against the real API. Send a real test
  reminder once `RESEND_API_KEY` exists and confirm the email actually arrives (and that a bad key
  correctly produces a `failed` row rather than a crash).
- **`npm run build` / `tsc` / `lint`** were run locally with empty env vars and pass (see below) —
  that only proves the app doesn't need live credentials to build, not that the Supabase queries
  are correct against a real schema.

## Verification performed this pass

`npm install && npm run build && npx tsc --noEmit && npm run lint` all pass with no
`.env.local` (i.e. no Supabase credentials configured) — `/` prerenders static, `/invoices`
correctly renders as a dynamic route (it calls `getUser()`, which reads cookies and therefore
opts out of static generation), `/login` and `/auth/callback` unchanged from the template.
