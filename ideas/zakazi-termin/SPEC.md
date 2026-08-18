# Zakazi Termin — SPEC

## What the MVP does

A booking system for barbershops/salons, built on `_shared/nextjs-template`:

- **Owner auth**: magic-link login. A logged-in user is a "shop owner" and owns any shop they create.
- **Shop dashboard** (`/dashboard`, protected): list the owner's shops, create a new one.
- **Shop management** (`/dashboard/[shopId]`, protected, owner-only): generate a day's worth of slots in one submission (date + working hours + slot duration + service name — `lib/slots.ts`'s `generateSlotsForDay` does the actual math as a pure, isolated function), see every upcoming slot grouped by day with who's booked it, and cancel a booking (which reopens the slot).
- **Public booking page** (`/s/[shopId]`, no login required): shows every open slot grouped by day; a customer picks one, enters name + email, and books — no account needed.
- **Email confirmation + reminder-ready endpoint**: on successful booking, a confirmation email is sent via Resend (see Scope adaptations). `app/api/send-reminders/route.ts` is a separate, idempotent endpoint that finds confirmed bookings starting within 24h with no reminder sent yet and emails them — written and functional, but not wired to an actual scheduler yet (see below).

## Scope adaptations / design calls

- **SMS -> email.** The original idea says "sends SMS reminders." Twilio (SMS) costs money even at low volume; Resend's free tier doesn't. `lib/email/sendEmail.ts` calls Resend if `RESEND_API_KEY` is set, else logs to the server console and no-ops — the booking flow itself never blocks or errors on a missing/failed email.
- **The reminder is a ready endpoint, not a running cron job.** A "reminder" implies a delayed send closer to the appointment, which needs a scheduler. `app/api/send-reminders/route.ts` is idempotent and safe to call repeatedly (already-reminded bookings are skipped via `reminder_sent_at`), and takes an optional `CRON_SECRET` to prevent abuse once deployed — but there's no live Vercel project to actually attach a Vercel Cron trigger to yet. Wiring that up is a deploy-time follow-up, documented here rather than silently left out.
- **Booking writes go through the Supabase service-role key, not plain RLS.** A customer books with no account at all, and "is this slot still open, then atomically claim it" is a cross-table invariant a public RLS INSERT policy can't safely express (a race between two customers, or an anon client just flipping `slots.status` directly). Instead, `lib/actions.ts`'s `bookSlot` Server Action uses `lib/supabase/serviceRoleClient.ts` (bypasses RLS, server-only, never touches the browser) to check-then-write in one function. A partial unique index (`one_confirmed_booking_per_slot` in `schema.sql`) is the actual concurrency guard underneath that — even if two requests both pass the "is it open" check in the same instant, only one `INSERT` succeeds at the database level, and the other gets redirected back with "this slot was just booked."
- **Owner-initiated cancellation is two sequential updates, not one transaction** (update the booking's status, then reopen the slot) — an accepted tradeoff for a low-stakes admin action in a weekend MVP, called out explicitly rather than silently risking an inconsistent state under a rare failure between the two calls.
- **No customer login/portal.** A customer can't look up or cancel their own booking after the fact (no account = no way to authenticate a lookup). Matches "simple booking system," not a full customer account system.

## Schema summary (`schema.sql`, seed data in `seed.sql`)

Tables (prefix `zakazi_termin_`): `shops` (public read, owner write), `slots` (public read incl. `status`, owner write via normal auth — the public booking flow bypasses this via service role instead), `bookings` (owner-only read/write, no anon INSERT policy exists at all — the only INSERT path is the service-role action). `one_confirmed_booking_per_slot` is a partial unique index on `bookings(slot_id) where status = 'confirmed'`.

Seed (`seed.sql`): one shop "Frizerski Salon Stil" (Belgrade) with 30-minute slots 09:00-17:00 for the next 7 weekdays, with a handful of the first two days' slots pre-booked by demo customers.

## What's genuinely untestable until Supabase is live

- **The service-role booking flow is the highest-risk part of this idea** — it's the one place doing a manual check-then-write instead of relying purely on RLS, and it's never been run against a real Postgres instance. Specifically worth a manual live test once Supabase exists: (1) the partial unique index really does reject a second concurrent booking attempt on the same slot; (2) `createServiceRoleClient()` actually bypasses RLS as expected against this project's real service role key; (3) the two sequential writes (insert booking, then update slot status) behave correctly if the second one fails after the first succeeds (currently: the booking exists but the slot still shows 'open', which would let it be double-booked until someone notices — documented here as a known gap, not fixed, since fixing it properly needs a Postgres function/transaction which is harder to review without a live database to test against).
- `app/api/send-reminders/route.ts`'s embedded-resource query (bookings joined with slots/shops) — written carefully to avoid relying on PostgREST's to-one embedded-filter semantics (see the comment in that file), but the actual join behavior is only confirmed once run against real data.
- Resend email sending — the request shape (`POST https://api.resend.com/emails` with `from`/`to`/`subject`/`html`) matches Resend's documented API, but has not been executed against a real API key.
- Magic-link auth round-trip — unmodified template behavior, needs a live project.
- `npm run build`, `npx tsc --noEmit`, `npm run lint` all pass locally with empty env vars (see handoff notes).
