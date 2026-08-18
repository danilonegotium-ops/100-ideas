# Digital Time Capsule — SPEC

## What the MVP does

A logged-in user (Supabase magic-link email auth, from the shared template)
writes a letter to their future self on `/capsule`, picks a delivery option
— 5 years, 10 years, or a custom future date — and saves it. The letter is
stored with a computed `deliver_at` timestamp and `delivered = false`.

A Vercel Cron job (`vercel.json`, daily at 06:00 UTC) hits
`GET /api/cron/deliver`, which atomically claims every letter where
`delivered = false AND deliver_at <= now()`, then emails each one via
Resend (if `RESEND_API_KEY` is set — otherwise it logs what it would have
sent, so the claim/idempotency logic still runs correctly without a real
Resend account). `/capsule` also lists the signed-in user's own letters
with a Sealed/Delivered status.

## Idempotency — the thing to double-check once Supabase is live

See the long comment at the top of `app/api/cron/deliver/route.ts` for the
full reasoning. Short version: the delivery route does a single atomic
`UPDATE ... SET delivered = true WHERE delivered = false AND deliver_at <=
now() RETURNING *` **before** sending any email. That claim is what makes
re-running the route (duplicate cron trigger, manual re-run, Vercel retry)
safe — a letter can only ever be claimed once, so it can only ever be
queued for sending once.

The one tradeoff worth a human's attention: if the Resend request fails
*after* a row is already claimed, the letter stays `delivered = true` (not
reverted) and the failure is recorded in `delivery_error` for manual
follow-up. This was a deliberate choice — reverting `delivered` back to
`false` on a failed response is itself unsafe, because email APIs can
time out or drop a response after the send already succeeded server-side,
and auto-retrying in that case would cause the exact double-send this
design exists to prevent. **What to verify once live:** run the cron
route twice in a row against real data (e.g. `curl` it manually twice)
and confirm the second run's `claimed` count is `0` and no second email
arrives. Also worth spot-checking `delivery_error` after a deploy to catch
any letters that got claimed but never actually sent.

## Schema summary (`schema.sql`)

One table: `digital_time_capsule_letters` — `user_id` (no FK to
`auth.users`, see the comment at the top of `schema.sql` for why), a
denormalized `user_email` snapshot (needed because the cron's
service-role client can't join Supabase's internal `auth` schema — it's
not exposed via the data API), `title`/`body`, `delivery_option`,
`deliver_at`, `delivered`/`delivered_at`, and `delivery_error`. RLS: users
can select/insert their own rows and delete their own *undelivered* rows
(cancel a scheduled letter); nothing lets a client set `delivered` —
only the cron's service-role client (`lib/supabase/admin.ts`, bypasses
RLS) can do that. Seed data: 4 demo letters under one placeholder
`user_id` — one already past its `deliver_at` (for testing the cron
picks it up immediately), one 5-year, one 10-year, and one marked already
delivered (to see that UI state).

## Scope adaptations / calls made

- No edit/resend UI for delivered letters — once delivered, it's done,
  matching the "sealed until delivery" spirit of a time capsule.
- Users can cancel (delete) an undelivered letter but not edit one after
  saving — editing would need to re-validate the delivery date and felt
  like unnecessary scope for the MVP; canceling and rewriting covers the
  same need.
- Cron schedule is daily (`0 6 * * *`), matching the brief. Note: Vercel's
  free/Hobby plan limits Cron Jobs to a maximum of once per day and does
  not guarantee exact-minute execution — both are fine for "emailed the
  day it's due," not fine if exact-time delivery is ever wanted later.
- Login page / auth callback are untouched from the template (no
  `?next=` redirect-back-after-login wiring) — a minor UX rough edge, not
  a functional gap: an unauthenticated visit to `/capsule` bounces to
  `/login`, and after the magic-link completes the user lands on `/` and
  can navigate back to `/capsule` themselves.

## What's genuinely untestable until Supabase is live

- The actual magic-link auth round trip (template-level, applies to every
  Wave 3 idea).
- `RESEND_API_KEY` end-to-end (a live send, deliverability, the HTML
  actually rendering well in a real inbox) — the fetch call to
  `https://api.resend.com/emails` is written against Resend's documented
  REST shape but has never hit the real endpoint.
- Whether `CRON_SECRET` is really auto-populated as an `Authorization:
  Bearer` header by Vercel Cron once `CRON_SECRET` is set as a project env
  var — implemented per Vercel's documented behavior, but flagged here
  since it can't be confirmed without a real Vercel project.
- The seed letters need a real Supabase project's clock (`now()`) to know
  whether "due today" is actually still due by the time anyone runs this
  — by design it's always ~10 minutes in the past relative to whenever the
  SQL actually executes, not a hardcoded date.
