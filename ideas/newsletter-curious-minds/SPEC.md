# Newsletter for Curious Minds

## What the MVP does

- **Landing page + signup** (`/`) — describes the newsletter and has a
  working signup form. Submits to `POST /api/subscribe`, which validates
  the email format server-side, lowercases/trims it, and inserts into
  `newsletter_curious_minds_subscribers`. Duplicate signups (same email,
  case-insensitively) are handled gracefully — the DB has a unique index
  on `lower(email)`, and the route catches the resulting Postgres
  `unique_violation` (error code `23505`) and returns a friendly "already
  subscribed" response instead of an error.
- **Public archive** (`/archive`, `/archive/[slug]`) — 3 real sample
  issues, 5 facts each, written as static content in `content/issues.ts`
  and statically prerendered (`generateStaticParams`). Doesn't touch
  Supabase at all.

## Scope adaptations

**Actual scheduled sending is out of scope for this pass.** It needs
`RESEND_API_KEY` (not yet issued — see `docs/PLAN.md`) plus a scheduled
job (e.g. a Vercel Cron route calling Resend's batch-send API weekly).
Follow-up once that key exists: add `app/api/send-weekly/route.ts` wired
to a `vercel.json` cron entry, reading subscribers via the
`service_role` key (the anon key intentionally *cannot* read the
subscriber list — see the RLS note below) and sending that week's issue
through Resend. The signup capture itself is fully real and doesn't
depend on that follow-up.

The original one-liner mentions the newsletter being "supported by
sponsors" — no sponsorship/monetization flow is built in this pass; not
needed for the core signup-capture MVP.

## Schema summary

See `schema.sql`. One table: `newsletter_curious_minds_subscribers`
(`email` unique, plus a case-insensitive unique index on `lower(email)`
since Postgres's plain `unique` on `email` is case-sensitive and
"Alice@x.com"/"alice@x.com" would otherwise both be accepted — the app
also lowercases before insert as a first line of defense, so the DB
index is a backstop, not the primary defense).

RLS: `insert` is open to `anon`/`authenticated` (anyone can sign up). No
`select` policy exists at all — the subscriber list can't be read back
through this app's public anon key, only via the `service_role` key
(used only by the future send job, never exposed to the browser).

Archive content (`content/issues.ts`) is static, not a table — see scope
note above for why.

## Accuracy check on the facts (issue-by-issue)

All 15 facts across the 3 issues are well-established, broadly-cited
facts (astronomy, basic biology, and computing history), not obscure or
contested claims. A few notes on precision, since "genuinely interesting
and accurate" was an explicit requirement:

- Issue 1 (space): Venus's day-longer-than-year fact and Saturn's density
  are precise textbook figures. The neutron-star and Sun-volume figures
  are stated as approximations ("about a billion tons", "roughly 1.3
  million Earths") because that's genuinely the right level of precision
  — these are order-of-magnitude facts, not exact figures, and the copy
  says so rather than implying false precision.
- Issue 2 (biology): the "~60% DNA shared with a banana" fact is
  deliberately framed as an estimate with the *reason* attached (shared
  basic cellular machinery), rather than a bare, over-precise number —
  it's a real, commonly-cited comparative-genomics approximation, not an
  exact figure, and overstating its precision would be the inaccurate
  version of this fact.
- Issue 3 (tech history): this issue deliberately *corrects* two popular
  myths instead of repeating them — (1) the Grace-Hopper-invented-the-word
  "bug" version of the moth story (the word predates the 1947 incident;
  Edison used it in 1878) and (2) QWERTY-was-designed-to-slow-typists-down
  (historians now attribute the layout to telegraph-transcription
  efficiency instead). Both corrections are the more accurate, better-
  sourced version of stories that get told inaccurately most of the time.

## What needs a live Supabase project to actually verify

- `/api/subscribe` can't be exercised end-to-end without a real Supabase
  project — the Route Handler code is safe at build time (Route Handlers
  never run during `next build`) but genuinely untested against a real
  database. Once live, verify: a fresh signup succeeds, a duplicate
  (including different-case) signup returns the friendly "already
  subscribed" response rather than a 500, and an invalid email is
  rejected before it ever reaches Supabase.
- The future weekly-send follow-up (Resend + cron) is entirely unbuilt,
  by design — see the scope note above.
