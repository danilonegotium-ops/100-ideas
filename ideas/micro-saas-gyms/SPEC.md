# Micro-SaaS for Gyms — SPEC

## What the MVP does

A single-tenant-per-user member tracker for a boutique gym/studio owner. After logging in via
magic link, the owner gets:

- A dashboard with three live counts: active members, checked in today, and expiring soon
  (within 7 days).
- A member list (name, plan, subscription end date, status) with actions to renew (pick a new end
  date), cancel/reactivate, or remove a member.
- A check-in flow: type a member's name, matching members appear with a "Check in" button, which
  logs a timestamped row. A "Recent check-ins" panel shows the last 10 check-ins across all
  members.

Everything is a Server Action (`app/dashboard/actions.ts`) called from small Client Components.

## Scope adaptations / design calls

- **Membership state is hybrid: one stored override + one derived value.** `status` only stores
  `active` / `cancelled` (an explicit manual choice by the owner). "Expiring soon" and "expired"
  are *derived* at read time from `subscription_end` vs today
  (`lib/types.ts#membershipState`) rather than stored — this avoids needing a daily cron job to
  flip a status column as dates pass, and can't drift out of sync with the calendar. See the
  comment block at the top of `schema.sql` for the full reasoning.
- **"Active members" on the dashboard includes "expiring soon".** A membership expiring in 3 days
  is still active today — "expiring soon" is a highlighted subset for the owner's attention, not a
  separate population. Only `expired` and `cancelled` are excluded from the active count.
- **Check-in is a simple append-only log**, not a "session" concept with duration/checkout. The
  spec asked for "manual check-in button by member name/search, records timestamp" — that's
  exactly what's built. No check-out, no capacity limits.
- **No photo/avatar upload.** Kept out of scope to avoid a Supabase Storage dependency for
  something the spec didn't ask for (unlike Testimonial Collector, where storage is core to that
  idea).

## Schema summary (`schema.sql`, seed data in `seed.sql`)

- `micro_saas_gyms_members` — one row per member, `user_id` scopes ownership. Trigger keeps
  `updated_at` current.
- `micro_saas_gyms_checkins` — append-only attendance log, one row per check-in click.
- RLS: every table scoped `auth.uid() = user_id` for select/insert/update (delete only on
  members; check-ins have no update/delete policy — it's an audit trail).
- Seed data: 15 demo members spanning active (various expiry horizons out to 120 days), expiring
  within 7 days, already expired, and cancelled — plus a handful of check-ins (some today, some
  over the last two days) so the dashboard's three stat cards are all non-zero on first login.

## What still needs a live Supabase project to verify end-to-end

- **RLS policy correctness** — written against the same `auth.uid() = user_id` pattern used
  throughout this sprint, but never executed against real Postgres. Verify with a real login.
- **Seed data visibility** — `seed.sql` inserts against the placeholder UUID
  `00000000-0000-0000-0000-000000000001`; swap it for a real `auth.users.id` first (see the
  comment block at the top of `seed.sql`), otherwise RLS will hide every seeded row from every
  real user.
- **`npm run build` / `tsc` / `lint`** were run locally with no `.env.local` and pass — confirms
  the app doesn't need live credentials to build, not that the Supabase queries themselves are
  correct against a real schema.
